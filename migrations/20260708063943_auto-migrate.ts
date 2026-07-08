import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.schema.renameTable('user', 'ws_user')
  await knex.schema.renameTable('chat', 'ws_chat')
  await knex.schema.renameTable('message', 'ws_message')
  await knex.schema.renameTable('group_participants', 'ws_group_participants')
  await knex.schema.renameTable('group', 'ws_group')
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.renameTable('ws_user', 'user')
  await knex.schema.renameTable('ws_chat', 'chat')
  await knex.schema.renameTable('ws_message', 'message')
  await knex.schema.renameTable('ws_group_participants', 'group_participants')
  await knex.schema.renameTable('ws_group', 'group')
}
