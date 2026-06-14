import { Client, LocalAuth } from 'whatsapp-web.js'
import { EventEmitter } from 'events'

export type ClientEventMap = {
  ready: []
  qr: [qr: string]
  disconnected: [reason: string]
  authenticated: []
  auth_failure: [message: string]
}

export type AuthState = 'loading' | 'authenticated' | 'not_authenticated'

export function getClient(options: {
  session_dir: string
  headless: boolean
  noSandbox: boolean
}) {
  let args: string[] = []
  if (options.noSandbox) {
    args.push('--no-sandbox')
    args.push('--disable-setuid-sandbox')
  }
  args.push('--disable-dev-shm-usage')
  let client = new Client({
    authStrategy: new LocalAuth({ dataPath: options.session_dir }),
    puppeteer: {
      headless: options.headless,
      args,
    },
  })
  let events = new EventEmitter<ClientEventMap>()
  let authState: AuthState = 'loading'
  let ready = new Promise<void>((resolve, reject) => {
    client.on('ready', () => {
      authState = 'authenticated'
      events.emit('ready')
      resolve()
    })
    client.on('qr', qr => {
      authState = 'not_authenticated'
      events.emit('qr', qr)
    })
    client.on('disconnected', reason => {
      authState = 'not_authenticated'
      events.emit('disconnected', reason)
    })
    client.on('authenticated', () => {
      authState = 'authenticated'
      events.emit('authenticated')
    })
    client.on('auth_failure', message => {
      authState = 'not_authenticated'
      events.emit('auth_failure', message)
    })
    client.initialize()
  })
  function getTel() {
    let tel = client.info.wid.user
    if (tel) {
      return '+' + tel
    }
    return null
  }
  function getAuthState() {
    return authState
  }
  return { client, ready, getTel, events, getAuthState }
}
