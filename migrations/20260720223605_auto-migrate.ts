import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tg_chat', table => {
    table.renameColumn('migrated_to_channel_id', 'migrated_to_channel_api_id')
  })
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tg_chat', table => {
    table.renameColumn('migrated_to_channel_api_id', 'migrated_to_channel_id')
  })
}
