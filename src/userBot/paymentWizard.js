const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const Composer = require('telegraf/composer')
const redis = require('redis')
const { getPaymentLink } = require('../payment/payping')

const logger = require('../logger')
const User = require('./user')

const sub = redis.createClient(process.env.REDIS_URL)
sub.on('message', (channel, message) => {
    const { chatId, status } = JSON.parse(message)
    console.log('New message from ' + channel + ', message: ' + chatId)
    const paymentPromise = payments.get(String(chatId))

    if (!paymentPromise) {
        logger.info('Payment verfied - No promise to resolve')
        return
    }

    const { resolve, reject } = paymentPromise

    if (status === 200) {
        logger.verbose('Payment verifed')
        resolve(chatId)
    } else {
        if (status === 400) logger.verbose('Payment canceled')
        else logger.error('Verification failed')
        reject(chatId)
    }
})
sub.subscribe('payment-verify')

const selectBuyStep = ctx => {
    ctx.reply(
        'Episode descriptions',
        Markup.inlineKeyboard([
            Markup.callbackButton('Buy', 'buy'),
            Markup.urlButton('Visit site', 'https://google.com')
        ]).extra()
    )
    return ctx.wizard.next()
}

const payments = new Map()

const paymentDecisonStep = new Composer()
paymentDecisonStep.action('buy', ctx => {
    ctx.editMessageText(
        'Are you in Iran?',
        Markup.inlineKeyboard([
            Markup.callbackButton('Yes', 'iran'),
            Markup.callbackButton('No', 'tg-payment')
        ]).extra()
    )
    return ctx.wizard.next()
})

const sendPaymentLinkStep = new Composer()
sendPaymentLinkStep.action('iran', async ctx => {
    const link = await getPaymentLink(100)
    if (!link) {
        ctx.editMessageText('Getting payment link failed. Try again later - /start')
        ctx.scene.leave()
        return
    }
    ctx.editMessageText(
        'Pay from Iran',
        Markup.inlineKeyboard([
            Markup.urlButton('Pay', link)
        ]).extra()
    )

    const paymentPromise = new Promise((resolve, reject) => {
        payments.set(String(ctx.chat.id), { resolve, reject })
    })

    try {
        logger.debug('Payment resolved: ' + (await paymentPromise))
        ctx.editMessageText('Success')
        User.addNewUser(ctx.from)
        ctx.scene.enter('user-menu-scene')
    } catch (e) {
        logger.error('Payment failed ... ', e)
        ctx.editMessageText('Failed! - Please try again or contact us')
        ctx.scene.enter('payment-wizard')
    }
})
sendPaymentLinkStep.action('tg-payment', ctx => {
    ctx.editMessageText(
        'Pay with telegram payment. Open this URL:',
        Markup.inlineKeyboard([
            Markup.urlButton('Telegram Payment', 'http://google.com')
        ]).extra()
    )
})

const paymentWizard = new WizardScene(
    'payment-wizard',
    selectBuyStep,
    paymentDecisonStep,
    sendPaymentLinkStep
)

module.exports = paymentWizard
