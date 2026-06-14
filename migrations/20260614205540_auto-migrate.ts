import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('group', table => {
    table.dropForeign('parent_group_id')
    table.foreign('parent_group_id').references('user.id')
  })
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('group', table => {
    table.dropForeign('parent_group_id')
    table.foreign('parent_group_id').references('group.id')
  })
}
