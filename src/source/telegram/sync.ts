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
    let dialog_id = await syncDialog(client, dialog)
    pairs.push({ dialog, dialog_id })
  }
  cli.nextLine()

  dialog_index = 0
  for (let { dialog, dialog_id } of pairs) {
    dialog_index++
    cli.update(
      `[sync] loading dialog ${dialog_index}/${dialogs.length} messages... `,
    )
    // let messages = await client.getMessages(dialog.entity, {})
    // writeFileSync(`messages_${dialog_id}.json`, messages)
    let iter = client.iterMessages(dialog.entity, {
      // oldest to newest
      reverse: true,
    })
    cli.nextLine()
    for await (let message of iter) {
      console.log({
        id: message.id,
        date: message.date,
        message: message.message,
      })
      let message_id = await syncMessage(client, { message, dialog_id })
    }
    debugger
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

async function getPeerId(
  client: TelegramClient,
  entity:
    | Api.User
    | Api.Chat
    | Api.Channel
    | Api.TypeUser
    | Api.TypeChat
    | Api.TypePeer,
): Promise<number> {
  let user_id = null
  let chat_id = null
  let channel_id = null
  if (entity instanceof Api.User) {
    let user = entity as Api.User
    user_id = seedRow(
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
        is_self: user.self ?? null,
        is_deleted: user.deleted ?? null,
        is_bot: user.bot ?? null,
        is_scam: user.scam ?? null,
        is_close_friend: user.closeFriend ?? null,
        restrictions:
          user.restrictionReason?.length! > 0
            ? JSON.stringify(user.restrictionReason)
            : null,
      },
    )
  } else if (entity instanceof Api.Chat) {
    let chat = entity as Api.Chat
    let channelId =
      chat.migratedTo instanceof Api.InputChannel
        ? chat.migratedTo.channelId
        : chat.migratedTo instanceof Api.InputChannelFromMessage
          ? chat.migratedTo.channelId
          : null
    chat_id = seedRow(
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
        is_forbidden: null,
      },
    )
  } else if (entity instanceof Api.Channel) {
    let channel = entity as Api.Channel
    channel_id = seedRow(
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
  } else if (
    entity instanceof Api.UserEmpty ||
    entity instanceof Api.ChatEmpty ||
    entity instanceof Api.PeerUser ||
    entity instanceof Api.PeerChat ||
    entity instanceof Api.PeerChannel
  ) {
    entity = await client.getEntity(entity)
    return getPeerId(client, entity)
  } else if (entity instanceof Api.ChatForbidden) {
    let chat = find(proxy.tg_chat, { api_id: entity.id.toString() })
    if (!chat) {
      chat_id = proxy.tg_chat.push({
        api_id: entity.id.toString(),
        title: entity.title,
        is_forbidden: true,
        is_creator: null,
        is_left: null,
        is_deactivated: null,
        is_call_active: null,
        is_call_not_empty: null,
        is_no_forwards: null,
        participants_count: null,
        timestamp: null,
        migrated_to_channel_api_id: null,
      })
    } else {
      chat.is_forbidden ||= true
      chat_id = chat.id!
    }
  } else {
    throw new Error('Unknown entity type: ' + entity.className)
  }
  let peer_id = seedRow(proxy.tg_peer, {
    user_id,
    chat_id,
    channel_id,
  })
  return peer_id
}

export async function syncDialog(client: TelegramClient, dialog: Dialog) {
  if (!dialog.entity) {
    throw new Error('Dialog has no entity')
  }
  let peer_id = await getPeerId(client, dialog.entity)
  return syncDialog_txn({ dialog, peer_id })
}

let syncDialog_txn = (args: { dialog: Dialog; peer_id: number }) => {
  let { dialog, peer_id } = args
  let dialog_row = find(proxy.tg_dialog, { api_id: dialog.id?.toString() })
  let updates: Omit<TgDialog, 'id' | 'api_id' | 'peer_id'> = {
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
      peer_id,
    })
    dialog_row = proxy.tg_dialog[id]
  } else {
    Object.assign(dialog_row, updates)
  }
  let dialog_id = dialog_row.id!

  return dialog_id
}
syncDialog_txn = db.transaction(syncDialog_txn)

