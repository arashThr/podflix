const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const Composer = require('telegraf/composer')

const configs = require('../configs')
const Commons = require('../common')

const {
    createPaypinPayment,
    waitForPaypinPay,
    createStripePayment,
    waitForStripePay
} = require('../payment/paymentController')

const selectBuyStep = ctx => {
    ctx.reply(
        'Episode descriptions',
        Markup.inlineKeyboard([
            Markup.callbackButton('Buy', 'buy'),
            Markup.urlButton('Visit site', configs.serverUrl)
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
    paymentProcess(ctx, createPaypinPayment, waitForPaypinPay)
})

sendPaymentLinkStep.action('tg-payment', async ctx => {
    paymentProcess(ctx, createStripePayment, waitForStripePay)
})

async function paymentProcess(ctx, createPayment, waitForPay) {
    const user = Commons.getUserFrom(ctx.from)
    const link = await createPayment(user.chatId)

    if (!link) {
        ctx.editMessageText('Getting payment link failed. Try again /start')
        ctx.scene.leave()
        return
    }
    await ctx.editMessageText(
        'Click to pay',
        Markup.inlineKeyboard([Markup.urlButton('Pay', link)]).extra()
    )

    const success = await waitForPay(user)

    if (success) {
        ctx.editMessageText('Success')
        ctx.scene.enter('user-menu-scene')
    } else {
        ctx.editMessageText('Payment canceled. Please try again or contact us')
        ctx.scene.enter('payment-wizard')
    }
}

const paymentWizard = new WizardScene(
    'payment-wizard',
    selectBuyStep,
    paymentDecisonStep,
    sendPaymentLinkStep
)

module.exports = paymentWizard
