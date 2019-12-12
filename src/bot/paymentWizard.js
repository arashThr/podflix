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
        __('pay.buy-collection'),
        Markup.inlineKeyboard([
            Markup.callbackButton(__('pay.buy-btn'), 'buy'),
            Markup.urlButton(__('pay.visit-site-btn'), configs.serverUrl)
        ]).extra()
    )
    return ctx.wizard.next()
}

const paymentDecisonStep = new Composer()
paymentDecisonStep.action('buy', ctx => {
    ctx.editMessageText(
        __('pay.pay-method'),
        Markup.inlineKeyboard([
            Markup.callbackButton(__('pay.iran-pay'), 'iran'),
            Markup.callbackButton(__('pay.stripe'), 'tg-payment')
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
        ctx.editMessageText(__('pay.link-failed'))
        ctx.scene.leave()
        return
    }
    await ctx.editMessageText(
        __('pay.click-to-pay'),
        Markup.inlineKeyboard([Markup.urlButton(__('pay.pay-btn'), link)]).extra()
    )

    const success = await waitForPay(user)

    if (success) {
        ctx.editMessageText(__('pay.success'))
        ctx.scene.enter('user-menu-scene')
    } else {
        ctx.editMessageText(__('pay.canceled'))
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
