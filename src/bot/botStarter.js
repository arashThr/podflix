const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const { enter } = Stage

const configs = require('../configs')
const i18n = require('i18n')
const { i18nInit } = require('./localization')

// Admin
const loginScene = require('./loginScene')
const dashboardScene = require('./adminDashboard')

// User
const paymentWizard = require('./paymentWizard')
const userMenuScene = require('./userMenu')
const discountScene = require('./discountScene')
const { UserModel } = require('../models/userModel')

const bot = new Telegraf(configs.botToken)
bot.use(session())

const stage = new Stage([
    loginScene,
    dashboardScene,
    paymentWizard,
    userMenuScene,
    discountScene
])
bot.use(stage.middleware())
bot.command('login', enter('login'))
bot.command('promo', enter('discount-scene'))

bot.start(async ctx => {
    const tgUser = ctx.from
    if (tgUser.is_bot) return

    const user = await UserModel.findOne({ chatId: tgUser.id })

    if (user) {
        ctx.reply(__('start.welcome-back')).then(() => ctx.scene.enter('user-menu-scene'))
    } else {
        ctx.reply(__('start.unknown-user')).then(() =>
            ctx.scene.enter('payment-wizard')
        )
    }
})

exports.launchBot = function launchBot() {
    i18nInit()
    bot.launch()
    console.log('Bot started')
}
