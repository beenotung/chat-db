import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `tg_chat` add column `is_forbidden` boolean null')

  if (!(await knex.schema.hasTable('tg_message'))) {
    await knex.schema.createTable('tg_message', table => {
      table.increments('id')
      table.integer('dialog_id').unsigned().notNullable().references('tg_dialog.id')
      table.text('api_id').notNullable()
      table.integer('from_peer_id').unsigned().nullable().references('tg_peer.id')
      table.boolean('is_out').nullable()
      table.boolean('is_mentioned').nullable()
      table.boolean('is_media_unread').nullable()
      table.boolean('is_silent').nullable()
      table.boolean('is_post').nullable()
      table.boolean('is_from_scheduled').nullable()
      table.boolean('is_pinned').nullable()
      table.text('via_bot_api_id').nullable()
      table.integer('timestamp').notNullable()
      table.text('message').notNullable()
      table.json('media').nullable()
      table.json('reply_markup').nullable()
      table.json('entities').nullable()
      table.integer('view_count').nullable()
      table.integer('forward_count').nullable()
      table.json('replies').nullable()
      table.integer('edit_time').nullable()
      table.text('post_author').nullable()
      table.text('grouped_api_id').nullable()
      table.json('restriction_reason').nullable()
      table.integer('ttl_period').nullable()
      table.json('reactions').nullable()
      table.boolean('is_no_forwards').nullable()
      table.unique(['dialog_id', 'api_id'])
    })
  }

  if (!(await knex.schema.hasTable('tg_message_forward'))) {
    await knex.schema.createTable('tg_message_forward', table => {
      table.increments('id')
      table.integer('message_id').unsigned().notNullable().unique().references('tg_message.id')
      table.integer('source_message_id').unsigned().nullable().references('tg_message.id')
      table.boolean('is_imported').nullable()
      table.boolean('is_saved_out').nullable()
      table.integer('source_peer_id').unsigned().nullable().references('tg_peer.id')
      table.text('source_name').nullable()
      table.integer('source_timestamp').notNullable()
      table.text('channel_post_api_id').nullable()
      table.text('post_author').nullable()
      table.integer('saved_from_peer_id').unsigned().nullable().references('tg_peer.id')
      table.text('saved_from_msg_api_id').nullable()
      table.integer('saved_forwarder_peer_id').unsigned().nullable().references('tg_peer.id')
      table.text('saved_forwarder_name').nullable()
      table.integer('saved_forwarder_timestamp').nullable()
      table.text('psa_type').nullable()
      table.timestamps(false, true)
    })
  }

  if (!(await knex.schema.hasTable('tg_message_reply'))) {
    await knex.schema.createTable('tg_message_reply', table => {
      table.increments('id')
      table.integer('message_id').unsigned().notNullable().unique().references('tg_message.id')
      table.boolean('is_reply_to_scheduled').nullable()
      table.boolean('is_forum_topic').nullable()
      table.boolean('is_quote').nullable()
      table.boolean('is_reply_to_ephemeral').nullable()
      table.integer('reply_to_message_id').unsigned().nullable().references('tg_message.id')
      table.text('reply_to_msg_api_id').nullable()
      table.integer('reply_to_peer_id').unsigned().nullable().references('tg_peer.id')
      table.integer('reply_from_id').unsigned().nullable().references('tg_message_forward.id')
      table.json('reply_media').nullable()
      table.text('reply_to_top_api_id').nullable()
      table.text('quote_text').nullable()
      table.json('quote_entities').nullable()
      table.integer('quote_offset').nullable()
      table.text('todo_item_api_id').nullable()
      table.binary('poll_option').nullable()
      table.integer('reply_message_id').unsigned().nullable().references('tg_message.id')
      table.timestamps(false, true)
    })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tg_message_reply')
  await knex.schema.dropTableIfExists('tg_message_forward')
  await knex.schema.dropTableIfExists('tg_message')
  await knex.raw('alter table `tg_chat` drop column `is_forbidden`')
}
