import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  {
    // alter column (plugin.webhook_url) to be nullable

    let plugin_rows = await knex.select('*').from('plugin')
    let plugin_result_rows = await knex.select('*').from('plugin_result')

    await knex.schema.dropTable('plugin_result')
    await knex.schema.dropTable('plugin')

    if (!(await knex.schema.hasTable('plugin'))) {
      await knex.schema.createTable('plugin', table => {
        table.increments('id')
        table.text('slug').notNullable().unique()
        table.text('webhook_url').nullable()
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

    for (let row of plugin_rows) {
      await knex.insert(row).into('plugin')
    }
    for (let row of plugin_result_rows) {
      await knex.insert(row).into('plugin_result')
    }
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  {
    // alter column (plugin.webhook_url) to be non-nullable

    let plugin_rows = await knex.select('*').from('plugin')
    let plugin_result_rows = await knex.select('*').from('plugin_result')

    await knex.schema.dropTable('plugin_result')
    await knex.schema.dropTable('plugin')

    if (!(await knex.schema.hasTable('plugin'))) {
      await knex.schema.createTable('plugin', table => {
        table.increments('id')
        table.text('webhook_url').notNullable()
        table.text('slug').notNullable().unique()
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

    for (let row of plugin_rows) {
      await knex.insert(row).into('plugin')
    }
    for (let row of plugin_result_rows) {
      await knex.insert(row).into('plugin_result')
    }
  }
}
