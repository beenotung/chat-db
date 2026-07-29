import { seedRow } from 'better-sqlite3-proxy'
import { proxy } from './proxy'
import { db } from './db'

export type MessageNotice = {
  from: string
  /** "person:Name" or "group:Name" */
  to: string
  content: string
}

let select_message = db.prepare<
  { plugin_id: number },
  { body: string; is_group: number; chat_name: string; from_user_name: string | null; to_user_name: string | null }
>(/* sql */ `
select
  ws_message.body
, ws_chat.is_group
, ws_chat.name as chat_name
, from_user.user as from_user_name
, to_user.user as to_user_name
from ws_message
join ws_chat on ws_chat.id = ws_message.chat_id
left join ws_user as from_user on from_user.id = ws_message.from_user_id
left join ws_user as to_user on to_user.id = ws_message.to_user_id
-- where plugin_result.plugin_id = :plugin_id
`)

export function registerPlugin(args: {
  slug: string
  on_message: (message: MessageNotice) => {
    draft: string
  }
}) {
  let plugin_id = seedRow(proxy.plugin, {
    slug: args.slug,
  })
  console.log({ plugin_id })

  let rows = select_message.all({ plugin_id })
  for (let row of rows) {
    let from = row.from_user_name || 'unknown'
    let to = row.is_group
      ? 'group:' + row.chat_name
      : 'person:' + (row.to_user_name || 'unknown')
    args.on_message({
      from,
      to,
      content: row.body,
    })
  }

  args.on_message({
    from: 'alice',
    to: 'person:me',
    content: 'hello',
  })

  args.on_message({
    from: 'alice',
    to: 'group:Happy Group',
    content: 'i am happy',
  })

  args.on_message({
    from: 'alice',
    to: 'group:Happy Group',
    content: 'i am happy',
  })
}

registerPlugin({
  slug: 'client-enquire',
  on_message: message => {
    console.log('[client-enquire] on_message:', message)
    let draft = 'hi ' + message.from
    return { draft }
  },
})
