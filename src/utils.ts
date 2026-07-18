import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

export type ClientEventMap = {
  ready: []
  qr: [qr: string]
  disconnected: [reason: string]
  authenticated: []
  auth_failure: [message: string]
}

export type AuthState = 'loading' | 'authenticated' | 'not_authenticated'

export function makeSourceUtils(args: { source: string }) {
  let source = args.source
  let dir = `res/${source}`
  mkdirSync(dir, { recursive: true })
  return {
    dir,
    writeFileSync: (filename: string, data: string | object) => {
      let file = join(dir, filename)
      if (typeof data !== 'string') {
        data = JSON.stringify(data, null, 2)
      }
      writeFileSync(file, data)
    },
    log: {
      client(...args: any[]) {
        console.log(`[${source} client]`, ...args)
      },
      app(...args: any[]) {
        console.log(`[${source} app]`, ...args)
      },
      error(...args: any[]) {
        console.error(`[${source} error]`, ...args)
      },
      debug(...args: any[]) {
        console.debug(`[${source} debug]`, ...args)
      },
    },
  }
}
