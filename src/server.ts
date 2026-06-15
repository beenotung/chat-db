import express from 'express'
import { print } from 'listening-on'
import { env } from './env'
import { pick } from 'better-sqlite3-proxy'
import { proxy } from './proxy'
import { db } from './db'
import { getName, getTel } from './store'

let app = express()

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

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

app.get('/chats/:id/messages', (req, res) => {
  try {
    let chat_id = +req.params.id
    let chat = proxy.chat[chat_id]
    let is_group = chat.is_group
    let limit = +req.query.limit! || 20
    let since = +req.query.since! || 0
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

let port = env.PORT
app.listen(port, error => {
  if (error) {
    console.error(error)
    process.exit(1)
  }
  print(port)
})
