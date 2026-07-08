import './server'
import * as whatsapp_cli from './source/whatsapp/cli'

async function main() {
  await whatsapp_cli.main()
}

main().catch(error => {
  console.error(error)
  // process.exit(1)
})
