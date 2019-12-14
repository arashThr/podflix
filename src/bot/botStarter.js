const session = require('telegraf/session')
const Markup = require('telegraf/markup')
const Stage = require('telegraf/stage')
const { enter } = Stage

const configs = require('../configs')

// Admin
const loginScene = require('./loginScene')
const dashboardScene = require('./adminDashboard')

// User
const paymentWizard = require('./paymentWizard')
const userMenuScene = require('./userMenu')
const discountScene = require('./discountScene')
const { UserModel } = require('../models/userModel')
const listenToPayments = require('../payment/paymentListener')

// For more info on webhookReply: false checkout this issue:
// https://github.com/telegraf/telegraf/issues/320

function initBot(bot) {
    listenToPayments(bot)
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

    bot.hears(__('start.buy-btn'), ctx => {
        ctx.scene.enter('payment-wizard')
    })

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
        await ctx.reply(
            __('start.unknown-user'),
            Markup.keyboard([
                [__('start.buy-btn'), __('start.teaser-btn')], // Row1 with 2 buttons
                [__('start.ep0-btn'), __('start.about-btn')], // Row2 with 2 buttons
                [__('start.creators-btn'), '👥 Share'] // Row3 with 3 buttons
            ])
                .oneTime()
                .resize()
                .extra()
        )
    }
}

exports.initBot = initBot
