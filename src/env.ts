import { populateEnv } from 'populate-env'

export let env = {
  SESSION_DIR: '.session',
}

populateEnv(env, { auto_load: true, mode: 'halt' })
