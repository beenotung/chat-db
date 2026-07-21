import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tg_peer', table => {
    table.unique(['user_id', 'chat_id', 'channel_id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tg_peer', table => {
    table.dropUnique(['user_id', 'chat_id', 'channel_id'])
  })
}
