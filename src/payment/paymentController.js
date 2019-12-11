const configs = require('../configs')
const logger = require('../logger')

const listenToPayments = require('./paymentListener')

const { getPaymentLink } = require('./payping')
const { getStripePaymentLink } = require('./stripeRoute')

const { findDiscountFor, savePaymentDiscountFor } = require('./discounts')
const { irrPaymentModel, usdPaymentModel, paymentState } = require('../models/paymentModel')

const { PayedUserModel } = require('../models/userModel')

const paymentWaitList = new Map()
const usersPaymentsDocs = new Map()
listenToPayments(paymentWaitList)

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

async function createPaypinPayment(chatId) {
    const amount = await getToomanAmount(chatId)
    const payment = await irrPaymentModel.create({ amount, chatId })

    logger.info('IRR Amout:' + amount)
    const link = await getPaymentLink({
        amount,
        clientRefId: payment._id.toString()
    })
    logger.debug('Payping payment link: ' + link)
    if (link) usersPaymentsDocs.set(chatId, payment._id)
    return link
}

async function createStripePayment(chatId) {
    const amount = await getDollarAmount(chatId)
    const payment = await usdPaymentModel.create({ amount, chatId })

    logger.info('Dollar Amout:' + amount)
    const link = await getStripePaymentLink({
        amount,
        clientRefId: payment._id.toString()
    })
    logger.debug('Stripe payment link: ' + link)
    if (link) usersPaymentsDocs.set(chatId, payment._id)
    return link
}

async function waitForStripePay(user) {
    return waitForPay(user, usdPaymentModel)
}

async function waitForPaypinPay(user) {
    return waitForPay(user, irrPaymentModel)
}

async function waitForPay(user, paymentModel) {
    const payId = usersPaymentsDocs.get(user.chatId)

    try {
        const refId = await waitForPayment(payId)
        logger.debug('Payment resolved with ref id of: ' + refId)

        await savePaymentDiscountFor(user.chatId, payId)
        await paymentModel.updateOne({ _id: payId }, {
            $set: {
                refId,
                updated: new Date(),
                status: paymentState.successful
            }
        })

        user.paymentId = payId
        await PayedUserModel.create(user)

        return true
    } catch (error) {
        logger.error('Error occured in payment process', { error })
        paymentModel.updateOne({ _id: payId }, {
            $set: {
                updated: new Date(),
                status: paymentState.canceled
            }
        })
        return false
    }
}

async function waitForPayment(payId) {
    const paymentPromise = new Promise((resolve, reject) => {
        paymentWaitList.set(String(payId), { resolve, reject })
    })
    const refId = await paymentPromise
    return refId
}

module.exports = {
    createStripePayment,
    waitForStripePay,
    createPaypinPayment,
    waitForPaypinPay
}
