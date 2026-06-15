import express from 'express'
import { object, url, string, id, int, optional } from 'cast.ts'
import { print } from 'listening-on'
import { env } from './env'
import { pick } from 'better-sqlite3-proxy'
import { proxy } from './proxy'
import { db } from './db'
import { getName, getTel } from './store'
import { Client } from 'whatsapp-web.js'
import { syncMessage } from './sync'

let app = express()

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

function verifyApiKey(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  let api_key = req.header('X-API-KEY')
  if (api_key !== env.API_KEY) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  next()
}
app.use(verifyApiKey)

let select_chats = db.prepare(/* sql */ `
select
  chat.id
, chat.name
, chat.is_group
, chat.timestamp
, user.tel
from chat
inner join user on user.id = chat.user_id
order by timestamp desc
`)

app.get('/chats', (req, res) => {
  try {
    let chats = select_chats.all()
    res.json({ chats })
  } catch (error) {
    res.json({ error: String(error) })
  }
})

type MessageItem = {
  id: number
  type: string
  body: string
  timestamp: number
  from_user_id: number
  from_name?: string
  from_tel?: string
  // not useful for group message
  to_user_id?: number
  to_name?: string
  to_tel?: string
}
let select_messages = db.prepare<
  { chat_id: number; since: number; limit: number },
  MessageItem
>(/* sql */ `
select
  message.id
, message.type
, message.body
, message.timestamp
, ifnull(message.author_user_id, message.from_user_id) as from_user_id
, message.to_user_id
from message
where message.chat_id = :chat_id
  and message.id > :since
order by timestamp asc
limit :limit
`)

let count_messages = db
  .prepare(
    /* sql */ `
select count(*)
from message
where message.chat_id = :chat_id
`,
  )
  .pluck()

let get_messages_parser = object({
  params: object({
    id: id(),
  }),
  query: object({
    limit: optional(int({ min: 1 })),
    since: optional(id()),
  }),
})
app.get('/chats/:id/messages', (req, res) => {
  try {
    let input = get_messages_parser.parse(req)
    let chat_id = input.params.id
    let chat = proxy.chat[chat_id]
    let is_group = chat.is_group
    let limit = input.query.limit || 20
    let since = input.query.since || 0
    let messages = select_messages.all({ since, limit, chat_id })
    for (let message of messages) {
      let from_name = getName(message.from_user_id)
      if (from_name) {
        message.from_name = from_name
      }
      let from_tel = getTel(message.from_user_id)
      if (from_tel) {
        message.from_tel = from_tel
      }
      if (is_group) {
        delete message.to_user_id
      } else {
        let to_name = getName(message.to_user_id!)
        if (to_name) {
          message.to_name = to_name
        }
        let to_tel = getTel(message.to_user_id!)
        if (to_tel) {
          message.to_tel = to_tel
        }
      }
    }
    let total = count_messages.get({ chat_id }) || 0
    res.json({
      pagination: { total, limit, since },
      messages,
    })
  } catch (error) {
    res.json({ error: String(error) })
  }
})

export let hooks = {
  new_message_url: '',
}
let register_hook_parser = object({
  body: object({
    url: url(),
  }),
})
app.post('/hooks/new-message', (req, res) => {
  try {
    let input = register_hook_parser.parse(req)
    hooks.new_message_url = input.body.url
    res.json({ hooks })
  } catch (error) {
    res.json({ error: String(error) })
  }
})

let port = env.PORT
app.listen(port, error => {
  if (error) {
    console.error(error)
    process.exit(1)
  }
  print(port)
})

export function attachClient(client: Client) {
  let send_message_parser = object({
    params: object({
      id: id(),
    }),
    body: object({
      content: string(),
    }),
  })
  app.post('/chats/:id/messages', async (req, res) => {
    try {
      let input = send_message_parser.parse(req)
      let chat_id = input.params.id
      let content = input.body.content

      let chat = proxy.chat[chat_id]
      let { user, server } = chat.user!
      let chatId = `${user}@${server}`

      let message = await client.sendMessage(chatId, content, {})
      let message_id = syncMessage(message, chat_id)
      res.json({ message_id })
    } catch (error) {
      res.json({ error: String(error) })
    }
  })
}
