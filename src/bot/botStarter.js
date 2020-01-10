const session = require('telegraf/session')
const Markup = require('telegraf/markup')
const Stage = require('telegraf/stage')
const { enter } = Stage

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

    bot.catch((err, ctx) => {
        logger.error(`Ooops, ecountered an bot error for ${ctx.updateType}`, {
            err,
            message: ctx.message
        })
    })
    bot.start(botStart)

    bot.command('login', enter('login'))
    bot.hears(__('start.buy-btn'), enter('payment-wizard'))

    bot.hears(__('start.teaser-btn'), sendTeaser)
    bot.hears(__('start.ep0-btn'), sendEp0)
    bot.command('teaser', sendTeaser)

    bot.hears(__('start.about-btn'), ({ reply }) =>
        reply(__('start.about'), { parse_mode: 'Markdown' })
    )
    bot.hears(__('start.creators-btn'), ({ reply }) =>
        reply(__('start.creators'), { parse_mode: 'Markdown' })
    )

    bot.command('clearAccount', async ctx => {
        const chatId = ctx.from.id
        logger.info('User is deleting account', { chatId })
        await UserModel.deleteOne({ chatId })
        await DiscountModel.deleteOne({ chatId })
        ctx.reply('User dropped')
    })

    bot.command('teaser', ctx => {
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
        ctx.reply(__('start.unknown-user'), menuKeys).catch(() => {
            /* Ignore spams */
            logger.warn('Error sending message to user', { tgUser })
        })
    }
}

function sendTeaser(ctx) {
    redisClient.hgetall(Commons.teaserKey, (err, teaserInfo) => {
        if (err) logger.error('Getting teaser failed', { err })
        else if (!teaserInfo || !teaserInfo.fileId)
            ctx.reply('Not available')
        else
            ctx.replyWithVideo(teaserInfo.fileId, {
                caption: teaserInfo.caption || __('start.teaser'),
                parse_mode: 'Markdown'
            })
    })
}

function sendEp0(ctx) {
    redisClient.hgetall(Commons.ep0Key, (err, ep0Info) => {
        if (err) logger.error('Getting ep0 failed', { err })
        else if (!ep0Info || !ep0Info.fileId) ctx.reply('Not available')
        else
            ctx.replyWithAudio(ep0Info.fileId, {
                caption: ep0Info.caption || __('start.ep0'),
                parse_mode: 'Markdown'
            })
    })
}

exports.initBot = initBot
