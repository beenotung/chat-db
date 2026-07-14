import { env } from '../../env'
import { getClient } from './adapter'
import { getSessionText, saveSessionText } from './auth'
import { sync } from './sync'

export async function main() {
  if (!env.TG_API_ID || !env.TG_API_HASH) {
    console.log('[telegram] skipped (set TG_API_ID and TG_API_HASH in .env)')
    return
  }

  let adapter = getClient({
    apiId: env.TG_API_ID,
    apiHash: env.TG_API_HASH,
    session_dir: env.TG_SESSION_DIR,
    session_text: getSessionText({ session_dir: env.TG_SESSION_DIR }) || undefined,
  })

  adapter.events.on('ready', () => {
    console.log('[telegram] ready')
  })
  adapter.events.on('qr', qr => {
    console.log('[telegram] qr', qr)
  })
  adapter.events.on('disconnected', reason => {
    console.log('[telegram] disconnected', reason)
  })
  adapter.events.on('authenticated', () => {
    console.log('[telegram] authenticated')
  })
  adapter.events.on('auth_failure', message => {
    console.log('[telegram] auth_failure', message)
  })

  await adapter.ready
  console.log('[telegram] client identity:', (await adapter.getTel()) || 'unknown')
  console.log('[telegram] auth state:', adapter.getAuthState())

  let session_text = adapter.client.session.save()
  if (typeof session_text === 'string' && session_text) {
    saveSessionText({ session_dir: env.TG_SESSION_DIR, session_text })
  }

  console.log('[telegram] syncing messages...')
  await sync(adapter.client)
  console.log('[telegram] synced messages')
}
