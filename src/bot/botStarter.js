const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const { enter } = Stage
const configs = require('../configs')

// Admin
const loginScene = require('./loginScene')
const dashboardScene = require('./adminDashboard')

// User
const paymentWizard = require('./paymentWizard')
const userMenuScene = require('./userMenu')
const { usersCollection } = require('../db')

const bot = new Telegraf(configs.botToken)
bot.use(session())

const stage = new Stage([
    loginScene,
    dashboardScene,
    paymentWizard,
    userMenuScene
])
bot.use(stage.middleware())
bot.command('login', enter('login'))

bot.start(async ctx => {
    const tgUser = ctx.from
    if (tgUser.is_bot) return

    const user = await usersCollection().findOne({ chatId: tgUser.id })

    if (user) {
        ctx.reply('Welcome back').then(() => ctx.scene.enter('user-menu-scene'))
    } else {
        ctx.reply('You are unknown').then(() =>
            ctx.scene.enter('payment-wizard')
        )
    }
})

exports.launchBot = function launchBot() {
    bot.launch()
    console.log('Bot started')
}
