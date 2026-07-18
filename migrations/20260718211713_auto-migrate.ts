import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('tg_dialog'))) {
    await knex.schema.createTable('tg_dialog', table => {
      table.increments('id')
      table.text('api_id').notNullable().unique()
      table.text('name').nullable()
      table.integer('timestamp').nullable()
      table.integer('unread_count').notNullable()
      table.integer('unread_mentions_count').notNullable()
      table.integer('folder_id').nullable()
      table.boolean('is_user').notNullable()
      table.boolean('is_group').notNullable()
      table.boolean('is_channel').notNullable()
      table.boolean('pinned').notNullable()
      table.boolean('archived').notNullable()
    })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tg_dialog')
}
