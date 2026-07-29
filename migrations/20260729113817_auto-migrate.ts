import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  {
    // alter column (ws_group.member_add_mode) to be nullable

    let ws_group_rows = await knex.select('*').from('ws_group')
    let ws_group_participants_rows = await knex.select('*').from('ws_group_participants')

    await knex.schema.dropTable('ws_group_participants')
    await knex.schema.dropTable('ws_group')

    if (!(await knex.schema.hasTable('ws_group'))) {
      await knex.schema.createTable('ws_group', table => {
        table.increments('id')
        table.integer('group_user_id').unsigned().notNullable().unique().references('ws_user.id')
        table.integer('creation_time').notNullable()
        table.integer('owner_user_id').unsigned().nullable().references('ws_user.id')
        table.text('subject').notNullable()
        table.integer('subject_time').nullable()
        table.text('desc').nullable()
        table.text('desc_id').nullable()
        table.integer('desc_time').nullable()
        table.integer('desc_owner_user_id').unsigned().nullable().references('ws_user.id')
        table.boolean('membership_approval_mode').nullable()
        table.text('member_add_mode').nullable()
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

    for (let row of ws_group_rows) {
      await knex.insert(row).into('ws_group')
    }
    for (let row of ws_group_participants_rows) {
      await knex.insert(row).into('ws_group_participants')
    }
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  {
    // alter column (ws_group.member_add_mode) to be non-nullable

    let ws_group_rows = await knex.select('*').from('ws_group')
    let ws_group_participants_rows = await knex.select('*').from('ws_group_participants')

    await knex.schema.dropTable('ws_group_participants')
    await knex.schema.dropTable('ws_group')

    if (!(await knex.schema.hasTable('ws_group'))) {
      await knex.schema.createTable('ws_group', table => {
        table.increments('id')
        table.integer('group_user_id').unsigned().notNullable().unique().references('ws_user.id')
        table.integer('creation_time').notNullable()
        table.integer('owner_user_id').unsigned().nullable().references('ws_user.id')
        table.text('subject').notNullable()
        table.integer('subject_time').nullable()
        table.text('desc').nullable()
        table.text('desc_id').nullable()
        table.integer('desc_time').nullable()
        table.integer('desc_owner_user_id').unsigned().nullable().references('ws_user.id')
        table.boolean('membership_approval_mode').nullable()
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

    for (let row of ws_group_rows) {
      await knex.insert(row).into('ws_group')
    }
    for (let row of ws_group_participants_rows) {
      await knex.insert(row).into('ws_group_participants')
    }
  }
}
