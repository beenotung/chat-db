/**
 * This file is auto generated, do not edit it manually.
 *
 * update command: npm run db:update
 */

import { proxySchema } from 'better-sqlite3-proxy'
import { db } from './db'

export type User = {
  id?: null | number
  server: string
  user: string
}

export type Chat = {
  id?: null | number
  user_id: number
  user?: User
  name: string
  is_group: boolean
  is_read_only: boolean
  unread_count: number
  timestamp: number
  archived: boolean
  pinned: boolean
  is_muted: boolean
  mute_expiration: number
  last_message_id: null | number
}

export type Message = {
  id?: null | number
  chat_id: number
  chat?: Chat
  api_id: string
  ack: number
  has_media: boolean
  body: string
  type: string
  timestamp: number
  from_user_id: number
  from_user?: User
  to_user_id: number
  to_user?: User
  device_type: string
  is_forwarded: boolean
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

export type Group = {
  id?: null | number
  group_user_id: number
  group_user?: User
  creation_time: number
  owner_user_id: number
  owner_user?: User
  subject: string
  subject_time: number
  desc: string
  desc_id: string
  desc_time: number
  desc_owner_user_id: number
  desc_owner_user?: User
  membership_approval_mode: boolean
  member_add_mode: string
  suspended: boolean
  terminated: boolean
  is_parent_group: boolean
  is_parent_group_closed: boolean
  parent_group_id: null | number
  parent_group?: Group
  pending_participants: null | string // json
  past_participants: null | string // json
}

export type GroupParticipants = {
  id?: null | number
  group_id: number
  group?: Group
  user_id: number
  user?: User
  is_admin: boolean
  is_super_admin: boolean
}

export type DBProxy = {
  user: User[]
  chat: Chat[]
  message: Message[]
  group: Group[]
  group_participants: GroupParticipants[]
}

export let proxy = proxySchema<DBProxy>({
  db,
  tableFields: {
    user: [],
    chat: [
      /* foreign references */
      ['user', { field: 'user_id', table: 'user' }],
    ],
    message: [
      /* foreign references */
      ['chat', { field: 'chat_id', table: 'chat' }],
      ['from_user', { field: 'from_user_id', table: 'user' }],
      ['to_user', { field: 'to_user_id', table: 'user' }],
    ],
    group: [
      /* foreign references */
      ['group_user', { field: 'group_user_id', table: 'user' }],
      ['owner_user', { field: 'owner_user_id', table: 'user' }],
      ['desc_owner_user', { field: 'desc_owner_user_id', table: 'user' }],
      ['parent_group', { field: 'parent_group_id', table: 'group' }],
    ],
    group_participants: [
      /* foreign references */
      ['group', { field: 'group_id', table: 'group' }],
      ['user', { field: 'user_id', table: 'user' }],
    ],
  },
})
