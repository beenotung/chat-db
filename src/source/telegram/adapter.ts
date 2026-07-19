import { TelegramClient } from 'teleproto'
import QRCode from 'qrcode-terminal'
import { EventEmitter } from 'events'
import { StringSession } from 'teleproto/sessions'
import { join } from 'path'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'fs'
import { ClientEventMap, AuthState } from '../../utils'
import { log } from './utils'

export function getClient(options: {
  session_dir: string
  api_id: number
  api_hash: string
  connection_retries?: number
}) {
  mkdirSync(options.session_dir, { recursive: true })
  let sessionStorage = {
    file: join(options.session_dir, 'session'),
    load(): string {
      if (existsSync(this.file)) {
        return readFileSync(this.file, 'utf8').trim()
      }
      return ''
    },
    save(session: string) {
      writeFileSync(this.file, session)
    },
    clear() {
      if (existsSync(this.file)) {
        unlinkSync(this.file)
      }
    },
  }
  let session_string = sessionStorage.load()
  let session = new StringSession(session_string)

  let apiId = options.api_id
  let apiHash = options.api_hash

  let client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: options.connection_retries ?? 5,
  })
  let events = new EventEmitter<ClientEventMap>()
  let authState: AuthState = 'loading'
  let ready = new Promise<void>(async (resolve, reject) => {
    try {
      await client.connect()

      if (session_string) {
        try {
          await client.getMe()
        } catch (error) {
          // login session expired
          log.client('login session expired, need to login again')
          session_string = ''
          sessionStorage.clear()
        }
      }

      if (!session_string) {
        await client.signInUserWithQrCode(
          { apiId, apiHash },
          {
            async qrCode({ token, expires }) {
              let url =
                'tg://login?token=' +
                token
                  .toString('base64')
                  .replaceAll('+', '-')
                  .replaceAll('/', '_')
                  .replaceAll('=', '')
              authState = 'not_authenticated'
              events.emit('qr', url)
              log.client('login qr code:', { url, expires })
              QRCode.generate(url, { small: true })
            },
            async onError(err) {
              reject(err)
              return true
            },
          },
        )
        session_string = client.session.save() as any
        if (typeof session_string !== 'string' || !session_string) {
          throw new Error('Invalid session string')
        }
        sessionStorage.save(session_string)
      }

      if (!(await client.isUserAuthorized())) {
        throw new Error('User not authorized')
      }

      await client.getMe()

      authState = 'authenticated'
      events.emit('ready')

      await client.catchUp()

      resolve()
    } catch (error) {
      authState = 'not_authenticated'
      events.emit('auth_failure', error as string)
      reject(error)
      if (!client.disconnected) {
        client.disconnect()
      }
    }
  })

  async function getTel() {
    let profile = await client.getMe()
    let tel = profile.phone
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
