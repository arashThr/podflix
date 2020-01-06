const configs = require('../configs')
const logger = require('../logger')

const { getPaymentLink } = require('./payping')
const { getZarinpalPaymentLink } = require('./zarinpalRoute')
const { getStripePaymentLink } = require('./stripeRoute')

const { findDiscountFor } = require('./discounts')
const { irrPaymentModel, usdPaymentModel } = require('../models/paymentModel')

async function getToomanAmount(chatId) {
    const discount = await findDiscountFor(chatId)
    if (!discount) return configs.app.toomanPrice
    return discount.toomanPrice
}

async function getDollarAmount(chatId) {
    const discount = await findDiscountFor(chatId)
    if (!discount) return configs.app.dollarPrice
    return discount.dollarPrice
}

async function createPaypingPayment(tgUser) {
    const amount = await getToomanAmount(tgUser.chatId)
    const payment = await irrPaymentModel.create({ amount, tgUser })

    const link = await getPaymentLink({
        amount,
        clientRefId: payment._id.toString()
    })
    logger.debug('Payping payment link: ' + link)
    return link
}

async function createStripePayment(tgUser) {
    const amount = await getDollarAmount(tgUser.chatId)
    const payment = await usdPaymentModel.create({ amount, tgUser })

    const link = await getStripePaymentLink({
        amount,
        clientRefId: payment._id.toString()
    })
    logger.debug('Stripe payment link: ' + link)
    return link
}

async function createZarinpalPayment(tgUser) {
    const amount = await getToomanAmount(tgUser.chatId)
    const payment = await irrPaymentModel.create({ amount, tgUser })

    const link = await getZarinpalPaymentLink({
        amount,
        clientRefId: payment._id.toString()
    })
    logger.debug('Zarinpal payment link: ' + link)
    return link
}

module.exports = {
    createStripePayment,
    createZarinpalPayment,
    createPaypingPayment
}
