import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  // alter column (tg_user.is_self) to be nullable
  // alter column (tg_user.is_deleted) to be nullable
  // alter column (tg_user.is_close_friend) to be nullable
  {
    let tg_user_rows = await knex.select('*').from('tg_user')
    let tg_peer_rows = await knex.select('*').from('tg_peer')
    let tg_dialog_rows = await knex.select('*').from('tg_dialog')

    await knex.schema.dropTable('tg_dialog')
    await knex.schema.dropTable('tg_peer')
    await knex.schema.dropTable('tg_user')

    if (!(await knex.schema.hasTable('tg_user'))) {
      await knex.schema.createTable('tg_user', table => {
        table.increments('id')
        table.text('api_id').notNullable().unique()
        table.text('username').nullable()
        table.text('phone').nullable()
        table.text('status').nullable()
        table.text('first_name').nullable()
        table.text('last_name').nullable()
        table.text('lang_code').nullable()
        table.json('usernames').nullable()
        table.boolean('is_self').nullable()
        table.boolean('is_deleted').nullable()
        table.boolean('is_bot').nullable()
        table.boolean('is_scam').nullable()
        table.boolean('is_close_friend').nullable()
        table.json('restrictions').nullable()
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('tg_peer'))) {
      await knex.schema.createTable('tg_peer', table => {
        table.increments('id')
        table.integer('user_id').unsigned().nullable().references('tg_user.id')
        table.integer('chat_id').unsigned().nullable().references('tg_chat.id')
        table.integer('channel_id').unsigned().nullable().references('tg_channel.id')
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('tg_dialog'))) {
      await knex.schema.createTable('tg_dialog', table => {
        table.increments('id')
        table.text('api_id').notNullable().unique()
        table.text('name').nullable()
        table.integer('timestamp').nullable()
        table.integer('unread_count').notNullable()
        table.integer('unread_mentions_count').notNullable()
        table.integer('folder_id').nullable()
        table.integer('peer_id').unsigned().notNullable().references('tg_peer.id')
        table.boolean('pinned').notNullable()
        table.boolean('archived').notNullable()
      })
    }

    for (let row of tg_user_rows) {
      await knex.insert(row).into('tg_user')
    }
    for (let row of tg_peer_rows) {
      await knex.insert(row).into('tg_peer')
    }
    for (let row of tg_dialog_rows) {
      await knex.insert(row).into('tg_dialog')
    }
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  // alter column (tg_user.is_close_friend) to be non-nullable
  // alter column (tg_user.is_deleted) to be non-nullable
  // alter column (tg_user.is_self) to be non-nullable
  {

    let tg_user_rows = await knex.select('*').from('tg_user')
    let tg_peer_rows = await knex.select('*').from('tg_peer')
    let tg_dialog_rows = await knex.select('*').from('tg_dialog')

    await knex.schema.dropTable('tg_dialog')
    await knex.schema.dropTable('tg_peer')
    await knex.schema.dropTable('tg_user')

    if (!(await knex.schema.hasTable('tg_user'))) {
      await knex.schema.createTable('tg_user', table => {
        table.increments('id')
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
    if (!(await knex.schema.hasTable('tg_peer'))) {
      await knex.schema.createTable('tg_peer', table => {
        table.increments('id')
        table.integer('user_id').unsigned().nullable().references('tg_user.id')
        table.integer('chat_id').unsigned().nullable().references('tg_chat.id')
        table.integer('channel_id').unsigned().nullable().references('tg_channel.id')
        table.timestamps(false, true)
      })
    }
    if (!(await knex.schema.hasTable('tg_dialog'))) {
      await knex.schema.createTable('tg_dialog', table => {
        table.increments('id')
        table.text('api_id').notNullable().unique()
        table.text('name').nullable()
        table.integer('timestamp').nullable()
        table.integer('unread_count').notNullable()
        table.integer('unread_mentions_count').notNullable()
        table.integer('folder_id').nullable()
        table.boolean('pinned').notNullable()
        table.boolean('archived').notNullable()
        table.integer('peer_id').unsigned().notNullable().references('tg_peer.id')
      })
    }

    for (let row of tg_user_rows) {
      await knex.insert(row).into('tg_user')
    }
    for (let row of tg_peer_rows) {
      await knex.insert(row).into('tg_peer')
    }
    for (let row of tg_dialog_rows) {
      await knex.insert(row).into('tg_dialog')
    }
  }
}
