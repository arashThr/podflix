const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')

const paymentWizard = require('./paymentWizard')
const User = require('./user')

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx, next) => {
    const tgUser = ctx.from
    if (tgUser.is_bot) return

    const user = User.findUser(tgUser)

    if (user) ctx.reply('Welcome back')
    else {
        ctx.reply('You are unknown')
        next() // Go to wizard
    }
})

const stage = new Stage([paymentWizard], { default: 'payment-wizard' })
bot.use(session())
bot.use(stage.middleware())

exports.launchBot = function launchBot() {
    bot.launch()
    console.log('Bot started')
}
