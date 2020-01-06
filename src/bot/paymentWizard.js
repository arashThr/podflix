const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const Composer = require('telegraf/composer')

const configs = require('../configs')
const Commons = require('../common')

const {
    applyDiscount,
    addFreeUser,
    findDiscountFor
} = require('../payment/discounts')
const {
    createZarinpalPayment,
    createStripePayment
} = require('../payment/paymentController')

function showPaymentOptions(reply) {
    reply(
        __('pay.pay-method'),
        Markup.inlineKeyboard([
            Markup.callbackButton(__('pay.payping-btn'), 'iran'),
            Markup.callbackButton(__('pay.stripe-btn'), 'tg-payment'),
            Markup.callbackButton(__('pay.return-home-btn'), 'return-home') // Todo
        ]).extra({ parse_mode: 'Markdown' })
    )
}

function getPaymentsFuncs(isUSD, discount) {
    const { dollarPrice, toomanPrice } = discount || {}
    const createPayment = isUSD ? createStripePayment : createZarinpalPayment
    const priceString = isUSD
        ? Commons.getDollarString(dollarPrice || configs.app.dollarPrice)
        : Commons.getToomanString(toomanPrice || configs.app.toomanPrice)
    return { createPayment, priceString }
}

const paymentDecisonStep = ctx => {
    showPaymentOptions(ctx.reply)
    return ctx.wizard.next()
}

const sendPaymentLinkStep = new Composer()
sendPaymentLinkStep.action('iran', async ctx => {
    ctx.session.isUSD = false
    paymentProcess(ctx)
    return ctx.wizard.next()
})

sendPaymentLinkStep.action('tg-payment', async ctx => {
    ctx.session.isUSD = true
    paymentProcess(ctx)
    return ctx.wizard.next()
})

sendPaymentLinkStep.action('return-home', async ctx => {
    ctx.editMessageText(__('pay.return-home'))
    return ctx.scene.leave()
})

async function paymentProcess(ctx) {
    const tgUser = Commons.getUserFrom(ctx.from)
    const discount = await findDiscountFor(tgUser.chatId)
    const { createPayment, priceString } = getPaymentsFuncs(
        ctx.session.isUSD,
        discount
    )

    const link = await createPayment(tgUser)

    if (!link) {
        ctx.editMessageText(__('pay.link-failed'))
        ctx.scene.leave()
        return
    }
    await ctx.editMessageText(
        __('pay.payment-desc', priceString),
        Markup.inlineKeyboard([
            [Markup.urlButton(__('pay.pay-btn'), link)],
            [
                Markup.callbackButton(
                    __('pay.return-to-payment-btn'),
                    'reenter-payment'
                ),
                Markup.callbackButton(__('pay.promo-code-btn'), 'promo-code')
            ]
        ]).extra({ parse_mode: 'Markdown' })
    )
}

const returnToPaymentOptions = new Composer()
returnToPaymentOptions.action('reenter-payment', ctx => {
    showPaymentOptions(ctx.editMessageText)
    return ctx.wizard.back()
})

returnToPaymentOptions.action('promo-code', async ctx => {
    await ctx.reply(__('discount.enter-code'))
    return ctx.wizard.next()
})

const promoCode = new Composer()
promoCode.on('text', async ctx => {
    const code = ctx.message.text
    const chatId = ctx.from.id
    const result = await applyDiscount(chatId, code)
    if (result.discountId) {
        ctx.reply(__('discount.applied'))
        if (result.isFree) {
            ctx.session.payInfo = null
            const user = Commons.getUserFrom(ctx.from)
            await addFreeUser(user, result.discountId)
            return ctx.scene.enter('user-menu-scene')
        }
    } else {
        ctx.reply(__('discount.failed', result.reason))
    }
    const discount = await findDiscountFor(chatId)
    const tgUser = Commons.getUserFrom(ctx.from)
    const { createPayment, priceString } = getPaymentsFuncs(
        ctx.session.isUSD,
        discount
    )
    ctx.session.payInfo = null

    const link = await createPayment(tgUser)

    if (!link) {
        ctx.editMessageText(__('pay.link-failed'))
        ctx.scene.leave()
        return
    }
    await ctx.reply(
        __('pay.payment-desc', priceString),
        Markup.inlineKeyboard([
            Markup.urlButton(__('pay.pay-btn'), link),
            Markup.callbackButton(
                __('pay.return-to-payment-btn'),
                'reenter-payment'
            )
        ]).extra({ parse_mode: 'Markdown' })
    )
    return ctx.wizard.next()
})

const reenterAfterDiscount = new Composer()
reenterAfterDiscount.action('reenter-payment', async ctx => {
    await ctx.deleteMessage()
    return ctx.scene.reenter()
})

const paymentWizard = new WizardScene(
    'payment-wizard',
    paymentDecisonStep,
    sendPaymentLinkStep,
    returnToPaymentOptions,
    promoCode,
    reenterAfterDiscount
)

module.exports = paymentWizard
