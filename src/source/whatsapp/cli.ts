import { env } from '../../env'
import { attachClient } from '../../server'
import { getClient } from './adapter'
import { getChatId, sync, syncMessage } from './sync'
import { log } from './utils'

export async function main() {
  let adapter = getClient({
    session_dir: env.WS_SESSION_DIR,
    headless: false,
    no_sandbox: true,
  })
  adapter.events.on('ready', () => {
    log.client('ready')
  })
  adapter.events.on('qr', qr => {
    log.client('qr', qr)
  })
  adapter.events.on('disconnected', reason => {
    log.client('disconnected', reason)
  })
  adapter.events.on('authenticated', () => {
    log.client('authenticated')
  })
  adapter.events.on('auth_failure', message => {
    log.client('auth_failure', message)
  })
  await adapter.ready
  log.app('client identity:', adapter.getTel() || 'unknown')
  log.app('auth state:', adapter.getAuthState())

  let client = adapter.client
  attachClient(client)

  client.on('message', message => {
    try {
      // writeFileSync(
      //   `res/new-message-${message.id.id}.json`,
      //   JSON.stringify(message, null, 2),
      // )
      let chat_id = getChatId(message)
      // let chat = proxy.chat[chat_id]
      // log.debug('new message:', {
      //   id: message.id.id,
      //   remote: message.id.remote,
      //   chat: { id: chat_id, name: chat.name },
      //   body: message.body,
      // })
      let message_id = syncMessage({ message, chat_id })
      // log.debug({ message_id })
    } catch (error) {
      let error_message = String(error)
      if (error_message.includes('not found')) {
        // message from newly added chat (group or private)
        sync({ client, full_sync: false })
          .then(() => {
            let chat_id = getChatId(message)
            syncMessage({ message, chat_id })
          })
          .catch(error => {
            log.error('failed to sync chat list:', error)
          })
        return
      }
      log.error('failed to sync message:', error)
    }
  })

  log.app('syncing messages...')
  await sync({ client, full_sync: env.FULL_SYNC })
  log.app('synced messages')
}
