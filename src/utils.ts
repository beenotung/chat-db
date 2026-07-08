import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

export function makeSourceUtils(args: { source: string }) {
  let dir = `res/${args.source}`
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
  }
}
