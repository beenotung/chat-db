import { db } from './db'
import { proxy } from './proxy'

let select_name = db
  .prepare<{ user_id: number }, string>(
    /* sql */ `
select name
from chat
where user_id = :user_id
`,
  )
  .pluck()

let name_cache = new Map<number, string>()
export function getName(user_id: number) {
  let name = name_cache.get(user_id)
  if (name === undefined) {
    name = select_name.get({ user_id }) || ''
    name_cache.set(user_id, name)
  }
  return name
}

let tel_cache = new Map<number, string>()
export function getTel(user_id: number) {
  let tel = tel_cache.get(user_id)
  if (tel === undefined) {
    tel = proxy.user[user_id].tel || ''
    tel_cache.set(user_id, tel)
  }
  return tel
}
