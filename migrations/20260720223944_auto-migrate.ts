import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  // alter type for `tg_chat`.`migrated_to_channel_api_id`
  {
    const rows = await knex.select(`id`, `migrated_to_channel_api_id`).from(`tg_chat`)
    await knex.raw('alter table `tg_chat` drop column `migrated_to_channel_api_id`')
    await knex.raw('alter table `tg_chat` add column `migrated_to_channel_api_id` text null')
    for (let row of rows) {
      await knex(`tg_chat`).update({ migrated_to_channel_api_id: row.migrated_to_channel_api_id }).where({ id: row.id })
    }
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  // alter type for `tg_chat`.`migrated_to_channel_api_id`
  {
    const rows = await knex.select(`id`, `migrated_to_channel_api_id`).from(`tg_chat`)
    await knex.raw('alter table `tg_chat` drop column `migrated_to_channel_api_id`')
    await knex.raw('alter table `tg_chat` add column `migrated_to_channel_api_id` integer null')
    for (let row of rows) {
      await knex(`tg_chat`).update({ migrated_to_channel_api_id: row.migrated_to_channel_api_id }).where({ id: row.id })
    }
  }
}
