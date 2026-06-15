import { getClient } from './adapter'
import { env } from './env'

async function main() {
  let adapter = getClient({
    session_dir: env.SESSION_DIR,
    headless: false,
    noSandbox: true,
  })
  await adapter.ready
  let client = adapter.client

  // ad-hoc test here
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
