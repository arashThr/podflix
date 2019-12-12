const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const { enter } = Stage

const configs = require('../configs')
const { i18nInit } = require('./localization')

// Admin
const loginScene = require('./loginScene')
const dashboardScene = require('./adminDashboard')

// User
const paymentWizard = require('./paymentWizard')
const userMenuScene = require('./userMenu')
const discountScene = require('./discountScene')
const { UserModel } = require('../models/userModel')

// For more info on webhookReply: false checkout this issue:
// https://github.com/telegraf/telegraf/issues/320

function initBot(bot) {
    i18nInit()

    const stage = new Stage([
        loginScene,
        dashboardScene,
        paymentWizard,
        userMenuScene,
        discountScene
    ])

    bot.use(session())
    bot.use(stage.middleware())
    bot.command('login', enter('login'))
    bot.command('promo', enter('discount-scene'))
    bot.start(botStart)

    if (configs.isInDev) {
        const { getDb } = require('../db')
        bot.command('clear', async ctx => {
            await getDb().dropDatabase()
            ctx.reply('Database dropped')
        })
    }
}

async function botStart(ctx) {
    const tgUser = ctx.from
    if (tgUser.is_bot) return

    const user = await UserModel.findOne({ chatId: tgUser.id })

    if (user) {
        await ctx.reply(__('start.welcome-back'))
        ctx.scene.enter('user-menu-scene')
    } else {
        await ctx.reply(__('start.unknown-user'))
        ctx.scene.enter('payment-wizard')
    }
}

exports.initBot = initBot
