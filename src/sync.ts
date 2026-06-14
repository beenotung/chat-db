import { Client, Chat as WChat, Message as WMessage } from 'whatsapp-web.js'
import { count, find, seedRow } from 'better-sqlite3-proxy'
import { Chat, proxy } from './proxy'
import { db } from './db'
import { formatProgress } from './format'
import { mkdirSync, writeFileSync } from 'fs'
import { GroupMetadata, MessageData } from './types'
import { ProgressCli } from '@beenotung/tslib/progress-cli'
import { sleep } from '@beenotung/tslib/async/wait'

mkdirSync('res', { recursive: true })

export async function sync(client: Client) {
  let cli = new ProgressCli()
  let chats = await client.getChats()
  // writeFileSync('res/chats.json', JSON.stringify(chats, null, 2))
  let pairs = []
  let chat_index = 0
  for (let chat of chats) {
    chat_index++
    cli.update(
      '[sync] saving chats... ' + formatProgress(chat_index, chats.length),
    )
    let chat_row = syncChat(chat)
    pairs.push({ chat, chat_row })
  }
  cli.nextLine()
  chat_index = 0
  for (let { chat, chat_row } of pairs) {
    chat_index++
    let chat_id = chat_row.id!
    cli.update(`[sync] loading chat ${chat_index}/${chats.length} messages... `)
    cli.update(
      `[sync] loading chat ${chat_index}/${chats.length} messages... [open chat window]`,
    )
    await retry(() => client.interface.openChatWindow(chat.id._serialized))
    // await client.interface.openChatWindow(chat.id._serialized)
    await sleep(2000)
    cli.update(
      `[sync] loading chat ${chat_index}/${chats.length} messages... [sync history]`,
    )
    await client.syncHistory(chat.id._serialized)
    await sleep(1000)
    cli.update(
      `[sync] loading chat ${chat_index}/${chats.length} messages... [fetch messages]`,
    )
    let messages = await fetchMessages({
      chat,
      initial_limit: count(proxy.message, { chat_id }),
      onProgress: count => {
        cli.update(
          `[sync] loading chat ${chat_index}/${chats.length} messages... [fetch messages] (${count} messages loaded)`,
        )
      },
    })
    // writeFileSync(
    //   `res/messages_${chat.id._serialized}.json`,
    //   JSON.stringify(messages, null, 2),
    // )
    let message_index = 0
    for (let message of messages) {
      message_index++
      cli.update(
        `[sync] saving chat ${chat_index}/${chats.length} messages... ` +
          formatProgress(message_index, messages.length),
      )
      syncMessage(message, chat_id)
    }
    if (messages.length === 0) {
      cli.update(
        `[sync] saving chat ${chat_index}/${chats.length} messages... (0/0)`,
      )
    }
  }
  cli.nextLine()
}

async function retry(fn: () => Promise<void>) {
  for (;;) {
    try {
      await fn()
      break
    } catch (error) {
      let message = String(error)
      if (message.includes('Promise was collected')) {
        await sleep(1000)
        continue
      }
      throw error
    }
  }
}

async function fetchMessages(args: {
  chat: WChat
  onProgress: (count: number) => void
  initial_limit: number
}) {
  let limit = args.initial_limit || 100
  let prev_count = 0
  let interval = 500
  while (true) {
    await sleep(interval)
    let messages = await args.chat.fetchMessages({ limit })
    args.onProgress(messages.length)
    if (messages.length != prev_count) {
      prev_count = messages.length
      limit *= 2
      interval = 500
      continue
    }
    if (interval < 1500) {
      interval += 500
      continue
    }
    return messages
  }
}

function parseUser(remote: string) {
  let [user, server] = remote
    .split('_')
    .find(part => part.includes('@'))!
    .split('@')
  return { server, user }
}

function getUserId(args: { server: string; user: string }): number {
  return seedRow(proxy.user, {
    server: args.server,
    user: args.user,
  })
}

