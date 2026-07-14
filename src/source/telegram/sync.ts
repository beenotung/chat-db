import { TelegramClient } from 'telegram'
import { find, seedRow } from 'better-sqlite3-proxy'
import { proxy } from '../../proxy'
import { formatProgress } from '../../format'

function getUserId(peerId: number | string): number {
  return seedRow(proxy.ws_user, {
    server: 'telegram',
    user: String(peerId),
  })
}

export async function sync(client: TelegramClient) {
  let me = await client.getMe()
  console.log('[telegram] logged in as:', me.username || me.id)
  let meId = getUserId(String(me.id))

  let dialogs = await client.getDialogs({})
  console.log(`[telegram] found ${dialogs.length} dialogs`)

  for (let dialog of dialogs) {
    let entity = dialog.entity
    if (!entity) continue

    let peerId = String(dialog.id || (entity as any).id)
    if (!peerId) continue

    let name = dialog.name || dialog.title || String(dialog.id)
    let userId = getUserId(peerId)
    let chatRow = find(proxy.ws_chat, { user_id: userId })

    if (!chatRow) {
      proxy.ws_chat.push({
        user_id: userId,
        name,
        is_group: dialog.isGroup || dialog.isChannel || false,
        is_read_only: false,
        unread_count: dialog.unreadCount || 0,
        timestamp: null,
        archived: null,
        pinned: false,
        is_muted: false,
        mute_expiration: 0,
        last_message_id: null,
      })
    } else {
      chatRow.name = name
    }
  }

  for (let dialog of dialogs) {
    let entity = dialog.entity
    if (!entity) continue

    let peerId = String(dialog.id || (entity as any).id)
    if (!peerId) continue

    let userId = getUserId(peerId)
    let chatRow = find(proxy.ws_chat, { user_id: userId })
    if (!chatRow) continue
    let chatId = chatRow.id!

    console.log(`[telegram] fetching messages for ${chatRow.name}`)

    let lastId = 0
    let totalFetched = 0
    let page = 0

    while (true) {
      page++
      let batch = await client.getMessages(entity, {
        limit: 100,
        offsetId: lastId || undefined,
      })

      if (!batch || batch.length === 0) break

      for (let msg of batch) {
        if (!msg) continue

        let senderPeerId: string | null = null
        if (msg.senderId) {
          senderPeerId = String(msg.senderId)
        } else if ((msg as any).fromId) {
          let fromId = (msg as any).fromId
          senderPeerId = String(fromId.userId || fromId.channelId || fromId.chatId)
        }

        let fromUserId = senderPeerId ? getUserId(senderPeerId) : meId

        let isAction = !!msg.action
        let type = isAction ? 'service' : 'message'
        let hasMedia = !!msg.media
          && !(msg.media as any)?.className?.includes('MessageMediaWebPage')

        seedRow(
          proxy.ws_message,
          { api_id: 'tg_' + String(msg.id) },
          {
            chat_id: chatId,
            ack: null,
            has_media: hasMedia,
            body: msg.message || '',
            type,
            timestamp: typeof msg.date === 'number' ? msg.date : 0,
            from_user_id: fromUserId,
            to_user_id: null,
            author_user_id: null,
            device_type: 'telegram',
            is_forwarded: msg.fwdFrom ? true : null,
            forwarding_score: 0,
            is_status: false,
            is_starred: false,
            from_me: msg.out || false,
            has_quoted_message: !!msg.replyTo,
            has_reaction: !!(msg.reactions as any)?.results?.length,
            vcards: null,
            mentioned_ids: null,
            group_mentions: null,
            is_gif: false,
            links: null,
            poll_options: null,
            poll_votes: null,
          },
        )

        lastId = msg.id
        totalFetched++
      }

      if (batch.length < 100) break
    }

    console.log(`[telegram] ${chatRow.name}: ${totalFetched} messages`)
  }
}
