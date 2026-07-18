import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('tg_user'))) {
    await knex.schema.createTable('tg_user', table => {
      table.increments('id')
      table.integer('dialog_id').unsigned().notNullable().references('tg_dialog.id')
      table.text('api_id').notNullable().unique()
      table.text('username').nullable()
      table.text('phone').nullable()
      table.text('status').nullable()
      table.text('first_name').nullable()
      table.text('last_name').nullable()
      table.text('lang_code').nullable()
      table.json('usernames').nullable()
      table.boolean('is_self').notNullable()
      table.boolean('is_deleted').notNullable()
      table.boolean('is_bot').nullable()
      table.boolean('is_scam').nullable()
      table.boolean('is_close_friend').notNullable()
      table.json('restrictions').nullable()
      table.timestamps(false, true)
    })
  }

  if (!(await knex.schema.hasTable('tg_chat'))) {
    await knex.schema.createTable('tg_chat', table => {
      table.increments('id')
      table.integer('dialog_id').unsigned().notNullable().references('tg_dialog.id')
      table.text('api_id').notNullable().unique()
      table.text('title').notNullable()
      table.boolean('is_creator').nullable()
      table.boolean('is_left').nullable()
      table.boolean('is_deactivated').nullable()
      table.boolean('is_call_active').nullable()
      table.boolean('is_call_not_empty').nullable()
      table.boolean('is_no_forwards').nullable()
      table.integer('participants_count').nullable()
      table.integer('timestamp').nullable()
      table.integer('migrated_to_channel_id').nullable()
    })
  }

  if (!(await knex.schema.hasTable('tg_channel'))) {
    await knex.schema.createTable('tg_channel', table => {
      table.increments('id')
      table.integer('dialog_id').unsigned().notNullable().references('tg_dialog.id')
      table.text('api_id').notNullable().unique()
      table.text('title').notNullable()
      table.text('username').nullable()
      table.boolean('is_creator').nullable()
      table.boolean('is_left').nullable()
      table.boolean('is_broadcast').nullable()
      table.boolean('is_restricted').nullable()
      table.boolean('is_scam').nullable()
      table.boolean('is_slow_mode').nullable()
      table.boolean('is_no_forwards').nullable()
      table.json('restrictions').nullable()
      table.integer('participants_count').nullable()
      table.json('usernames').nullable()
      table.integer('level').nullable()
      table.integer('subscription_until_time').nullable()
      table.timestamps(false, true)
    })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tg_channel')
  await knex.schema.dropTableIfExists('tg_chat')
  await knex.schema.dropTableIfExists('tg_user')
}
