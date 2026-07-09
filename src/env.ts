import { appendEnv, populateEnv } from 'populate-env'

export let env = {
  WS_SESSION_DIR: '.wwebjs_auth',
  TG_SESSION_DIR: '.telegram_auth',
  PORT: 3000,
  API_KEY: 'uuid',
  TG_API_ID: 0,
  TG_API_HASH: '',
  TG_SESSION: '',
}

populateEnv(env, { auto_load: true, mode: 'halt' })

if (env.API_KEY == 'uuid') {
  env.API_KEY = crypto.randomUUID()
  appendEnv({ env, key: 'API_KEY' })
}
