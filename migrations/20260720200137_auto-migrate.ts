import { Knex } from 'knex'

// prettier-ignore
export async function up(knex: Knex): Promise<void> {
  let users = await knex.select('id','dialog_id').from('tg_user')
  let chats = await knex.select('id','dialog_id').from('tg_chat')
  let channels = await knex.select('id','dialog_id').from('tg_channel')
  await knex.schema.alterTable(`tg_user`, table => table.dropColumn(`dialog_id`))
  await knex.schema.alterTable(`tg_chat`, table => table.dropColumn(`dialog_id`))
  await knex.schema.alterTable(`tg_channel`, table => table.dropColumn(`dialog_id`))
  await knex.raw('alter table `tg_dialog` drop column `is_channel`')
  await knex.raw('alter table `tg_dialog` drop column `is_group`')
  await knex.raw('alter table `tg_dialog` drop column `is_user`')
  await knex.raw('alter table `tg_dialog` add column `user_id` integer null references `tg_user`(`id`)')
  await knex.raw('alter table `tg_dialog` add column `chat_id` integer null references `tg_chat`(`id`)')
  await knex.raw('alter table `tg_dialog` add column `channel_id` integer null references `tg_channel`(`id`)')
  for (let user of users) {
    await knex('tg_dialog').where('id', user.dialog_id).update({ user_id: user.id })
  }
  for (let chat of chats) {
    await knex('tg_dialog').where('id', chat.dialog_id).update({ chat_id: chat.id })
  }
  for (let channel of channels) {
    await knex('tg_dialog').where('id', channel.dialog_id).update({ channel_id: channel.id })
  }
}

// prettier-ignore
export async function down(knex: Knex): Promise<void> {
  let dialogs = await knex('tg_dialog')
  let users = await knex('tg_user')
  let chats = await knex('tg_chat')
  let channels = await knex('tg_channel')
  await knex('tg_dialog').delete()
  await knex('tg_user').delete()
  await knex('tg_chat').delete()
  await knex('tg_channel').delete()
  await knex.schema.alterTable(`tg_dialog`, table => table.dropColumn(`channel_id`))
  await knex.schema.alterTable(`tg_dialog`, table => table.dropColumn(`chat_id`))
  await knex.schema.alterTable(`tg_dialog`, table => table.dropColumn(`user_id`))
  await knex.raw('alter table `tg_dialog` add column `is_user` boolean not null')
  await knex.raw('alter table `tg_dialog` add column `is_group` boolean not null')
  await knex.raw('alter table `tg_dialog` add column `is_channel` boolean not null')
  await knex.raw('alter table `tg_channel` add column `dialog_id` integer not null references `tg_dialog`(`id`)')
  await knex.raw('alter table `tg_chat` add column `dialog_id` integer not null references `tg_dialog`(`id`)')
  await knex.raw('alter table `tg_user` add column `dialog_id` integer not null references `tg_dialog`(`id`)')
  for (let dialog of dialogs) {
    let { user_id, chat_id, channel_id, ...rest } = dialog
    await knex('tg_dialog').insert({
      ...rest,
      is_user: !!user_id,
      is_group: !!chat_id,
      is_channel: !!channel_id,
    })
  }
  for (let user of users) {
    let dialog_id = dialogs.find(d => d.user_id === user.id)?.id
    await knex('tg_user').insert({ ...user, dialog_id })
  }
  for (let chat of chats) {
    let dialog_id = dialogs.find(d => d.chat_id === chat.id)?.id
    await knex('tg_chat').insert({ ...chat, dialog_id })
  }
  for (let channel of channels) {
    let dialog_id = dialogs.find(d => d.channel_id === channel.id)?.id
    await knex('tg_channel').insert({ ...channel, dialog_id })
  }
}
