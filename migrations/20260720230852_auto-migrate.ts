import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('tg_peer'))) {
    await knex.schema.createTable('tg_peer', table => {
      table.increments('id')
      table.integer('user_id').unsigned().nullable().references('tg_user.id')
      table.integer('chat_id').unsigned().nullable().references('tg_chat.id')
      table.integer('channel_id').unsigned().nullable().references('tg_channel.id')
      table.timestamps(false, true)
    })
  }
  let dialogs = await knex('tg_dialog').select('*')
  await knex('tg_dialog').delete()
  await knex.schema.alterTable(`tg_dialog`, table => table.dropColumn(`channel_id`))
  await knex.schema.alterTable(`tg_dialog`, table => table.dropColumn(`chat_id`))
  await knex.schema.alterTable(`tg_dialog`, table => table.dropColumn(`user_id`))
  await knex.raw('alter table `tg_dialog` add column `peer_id` integer not null references `tg_peer`(`id`)')
  for (let dialog of dialogs) {
    let { channel_id, chat_id, user_id, ...rest } = dialog
    let peer = await knex('tg_peer').where({ user_id, chat_id, channel_id }).select('id').first()
    if (!peer) {
      let inserted = await knex('tg_peer').insert({
        user_id,
        chat_id,
        channel_id,
      }).returning('id')
      peer = inserted[0]
      if (!peer.id) {
        throw new Error('Failed to get inserted peer id')
      }
    }
    await knex('tg_dialog').insert({
      peer_id: peer.id,
      ...rest,
    })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  let dialogs = await knex('tg_dialog')
    .join('tg_peer', 'tg_dialog.peer_id', 'tg_peer.id')
    .select(
      'tg_dialog.*',
      'tg_peer.user_id as user_id',
      'tg_peer.chat_id as chat_id',
      'tg_peer.channel_id as channel_id',
    )
  await knex('tg_dialog').delete()
  await knex.schema.alterTable(`tg_dialog`, table => table.dropColumn(`peer_id`))
  await knex.raw('alter table `tg_dialog` add column `user_id` integer null references `tg_user`(`id`)')
  await knex.raw('alter table `tg_dialog` add column `chat_id` integer null references `tg_chat`(`id`)')
  await knex.raw('alter table `tg_dialog` add column `channel_id` integer null references `tg_channel`(`id`)')
  await knex.schema.dropTableIfExists('tg_peer')
  for (let dialog of dialogs) {
    let { user_id, chat_id, channel_id, peer_id, ...rest } = dialog
    await knex('tg_dialog').insert({
      user_id,
      chat_id,
      channel_id,
      ...rest,
    })
  }
}
