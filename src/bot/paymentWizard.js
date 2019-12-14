const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const Composer = require('telegraf/composer')

const configs = require('../configs')
const Commons = require('../common')

const { createPaypinPayment, createStripePayment } = require('../payment/paymentController')

function showPaymentOptions(reply) {
    reply(
        __('pay.pay-method'),
        Markup.inlineKeyboard([
            Markup.callbackButton(__('pay.payping-btn'), 'iran'),
            Markup.callbackButton(__('pay.stripe-btn'), 'tg-payment'),
            Markup.callbackButton(__('pay.return-home-btn'), 'return-home') // Todo
        ]).extra()
    )
}

const paymentDecisonStep = ctx => {
    showPaymentOptions(ctx.reply)
    return ctx.wizard.next()
}

const sendPaymentLinkStep = new Composer()
sendPaymentLinkStep.action('iran', async ctx => {
    paymentProcess(ctx,
        createPaypinPayment,
        configs.app.toomanString
    )
})

sendPaymentLinkStep.action('tg-payment', async ctx => {
    paymentProcess(
        ctx,
        createStripePayment,
        configs.app.dollarString
    )
})

sendPaymentLinkStep.action('return-home', async ctx => {
    ctx.editMessageText(__('pay.return-home'))
    return ctx.scene.leave()
})

async function paymentProcess(ctx, createPayment, priceString) {
    const tgUser = Commons.getUserFrom(ctx.from)
    const link = await createPayment(tgUser)

    if (!link) {
        ctx.editMessageText(__('pay.link-failed'))
        ctx.scene.leave()
        return
    }
    await ctx.editMessageText(
        __('pay.payment-desc', priceString),
        Markup.inlineKeyboard([
            Markup.urlButton(__('pay.pay-btn'), link),
            // Todo
            Markup.callbackButton(__('pay.return-to-payment-btn'), 'reenter-payment')
        ]).extra()
    )
}

const returnToPaymentOptions = new Composer()
returnToPaymentOptions.action('reenter-payment', ctx => {
    showPaymentOptions(ctx.editMessageText)
})

const paymentWizard = new WizardScene(
    'payment-wizard',
    paymentDecisonStep,
    sendPaymentLinkStep,
    returnToPaymentOptions
)

module.exports = paymentWizard
