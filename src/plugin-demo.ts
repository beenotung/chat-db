import { seedRow } from 'better-sqlite3-proxy'
import { proxy } from './proxy'
import { db } from './db'

export type MessageNotice = {
  from: string
  to: string
  content: string
}

let select_message = db.prepare<
  { plugin_id: number },
  { body: string }
>(/* sql */ `
select body
from ws_message 
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
    args.on_message({
      from: 'xx',
      to: 'xx',
      content: row.body,
    })
  }

  args.on_message({
    from: 'alice',
    to: 'me',
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