export let syncChat = (chat: WChat & { groupMetadata?: GroupMetadata }) => {
  let user_id = getUserId(chat.id)
  let chat_row = find(proxy.chat, { user_id })
  let updates: Omit<Chat, 'id' | 'user_id' | 'last_message_id'> = {
    name: chat.name,
    is_group: chat.isGroup,
    is_read_only: chat.isReadOnly,
    unread_count: chat.unreadCount,
    timestamp: chat.timestamp,
    archived: chat.archived,
    pinned: chat.pinned,
    is_muted: chat.isMuted,
    mute_expiration: chat.muteExpiration,
  }
  if (!chat_row) {
    let id = proxy.chat.push({
      user_id,
      ...updates,
      last_message_id: null,
    })
    chat_row = proxy.chat[id]
  } else {
    Object.assign(chat_row, updates)
  }
  let groupMetadata = chat.groupMetadata
  if (groupMetadata) {
    seedRow(
      proxy.group,
      { group_user_id: user_id },
      {
        creation_time: groupMetadata.creation,
        owner_user_id: getUserId(groupMetadata.owner),
        subject: groupMetadata.subject,
        subject_time: groupMetadata.subjectTime,
        desc: groupMetadata.desc || null,
        desc_id: groupMetadata.descId || null,
        desc_time: groupMetadata.descTime || null,
        desc_owner_user_id: groupMetadata.descOwner
          ? getUserId(groupMetadata.descOwner)
          : null,
        membership_approval_mode: groupMetadata.membershipApprovalMode,
        member_add_mode: groupMetadata.memberAddMode,
        suspended: groupMetadata.suspended,
        terminated: groupMetadata.terminated,
        is_parent_group: groupMetadata.isParentGroup,
        is_parent_group_closed: groupMetadata.isParentGroupClosed,
        parent_group_id: groupMetadata.parentGroup
          ? getUserId(groupMetadata.parentGroup)
          : null,
        pending_participants:
          groupMetadata.pendingParticipants.length > 0
            ? JSON.stringify(groupMetadata.pendingParticipants)
            : null,
        past_participants:
          groupMetadata.pastParticipants.length > 0
            ? JSON.stringify(groupMetadata.pastParticipants)
            : null,
      },
    )
  }
  return chat_row
}
syncChat = db.transaction(syncChat)

export function getChatId(message: WMessage): number {
  let [user, server] = message.id.remote.split('@')
  let user_row = find(proxy.user, { server, user })
  if (!user_row) {
    throw new Error(`user ${message.id.remote} not found`)
  }
  let chat_row = find(proxy.chat, { user_id: user_row.id! })
  if (!chat_row) {
    throw new Error(`chat for user ${message.id.remote} not found`)
  }
  return chat_row.id!
}

export let syncMessage = (
  message: WMessage & { _data?: MessageData },
  chat_id = getChatId(message),
) => {
  let data = message._data!
  let message_id = seedRow(
    proxy.message,
    { api_id: message.id.id },
    {
      chat_id,
      ack: message.ack,
      has_media: message.hasMedia,
      body: message.body,
      type: message.type,
      timestamp: message.timestamp,
      from_user_id: getUserId(parseUser(message.from)),
      to_user_id: getUserId(parseUser(message.to)),
      author_user_id: data.author ? getUserId(data.author) : null,
      device_type: message.deviceType,
      is_forwarded: message.isForwarded,
      forwarding_score: message.forwardingScore,
      is_status: message.isStatus,
      is_starred: message.isStarred,
      from_me: message.fromMe,
      has_quoted_message: message.hasQuotedMsg,
      has_reaction: message.hasReaction,
      vcards:
        message.vCards?.length > 0 ? JSON.stringify(message.vCards) : null,
      mentioned_ids:
        message.mentionedIds?.length > 0
          ? JSON.stringify(message.mentionedIds)
          : null,
      group_mentions:
        message.groupMentions?.length > 0
          ? JSON.stringify(message.groupMentions)
          : null,
      is_gif: message.isGif,
      links: message.links?.length > 0 ? JSON.stringify(message.links) : null,
      poll_options:
        message.pollOptions?.length > 0
          ? JSON.stringify(message.pollOptions)
          : null,
      poll_votes:
        data.pollVotesSnapshot?.pollVotes?.length > 0
          ? JSON.stringify(data.pollVotesSnapshot.pollVotes)
          : null,
    },
  )
  return message_id
}
syncMessage = db.transaction(syncMessage)
