import { appendEnv, populateEnv } from 'populate-env'

export let env = {
  SESSION_DIR: '.wwebjs_auth',
  PORT: 3000,
  API_KEY: 'uuid',
}

populateEnv(env, { auto_load: true, mode: 'halt' })

if (env.API_KEY == 'uuid') {
  env.API_KEY = crypto.randomUUID()
  appendEnv({ env, key: 'API_KEY' })
}
