import { env } from './env'
import { getClient } from './adapter'
import { getChatId, sync, syncMessage } from './sync'
import { proxy } from './proxy'
import { writeFileSync } from 'fs'

async function main() {
  let adapter = getClient({
    session_dir: env.SESSION_DIR,
    headless: false,
    noSandbox: true,
  })
  adapter.events.on('ready', () => {
    console.log('[client] ready')
  })
  adapter.events.on('qr', qr => {
    console.log('[client] qr', qr)
  })
  adapter.events.on('disconnected', reason => {
    console.log('[client] disconnected', reason)
  })
  adapter.events.on('authenticated', () => {
    console.log('[client] authenticated')
  })
  adapter.events.on('auth_failure', message => {
    console.log('[client] auth_failure', message)
  })
  await adapter.ready
  console.log('[app] client identity:', adapter.getTel() || 'unknown')
  console.log('[app] auth state:', adapter.getAuthState())

  adapter.client.on('message', message => {
    try {
      // writeFileSync(
      //   `res/new-message-${message.id.id}.json`,
      //   JSON.stringify(message, null, 2),
      // )
      let chat_id = getChatId(message)
      // let chat = proxy.chat[chat_id]
      // console.log('[app] new message:', {
      //   id: message.id.id,
      //   remote: message.id.remote,
      //   chat: { id: chat_id, name: chat.name },
      //   body: message.body,
      // })
      let message_id = syncMessage(message, chat_id)
      // console.log({ message_id })
    } catch (error) {
      console.error('[app] error syncing message', error)
    }
  })

  console.log('[app] syncing messages...')
  await sync(adapter.client)
  console.log('[app] synced messages')
}

main().catch(error => {
  console.error(error)
  // process.exit(1)
})
