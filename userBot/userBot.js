const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')

const paymentWizard = require('./paymentWizard')

exports.launchBot = function launchBot() {
  const bot = new Telegraf(process.env.BOT_TOKEN)
  const stage = new Stage([paymentWizard], { default: 'payment-wizard' })
  bot.use(session({ /* ttl: 1000 */ }))
  bot.use(stage.middleware())
  bot.launch()
  console.log('Bot started')
}
