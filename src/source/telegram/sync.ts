import { Api, TelegramClient } from 'teleproto'
import { count, find, pick, seedRow, update } from 'better-sqlite3-proxy'
import { TgDialog, WsChat, proxy } from '../../proxy'
import { db } from '../../db'
import { formatProgress } from '../../format'
import { GroupMetadata, MessageData } from '../../types'
import { ProgressCli } from '@beenotung/tslib/progress-cli'
import { sleep } from '@beenotung/tslib/async/wait'
import { log, writeFileSync } from './utils'
import { Dialog } from 'teleproto/tl/custom/dialog'

let select_user_without_tel = db.prepare<
  void[],
  { id: number; server: string; user: string }
>(/* sql */ `
select id, server, user
from ws_user as user
where tel is null
  and user != '0'
  and (server = 'lid' or server = 'c.us')
`)

export async function sync(client: TelegramClient) {
  let cli = new ProgressCli()

  let dialogs = await client.getDialogs()
  // writeFileSync('dialogs.json', {
  //   total: dialogs.total,
  //   length: dialogs.length,
  //   items: dialogs.map(dialogToJSON),
  // })
  let pairs = []
  let dialog_index = 0
  for (let dialog of dialogs) {
    dialog_index++
    cli.update(
      `[sync] saving dialogs... ${formatProgress(dialog_index, dialogs.length)}`,
    )
    let { dialog_id } = syncDialog(dialog)
    pairs.push({ dialog, dialog_id })
  }
  cli.nextLine()
}

function dialogToJSON(dialog: Dialog) {
  return {
    id: dialog.id,
    name: dialog.name,
    title: dialog.title,
    date: dialog.date ? new Date(dialog.date * 1000).toLocaleString() : null,
    unreadCount: dialog.unreadCount,
    type: getDialogType(dialog),
  }
}

function getDialogType(dialog: Dialog) {
  if (dialog.isUser) return 'user'
  if (dialog.isGroup) return 'group'
  if (dialog.isChannel) return 'channel'
  return 'unknown'
}

export let syncDialog = (dialog: Dialog) => {
  let dialog_row = find(proxy.tg_dialog, { api_id: dialog.id?.toString() })
  let updates: Omit<
    TgDialog,
    'id' | 'api_id' | 'user_id' | 'chat_id' | 'channel_id'
  > = {
    name: dialog.name || null,
    timestamp: dialog.date ? dialog.date * 1000 : null,
    folder_id: dialog.folderId || null,
    pinned: dialog.pinned,
    archived: dialog.archived,
    unread_count: dialog.unreadCount,
    unread_mentions_count: dialog.unreadMentionsCount,
  }
  if (!dialog_row) {
    let id = proxy.tg_dialog.push({
      api_id: dialog.id?.toString() || '',
      ...updates,
      user_id: null,
      chat_id: null,
      channel_id: null,
    })
    dialog_row = proxy.tg_dialog[id]
  } else {
    Object.assign(dialog_row, updates)
  }
  let dialog_id = dialog_row.id!

  if (dialog.isUser) {
    let user = dialog.entity as Api.User
    let user_id = seedRow(
      proxy.tg_user,
      { api_id: user.id.toString() },
      {
        username: user.username || null,
        phone: user.phone || null,
        status: statusToText(user.status),
        first_name: user.firstName || null,
        last_name: user.lastName || null,
        lang_code: user.langCode || null,
        usernames:
          user.usernames?.length! > 0 ? JSON.stringify(user.usernames) : null,
        is_self: user.id === dialog.id,
        is_deleted: false,
        is_bot: user.bot ?? null,
        is_scam: user.scam ?? null,
        is_close_friend: false,
        restrictions:
          user.restrictionReason?.length! > 0
            ? JSON.stringify(user.restrictionReason)
            : null,
      },
    )
    if (dialog_row.user_id !== user_id) {
      dialog_row.user_id = user_id
    }
  }

  if (dialog.isGroup) {
    let chat = dialog.entity as Api.Chat
    let channelId =
      chat.migratedTo instanceof Api.InputChannel
        ? chat.migratedTo.channelId
        : chat.migratedTo instanceof Api.InputChannelFromMessage
          ? chat.migratedTo.channelId
          : null
    let chat_id = seedRow(
      proxy.tg_chat,
      { api_id: chat.id.toString() },
      {
        title: chat.title,
        is_creator: chat.creator ?? null,
        is_left: chat.left ?? null,
        is_deactivated: chat.deactivated ?? null,
        is_call_active: chat.callActive ?? null,
        is_call_not_empty: chat.callNotEmpty ?? null,
        is_no_forwards: chat.noforwards ?? null,
        participants_count: chat.participantsCount
          ? chat.participantsCount
          : null,
        timestamp: chat.date * 1000,
        migrated_to_channel_api_id: channelId ? channelId.toString() : null,
      },
    )
    if (dialog_row.chat_id !== chat_id) {
      dialog_row.chat_id = chat_id
    }
  }

  if (dialog.isChannel) {
    let channel = dialog.entity as Api.Channel
    let channel_id = seedRow(
      proxy.tg_channel,
      { api_id: channel.id.toString() },
      {
        title: channel.title,
        username: channel.username || null,
        is_creator: channel.creator ?? null,
        is_left: channel.left ?? null,
        is_broadcast: channel.broadcast ?? null,
        is_restricted: channel.restricted ?? null,
        is_scam: channel.scam ?? null,
        is_slow_mode: channel.slowmodeEnabled ?? null,
        is_no_forwards: channel.noforwards ?? null,
        restrictions:
          channel.restrictionReason?.length! > 0
            ? JSON.stringify(channel.restrictionReason)
            : null,
        participants_count: channel.participantsCount ?? null,
        usernames:
          channel.usernames?.length! > 0
            ? JSON.stringify(channel.usernames)
            : null,
        level: channel.level ?? null,
        subscription_until_time: channel.subscriptionUntilDate
          ? channel.subscriptionUntilDate * 1000
          : null,
      },
    )
    if (dialog_row.channel_id !== channel_id) {
      dialog_row.channel_id = channel_id
    }
  }

  return { dialog_id }
}
syncDialog = db.transaction(syncDialog)

function statusToText(status: Api.TypeUserStatus | undefined) {
  if (!status) return null
  return status.className.replace('UserStatus', '')
}
