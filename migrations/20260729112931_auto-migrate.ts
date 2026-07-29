import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  {
    // alter column (ws_chat.is_read_only) to be nullable

    let ws_chat_rows = await knex.select('*').from('ws_chat')
    let ws_message_rows = await knex.select('*').from('ws_message')
    let plugin_result_rows = await knex.select('*').from('plugin_result')

    await knex.schema.dropTable('plugin_result')
    await knex.schema.dropTable('ws_message')
    await knex.schema.dropTable('ws_chat')

    if (!(await knex.schema.hasTable('ws_chat'))) {
      await knex.schema.createTable('ws_chat', table => {
        table.increments('id')
        table.integer('user_id').unsigned().notNullable().unique().references('ws_user.id')
        table.text('name').notNullable()
        table.boolean('is_group').notNullable()
        table.boolean('is_read_only').nullable()
        table.integer('unread_count').notNullable()
        table.integer('timestamp').nullable()
        table.boolean('archived').nullable()
        table.boolean('pinned').notNullable()
        table.boolean('is_muted').notNullable()
        table.integer('mute_expiration').notNullable()
        table.integer('last_message_id').nullable()
      })
    }
    if (!(await knex.schema.hasTable('ws_message'))) {
      await knex.schema.createTable('ws_message', table => {
        table.increments('id')
        table.integer('chat_id').unsigned().notNullable().references('ws_chat.id')
        table.text('api_id').notNullable().unique()
        table.integer('ack').nullable()
        table.boolean('has_media').notNullable()
        table.text('body').notNullable()
        table.text('type').notNullable()
        table.integer('timestamp').notNullable()
        table.integer('edit_time').nullable()
        table.integer('from_user_id').unsigned().notNullable().references('ws_user.id')
        table.integer('to_user_id').unsigned().nullable().references('ws_user.id')
        table.integer('author_user_id').unsigned().nullable().references('ws_user.id')
        table.text('device_type').notNullable()
        table.boolean('is_forwarded').nullable()
        table.integer('forwarding_score').notNullable()
        table.boolean('is_status').notNullable()
        table.boolean('is_starred').notNullable()
        table.boolean('from_me').notNullable()
        table.boolean('has_quoted_message').notNullable()
        table.boolean('has_reaction').notNullable()
        table.json('vcards').nullable()
        table.json('mentioned_ids').nullable()
        table.json('group_mentions').nullable()
        table.boolean('is_gif').notNullable()
        table.json('links').nullable()
        table.json('poll_options').nullable()
        table.json('poll_votes').nullable()
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

    for (let row of ws_chat_rows) {
      await knex.insert(row).into('ws_chat')
    }
    for (let row of ws_message_rows) {
      await knex.insert(row).into('ws_message')
    }
    for (let row of plugin_result_rows) {
      await knex.insert(row).into('plugin_result')
    }
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  {
    // alter column (ws_chat.is_read_only) to be non-nullable

    let ws_chat_rows = await knex.select('*').from('ws_chat')
    let ws_message_rows = await knex.select('*').from('ws_message')
    let plugin_result_rows = await knex.select('*').from('plugin_result')

    await knex.schema.dropTable('plugin_result')
    await knex.schema.dropTable('ws_message')
    await knex.schema.dropTable('ws_chat')

    if (!(await knex.schema.hasTable('ws_chat'))) {
      await knex.schema.createTable('ws_chat', table => {
        table.increments('id')
        table.integer('user_id').unsigned().notNullable().unique().references('ws_user.id')
        table.text('name').notNullable()
        table.boolean('is_group').notNullable()
        table.boolean('is_read_only').notNullable()
        table.integer('unread_count').notNullable()
        table.integer('timestamp').nullable()
        table.boolean('archived').nullable()
        table.boolean('pinned').notNullable()
        table.boolean('is_muted').notNullable()
        table.integer('mute_expiration').notNullable()
        table.integer('last_message_id').nullable()
      })
    }
    if (!(await knex.schema.hasTable('ws_message'))) {
      await knex.schema.createTable('ws_message', table => {
        table.increments('id')
        table.integer('chat_id').unsigned().notNullable().references('ws_chat.id')
        table.text('api_id').notNullable().unique()
        table.integer('ack').nullable()
        table.boolean('has_media').notNullable()
        table.text('body').notNullable()
        table.text('type').notNullable()
        table.integer('timestamp').notNullable()
        table.integer('from_user_id').unsigned().notNullable().references('ws_user.id')
        table.integer('to_user_id').unsigned().nullable().references('ws_user.id')
        table.integer('author_user_id').unsigned().nullable().references('ws_user.id')
        table.text('device_type').notNullable()
        table.boolean('is_forwarded').nullable()
        table.integer('forwarding_score').notNullable()
        table.boolean('is_status').notNullable()
        table.boolean('is_starred').notNullable()
        table.boolean('from_me').notNullable()
        table.boolean('has_quoted_message').notNullable()
        table.boolean('has_reaction').notNullable()
        table.json('vcards').nullable()
        table.json('mentioned_ids').nullable()
        table.json('group_mentions').nullable()
        table.boolean('is_gif').notNullable()
        table.json('links').nullable()
        table.json('poll_options').nullable()
        table.json('poll_votes').nullable()
        table.integer('edit_time').nullable()
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

    for (let row of ws_chat_rows) {
      await knex.insert(row).into('ws_chat')
    }
    for (let row of ws_message_rows) {
      await knex.insert(row).into('ws_message')
    }
    for (let row of plugin_result_rows) {
      await knex.insert(row).into('plugin_result')
    }
  }
}