export async function syncMessage(
  client: TelegramClient,
  args: {
    message: Api.Message
    dialog_id: number
  },
) {
  let { message, dialog_id } = args
  let forward = message.fwdFrom
  let refs: MessageRefs = {
    message: {
      from_peer_id: message.fromId
        ? await getPeerId(client, message.fromId)
        : null,
    },
    forward: {
      source_peer_id: forward?.fromId
        ? await getPeerId(client, forward.fromId)
        : null,
      saved_from_peer_id: forward?.savedFromPeer
        ? await getPeerId(client, forward.savedFromPeer)
        : null,
      saved_forwarder_peer_id: forward?.savedFromId
        ? await getPeerId(client, forward.savedFromId)
        : null,
    },
    reply_to: {
      reply_to_peer_id: message.replyTo?.replyToPeerId
        ? await getPeerId(client, message.replyTo.replyToPeerId)
        : null,
      reply_from_source_peer_id: message.replyTo?.replyFrom?.fromId
        ? await getPeerId(client, message.replyTo.replyFrom.fromId)
        : null,
      reply_from_saved_peer_id: message.replyTo?.replyFrom?.savedFromPeer
        ? await getPeerId(client, message.replyTo.replyFrom.savedFromPeer)
        : null,
      reply_from_saved_forwarder_peer_id: message.replyTo?.replyFrom
        ?.savedFromId
        ? await getPeerId(client, message.replyTo.replyFrom.savedFromId)
        : null,
    },
  }
  return syncMessage_txn({ message, dialog_id, refs })
}

type MessageRefs = {
  message: {
    from_peer_id: number | null
  }
  forward: {
    source_peer_id: number | null
    saved_from_peer_id: number | null
    saved_forwarder_peer_id: number | null
  }
  reply_to: {
    reply_to_peer_id: number | null
    reply_from_source_peer_id: number | null
    reply_from_saved_peer_id: number | null
    reply_from_saved_forwarder_peer_id: number | null
  }
}

function findPeerMessageId(args: {
  peer_id: number | null
  api_id: string | null | undefined
}) {
  let { peer_id, api_id } = args
  if (!peer_id || !api_id) return null

  let dialog = find(proxy.tg_dialog, { peer_id })
  if (!dialog) return null
  let dialog_id = dialog.id!

  return findDialogMessageId({ dialog_id, api_id })
}

function findDialogMessageId(args: {
  dialog_id: number
  api_id: string | null | undefined
}) {
  let { dialog_id, api_id } = args
  if (!api_id) return null

  let message = find(proxy.tg_message, { dialog_id, api_id })
  if (!message) return null
  return message.id!
}

