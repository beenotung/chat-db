import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('plugin'))) {
    await knex.schema.createTable('plugin', table => {
      table.increments('id')
      table.text('webhook_url').notNullable()
      table.timestamps(false, true)
    })
  }

  if (!(await knex.schema.hasTable('plugin_result'))) {
    await knex.schema.createTable('plugin_result', table => {
      table.increments('id')
      table.integer('plugin_id').unsigned().notNullable().references('plugin.id')
      table.integer('ws_message_id').unsigned().nullable().references('ws_message.id')
      table.integer('tg_message_id').unsigned().nullable().references('tg_message.id')
      table.json('result').nullable()
      table.timestamps(false, true)
    })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('plugin_result')
  await knex.schema.dropTableIfExists('plugin')
}
