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
        bot.command('clear', async ctx => {
            await UserModel.deleteOne({ chatId: ctx.from.id })
            ctx.reply('User dropped')
        })
    }
    // For support
    bot.command('getId', ctx => ctx.reply(`You chat id is: ${ctx.from.id}`))
}

async function botStart(ctx) {
    const tgUser = ctx.from
    if (tgUser.is_bot) return

    const user = await UserModel.findOne({ chatId: tgUser.id })

    if (user) {
        ctx.scene.enter('user-menu-scene')
    } else {
        await ctx.reply(
            __('start.unknown-user'),
            Markup.keyboard([
                [__('start.teaser-btn'), __('start.ep0-btn')],
                [__('start.buy-btn')],
                [__('start.about-btn'), __('start.creators-btn')]
            ])
                .oneTime()
                .resize()
                .extra({ parse_mode: 'Markdown' })
        )
    }
}

exports.initBot = initBot
