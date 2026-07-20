/**
 * This file is auto generated, do not edit it manually.
 *
 * update command: npm run db:update
 */

import { proxySchema } from 'better-sqlite3-proxy'
import { db } from './db'

export type WsUser = {
  id?: null | number
  server: string
  user: string
  tel: null | string
}

export type WsChat = {
  id?: null | number
  user_id: number
  user?: WsUser
  name: string
  is_group: boolean
  is_read_only: boolean
  unread_count: number
  timestamp: null | number
  archived: null | boolean
  pinned: boolean
  is_muted: boolean
  mute_expiration: number
  last_message_id: null | number
}

export type WsMessage = {
  id?: null | number
  chat_id: number
  chat?: WsChat
  api_id: string
  ack: null | number
  has_media: boolean
  body: string
  type: string
  timestamp: number
  edit_time: null | number
  from_user_id: number
  from_user?: WsUser
  to_user_id: null | number
  to_user?: WsUser
  author_user_id: null | number
  author_user?: WsUser
  device_type: string
  is_forwarded: null | boolean
  forwarding_score: number
  is_status: boolean
  is_starred: boolean
  from_me: boolean
  has_quoted_message: boolean
  has_reaction: boolean
  vcards: null | string // json
  mentioned_ids: null | string // json
  group_mentions: null | string // json
  is_gif: boolean
  links: null | string // json
  poll_options: null | string // json
  poll_votes: null | string // json
}

export type WsGroup = {
  id?: null | number
  group_user_id: number
  group_user?: WsUser
  creation_time: number
  owner_user_id: number
  owner_user?: WsUser
  subject: string
  subject_time: number
  desc: null | string
  desc_id: null | string
  desc_time: null | number
  desc_owner_user_id: null | number
  desc_owner_user?: WsUser
  membership_approval_mode: boolean
  member_add_mode: string
  suspended: boolean
  terminated: boolean
  is_parent_group: boolean
  is_parent_group_closed: boolean
  parent_group_id: null | number
  parent_group?: WsUser
  pending_participants: null | string // json
  past_participants: null | string // json
}

export type WsGroupParticipants = {
  id?: null | number
  group_id: number
  group?: WsGroup
  user_id: number
  user?: WsUser
  is_admin: boolean
  is_super_admin: boolean
}

export type TgDialog = {
  id?: null | number
  api_id: string
  name: null | string
  timestamp: null | number
  unread_count: number
  unread_mentions_count: number
  folder_id: null | number
  user_id: null | number
  user?: TgUser
  chat_id: null | number
  chat?: TgChat
  channel_id: null | number
  channel?: TgChannel
  pinned: boolean
  archived: boolean
}

export type TgUser = {
  id?: null | number
  api_id: string
  username: null | string
  phone: null | string
  status: null | string
  first_name: null | string
  last_name: null | string
  lang_code: null | string
  usernames: null | string // json
  is_self: boolean
  is_deleted: boolean
  is_bot: null | boolean
  is_scam: null | boolean
  is_close_friend: boolean
  restrictions: null | string // json
}

export type TgChat = {
  id?: null | number
  api_id: string
  title: string
  is_creator: null | boolean
  is_left: null | boolean
  is_deactivated: null | boolean
  is_call_active: null | boolean
  is_call_not_empty: null | boolean
  is_no_forwards: null | boolean
  participants_count: null | number
  timestamp: null | number
  migrated_to_channel_api_id: null | string
}

export type TgChannel = {
  id?: null | number
  api_id: string
  title: string
  username: null | string
  is_creator: null | boolean
  is_left: null | boolean
  is_broadcast: null | boolean
  is_restricted: null | boolean
  is_scam: null | boolean
  is_slow_mode: null | boolean
  is_no_forwards: null | boolean
  restrictions: null | string // json
  participants_count: null | number
  usernames: null | string // json
  level: null | number
  subscription_until_time: null | number
}

export type DBProxy = {
  ws_user: WsUser[]
  ws_chat: WsChat[]
  ws_message: WsMessage[]
  ws_group: WsGroup[]
  ws_group_participants: WsGroupParticipants[]
  tg_dialog: TgDialog[]
  tg_user: TgUser[]
  tg_chat: TgChat[]
  tg_channel: TgChannel[]
}

export let proxy = proxySchema<DBProxy>({
  db,
  tableFields: {
    ws_user: [],
    ws_chat: [
      /* foreign references */
      ['user', { field: 'user_id', table: 'ws_user' }],
    ],
    ws_message: [
      /* foreign references */
      ['chat', { field: 'chat_id', table: 'ws_chat' }],
      ['from_user', { field: 'from_user_id', table: 'ws_user' }],
      ['to_user', { field: 'to_user_id', table: 'ws_user' }],
      ['author_user', { field: 'author_user_id', table: 'ws_user' }],
    ],
    ws_group: [
      /* foreign references */
      ['group_user', { field: 'group_user_id', table: 'ws_user' }],
      ['owner_user', { field: 'owner_user_id', table: 'ws_user' }],
      ['desc_owner_user', { field: 'desc_owner_user_id', table: 'ws_user' }],
      ['parent_group', { field: 'parent_group_id', table: 'ws_user' }],
    ],
    ws_group_participants: [
      /* foreign references */
      ['group', { field: 'group_id', table: 'ws_group' }],
      ['user', { field: 'user_id', table: 'ws_user' }],
    ],
    tg_dialog: [
      /* foreign references */
      ['user', { field: 'user_id', table: 'tg_user' }],
      ['chat', { field: 'chat_id', table: 'tg_chat' }],
      ['channel', { field: 'channel_id', table: 'tg_channel' }],
    ],
    tg_user: [],
    tg_chat: [],
    tg_channel: [],
  },
})
