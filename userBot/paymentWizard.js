const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const Composer = require('telegraf/composer')
const { getPaymentLink } = '../payment/payping'

const Payments = require('./payment')
const User = require('./user')

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
    ctx.editMessageText(
        'Pay from Iran',
        Markup.inlineKeyboard([
            Markup.urlButton('Pay', link)
        ]).extra()
    )

    const paymentPromise = new Promise((resolve, reject) => {
        Payments.addPay(ctx.chat.id, { resolve, reject })
    })

    try {
        console.log('Resolved: ' + (await paymentPromise))
        ctx.editMessageText('Success')
        User.addNewUser(ctx.from)
        ctx.scene.enter('user-menu-scene')
    } catch (e) {
        console.log('Payment failed ... ', e)
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

const waitForPaymentStep = new Composer()
waitForPaymentStep.use(ctx => {
    console.log('AFTER')

    ctx.reply('Done111')
    ctx.scene.leave()
})

const paymentWizard = new WizardScene(
    'payment-wizard',
    selectBuyStep,
    paymentDecisonStep,
    sendPaymentLinkStep,
    waitForPaymentStep,
    ctx => {
        ctx.reply('Done')
        return ctx.scene.leave()
    }
)

module.exports = paymentWizard
