import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `plugin` add column `slug` text not null')
  await knex.schema.alterTable(`plugin`, table => table.unique([`slug`]))
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(`plugin`, table => table.dropUnique([`slug`]))
  await knex.schema.alterTable(`plugin`, table => table.dropColumn(`slug`))
}