let syncMessage_txn = (args: {
  message: Api.Message
  dialog_id: number
  refs: MessageRefs
}) => {
  let { message, refs } = args
  let message_id = seedRow(
    proxy.tg_message,
    {
      dialog_id: args.dialog_id,
      api_id: message.id.toString(),
    },
    {
      from_peer_id: refs.message.from_peer_id,
      is_out: message.out ?? null,
      is_mentioned: message.mentioned ?? null,
      is_media_unread: message.mediaUnread ?? null,
      is_silent: message.silent ?? null,
      is_post: message.post ?? null,
      is_from_scheduled: message.fromScheduled ?? null,
      is_pinned: message.pinned ?? null,
      via_bot_api_id: message.viaBotId?.toString() ?? null,
      timestamp: message.date * 1000,
      message: message.message,
      media: message.media ? JSON.stringify(message.media) : null,
      reply_markup: message.replyMarkup
        ? JSON.stringify(message.replyMarkup)
        : null,
      entities: message.entities ? JSON.stringify(message.entities) : null,
      view_count: message.views ?? null,
      forward_count: message.forwards ?? null,
      replies: message.replies ? JSON.stringify(message.replies) : null,
      edit_time: message.editDate ? message.editDate * 1000 : null,
      post_author: message.postAuthor ?? null,
      grouped_api_id: message.groupedId?.toString() ?? null,
      restriction_reason: message.restrictionReason
        ? JSON.stringify(message.restrictionReason)
        : null,
      ttl_period: message.ttlPeriod ?? null,
      reactions: message.reactions ? JSON.stringify(message.reactions) : null,
      is_no_forwards: message.noforwards ?? null,
    },
  )
  let fwdFrom = message.fwdFrom
  if (fwdFrom) {
    let source_message_id =
      findPeerMessageId({
        peer_id: refs.forward.source_peer_id,
        api_id: fwdFrom.channelPost?.toString(),
      }) ??
      findPeerMessageId({
        peer_id: refs.forward.saved_from_peer_id,
        api_id: fwdFrom.savedFromMsgId?.toString(),
      }) ??
      null
    // TODO after full sync, link forwards where source now exists
    // update tg_message_forward
    // set source_message_id = (...)
    // where source_message_id is null
    //   and channel_post_api_id is not null
    seedRow(
      proxy.tg_message_forward,
      { message_id },
      {
        source_message_id,
        is_imported: fwdFrom.imported ?? null,
        is_saved_out: fwdFrom.savedOut ?? null,
        source_peer_id: refs.forward.source_peer_id,
        saved_from_peer_id: refs.forward.saved_from_peer_id,
        saved_forwarder_peer_id: refs.forward.saved_forwarder_peer_id,
        post_author: fwdFrom.postAuthor ?? null,
        saved_forwarder_name: fwdFrom.savedFromName ?? null,
        saved_forwarder_timestamp: fwdFrom.savedDate
          ? fwdFrom.savedDate * 1000
          : null,
        psa_type: fwdFrom.psaType ?? null,
        source_name: fwdFrom.fromName ?? null,
        source_timestamp: fwdFrom.date * 1000,
        channel_post_api_id: fwdFrom.channelPost?.toString() ?? null,
        saved_from_msg_api_id: fwdFrom.savedFromMsgId?.toString() ?? null,
      },
    )
  }
  let replyTo = message.replyTo
  if (replyTo) {
    let reply_to_message_id =
      findPeerMessageId({
        peer_id: refs.reply_to.reply_to_peer_id,
        api_id: replyTo.replyToMsgId?.toString(),
      }) ??
      findDialogMessageId({
        dialog_id: args.dialog_id,
        api_id: replyTo.replyToMsgId?.toString(),
      }) ??
      null
    let reply_message_id =
      findPeerMessageId({
        peer_id: refs.reply_to.reply_to_peer_id,
        api_id: replyTo.replyToTopId?.toString(),
      }) ??
      findDialogMessageId({
        dialog_id: args.dialog_id,
        api_id: replyTo.replyToTopId?.toString(),
      }) ??
      null
    let reply_from_id = null
    let replyFrom = replyTo.replyFrom
    if (replyFrom && !fwdFrom) {
      let source_message_id =
        findPeerMessageId({
          peer_id: refs.reply_to.reply_from_source_peer_id,
          api_id: replyFrom.channelPost?.toString(),
        }) ??
        findPeerMessageId({
          peer_id: refs.reply_to.reply_from_saved_peer_id,
          api_id: replyFrom.savedFromMsgId?.toString(),
        }) ??
        null
      reply_from_id = seedRow(
        proxy.tg_message_forward,
        { message_id },
        {
          source_message_id,
          source_peer_id: refs.reply_to.reply_from_source_peer_id,
          saved_from_peer_id: refs.reply_to.reply_from_saved_peer_id,
          saved_forwarder_peer_id:
            refs.reply_to.reply_from_saved_forwarder_peer_id,
          post_author: replyFrom.postAuthor ?? null,
          saved_forwarder_name: replyFrom.savedFromName ?? null,
          saved_forwarder_timestamp: replyFrom.savedDate
            ? replyFrom.savedDate * 1000
            : null,
          psa_type: replyFrom.psaType ?? null,
          source_name: replyFrom.fromName ?? null,
          source_timestamp: replyFrom.date * 1000,
          channel_post_api_id: replyFrom.channelPost?.toString() ?? null,
          saved_from_msg_api_id: replyFrom.savedFromMsgId?.toString() ?? null,
          is_imported: replyFrom.imported ?? null,
          is_saved_out: replyFrom.savedOut ?? null,
        },
      )
    }
    seedRow(
      proxy.tg_message_reply,
      { message_id },
      {
        is_reply_to_scheduled: replyTo.replyToScheduled ?? null,
        is_forum_topic: replyTo.forumTopic ?? null,
        is_quote: replyTo.quote ?? null,
        is_reply_to_ephemeral: replyTo.replyToEphemeral ?? null,
        reply_to_message_id,
        reply_to_msg_api_id: replyTo.replyToMsgId?.toString() ?? null,
        reply_to_peer_id: refs.reply_to.reply_to_peer_id,
        reply_from_id,
        reply_media: replyTo.replyMedia
          ? JSON.stringify(replyTo.replyMedia)
          : null,
        reply_to_top_api_id: replyTo.replyToTopId?.toString() ?? null,
        quote_text: replyTo.quoteText ?? null,
        quote_entities: replyTo.quoteEntities
          ? JSON.stringify(replyTo.quoteEntities)
          : null,
        quote_offset: replyTo.quoteOffset ?? null,
        todo_item_api_id: replyTo.todoItemId?.toString() ?? null,
        poll_option: replyTo.pollOption ?? null,
        reply_message_id,
      },
    )
  }
  return message_id
}
syncMessage_txn = db.transaction(syncMessage_txn)

function statusToText(status: Api.TypeUserStatus | undefined) {
  if (!status) return null
  return status.className.replace('UserStatus', '')
}
