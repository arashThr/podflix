const session = require('telegraf/session')
const Markup = require('telegraf/markup')
const Stage = require('telegraf/stage')
const { enter } = Stage

const configs = require('../configs')
const logger = require('../logger')
const Commons = require('../common')
const { redisClient } = require('../db')

// Admin
const loginScene = require('./loginScene')
const dashboardScene = require('./adminDashboard')

// User
const paymentWizard = require('./paymentWizard')
const userMenuScene = require('./userMenu')
const discountScene = require('./discountScene')
const { UserModel } = require('../models/userModel')
const DiscountModel = require('../models/discountModel')
const listenToPayments = require('../payment/paymentListener')

const menuKeys = Markup.keyboard([
    [__('start.teaser-btn'), __('start.ep0-btn')],
    [__('start.buy-btn')],
    [__('start.about-btn'), __('start.creators-btn')]
])
    .oneTime()
    .resize()
    .extra({ parse_mode: 'Markdown' })

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

    bot.start(botStart)

    bot.command('login', enter('login'))
    bot.hears(__('start.buy-btn'), enter('payment-wizard'))

    bot.hears(__('start.teaser-btn'), ctx => {
        redisClient.get(Commons.teaserKey, (err, fileId) => {
            if (err) logger.error('Getting teaser failed', { err })
            else if (fileId) ctx.replyWithVideo(fileId, { caption: __('start.teaser') })
            else ctx.reply('Not available')
        })
    })

    bot.hears(__('start.ep0-btn'), ctx => {
        redisClient.get(Commons.ep0Key, (err, fileId) => {
            if (err) logger.error('Getting teaser failed', { err })
            else if (fileId) ctx.replyWithAudio(fileId, { caption: __('start.ep0') })
            else ctx.reply('Not available')
        })
    })

    bot.hears(__('start.about-btn'), ({ reply }) =>
        reply(__('start.about'), { parse_mode: 'Markdown' })
    )
    bot.hears(__('start.creators-btn'), ({ reply }) =>
        reply(__('start.creators'), { parse_mode: 'Markdown' })
    )

    bot.command('clearAccount', async ctx => {
        const chatId = ctx.from.id
        await UserModel.deleteOne({ chatId })
        await DiscountModel.deleteOne({ chatId })
        ctx.reply('User dropped')
    })

    // For support
    bot.command('getId', ctx => ctx.reply(`You chat id is: ${ctx.from.id}`))

    // In case all other middlewares fail, call bot start
    bot.use(botStart)
}

async function botStart(ctx) {
    const tgUser = ctx.from
    if (tgUser.is_bot) return

    const user = await UserModel.findOne({ chatId: tgUser.id })

    if (user) {
        ctx.scene.enter('user-menu-scene')
    } else {
        await ctx.reply(__('start.unknown-user'), menuKeys)
    }
}

exports.initBot = initBot
