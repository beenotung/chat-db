import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user', table => {
    table.unique(['server', 'user'])
  })
  await knex.schema.alterTable('chat', table => {
    table.unique(['user_id'])
    table.index(['name'])
    table.index(['is_group'])
    table.index(['timestamp'])
  })
  await knex.schema.alterTable('message', table => {
    table.unique(['api_id'])
    table.index(['chat_id'])
    table.index(['from_user_id'])
    table.index(['to_user_id'])
    table.index(['timestamp'])
  })
  await knex.schema.alterTable('group', table => {
    table.unique(['group_user_id'])
    table.index(['owner_user_id'])
    table.index(['parent_group_id'])
  })
  await knex.schema.alterTable('group_participants', table => {
    table.unique(['group_id', 'user_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user', table => {
    table.dropUnique(['server', 'user'])
  })
  await knex.schema.alterTable('chat', table => {
    table.dropUnique(['user_id'])
    table.dropIndex(['name'])
    table.dropIndex(['is_group'])
    table.dropIndex(['timestamp'])
  })
  await knex.schema.alterTable('message', table => {
    table.dropUnique(['api_id'])
    table.dropIndex(['chat_id'])
    table.dropIndex(['from_user_id'])
    table.dropIndex(['to_user_id'])
    table.dropIndex(['timestamp'])
  })
  await knex.schema.alterTable('group', table => {
    table.dropUnique(['group_user_id'])
    table.dropIndex(['owner_user_id'])
    table.dropIndex(['parent_group_id'])
  })
  await knex.schema.alterTable('group_participants', table => {
    table.dropUnique(['group_id', 'user_id'])
  })
}
