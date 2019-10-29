const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const { enter } = Stage

const paymentWizard = require('./paymentWizard')
const userMenuScene = require('./userMenu')
const User = require('./user')

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())

bot.start(ctx => {
    const tgUser = ctx.from
    if (tgUser.is_bot) return

    const user = User.findUser(tgUser)

    if (user) {
        ctx.reply('Welcome back')
        enter('user-menu-scene')
    } else {
        ctx.reply('You are unknown')
        enter('payment-wizard')
    }
})

const stage = new Stage([paymentWizard, userMenuScene])
bot.use(stage.middleware())

exports.launchBot = function launchBot() {
    bot.launch()
    console.log('Bot started')
}
