import { populateEnv } from 'populate-env'

export let env = {
  SESSION_DIR: '.wwebjs_auth',
}

populateEnv(env, { auto_load: true, mode: 'halt' })
