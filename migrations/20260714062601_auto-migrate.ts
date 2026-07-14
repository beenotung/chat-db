import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('ws_user'))) {
    await knex.schema.createTable('ws_user', table => {
      table.increments('id')
      table.text('server').notNullable()
      table.text('user').notNullable()
      table.text('tel').nullable()
      table.timestamps(false, true)
    })
  }

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
    })
  }

  if (!(await knex.schema.hasTable('ws_group'))) {
    await knex.schema.createTable('ws_group', table => {
      table.increments('id')
      table.integer('group_user_id').unsigned().notNullable().unique().references('ws_user.id')
      table.integer('creation_time').notNullable()
      table.integer('owner_user_id').unsigned().notNullable().references('ws_user.id')
      table.text('subject').notNullable()
      table.integer('subject_time').notNullable()
      table.text('desc').nullable()
      table.text('desc_id').nullable()
      table.integer('desc_time').nullable()
      table.integer('desc_owner_user_id').unsigned().nullable().references('ws_user.id')
      table.boolean('membership_approval_mode').notNullable()
      table.text('member_add_mode').notNullable()
      table.boolean('suspended').notNullable()
      table.boolean('terminated').notNullable()
      table.boolean('is_parent_group').notNullable()
      table.boolean('is_parent_group_closed').notNullable()
      table.integer('parent_group_id').unsigned().nullable().references('ws_user.id')
      table.json('pending_participants').nullable()
      table.json('past_participants').nullable()
      table.timestamps(false, true)
    })
  }

  if (!(await knex.schema.hasTable('ws_group_participants'))) {
    await knex.schema.createTable('ws_group_participants', table => {
      table.increments('id')
      table.integer('group_id').unsigned().notNullable().references('ws_group.id')
      table.integer('user_id').unsigned().notNullable().references('ws_user.id')
      table.boolean('is_admin').notNullable()
      table.boolean('is_super_admin').notNullable()
      table.timestamps(false, true)
    })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ws_group_participants')
  await knex.schema.dropTableIfExists('ws_group')
  await knex.schema.dropTableIfExists('ws_message')
  await knex.schema.dropTableIfExists('ws_chat')
  await knex.schema.dropTableIfExists('ws_user')
}
