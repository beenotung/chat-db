import { Client, Chat as WChat, Message as WMessage } from 'whatsapp-web.js'
import { find, seedRow } from 'better-sqlite3-proxy'
import { Chat, proxy } from './proxy'
import { db } from './db'
import { formatProgress } from './format'
import { mkdirSync, writeFileSync } from 'fs'
import { GroupMetadata, MessageData } from './types'

mkdirSync('res', { recursive: true })

export async function sync(client: Client) {
  let chats = await client.getChats()
  writeFileSync('res/chats.json', JSON.stringify(chats, null, 2))
  let pairs = []
  let chat_index = 0
  for (let chat of chats) {
    chat_index++
    process.stdout.write(
      '\r[sync] saving chats... ' + formatProgress(chat_index, chats.length),
    )
    let chat_row = syncChat(chat)
    pairs.push({ chat, chat_row })
  }
  chat_index = 0
  for (let { chat, chat_row } of pairs) {
    chat_index++
    let messages = await chat.fetchMessages({ limit: Infinity })
    writeFileSync(
      `res/messages_${chat.id._serialized}.json`,
      JSON.stringify(messages, null, 2),
    )
    let message_index = 0
    for (let message of messages) {
      message_index++
      process.stdout.write(
        `\r[sync] saving chat ${chat_index}/${chats.length} messages... ` +
          formatProgress(message_index, messages.length),
      )
      syncMessage(chat_row, message)
    }
  }
}

function getUserId(args: { server: string; user: string }): number {
  return seedRow(proxy.user, {
    server: args.server,
    user: args.user,
  })
}

let syncChat = (chat: WChat & { groupMetadata?: GroupMetadata }) => {
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

let syncMessage = (
  chat_row: Chat,
  message: WMessage & { _data?: MessageData },
) => {
  let data = message._data!
  let message_id = seedRow(
    proxy.message,
    { api_id: message.id.id },
    {
      chat_id: chat_row.id!,
      ack: message.ack,
      has_media: message.hasMedia,
      body: message.body,
      type: message.type,
      timestamp: message.timestamp,
      from_user_id: getUserId(data.from),
      to_user_id: getUserId(data.to),
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
