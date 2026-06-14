import { env } from './env'
import { getClient } from './adapter'

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

  console.log('[app] syncing messages...')
}

main().catch(error => {
  console.error(error)
  // process.exit(1)
})
