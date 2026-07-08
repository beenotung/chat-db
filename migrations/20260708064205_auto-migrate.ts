import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ws_chat', table => {
    table.unique(['user_id'])
  })
  await knex.schema.alterTable('ws_message', table => {
    table.unique(['api_id'])
  })
  await knex.schema.alterTable('ws_group', table => {
    table.unique(['group_user_id'])
  })
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('ws_group', table => {
    table.dropUnique(['group_user_id'])
  })
  await knex.schema.alterTable('ws_message', table => {
    table.dropUnique(['api_id'])
  })
  await knex.schema.alterTable('ws_chat', table => {
    table.dropUnique(['user_id'])
  })
}
