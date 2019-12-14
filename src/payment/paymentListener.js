const redis = require('redis')

const configs = require('../configs')
const logger = require('../logger')

const { savePaymentDiscountFor } = require('./discounts')
const { paymentState, PaymentModel } = require('../models/paymentModel')
const { ObjectId } = require('mongodb')

const { PayedUserModel } = require('../models/userModel')

const sub = redis.createClient(configs.redisUrl)

function listenToPayments(bot) {
    sub.on('message', async (channel, message) => {
        // Todo: get ref id of payment
        const { clientRefId, successful } = JSON.parse(message)
        const payId = clientRefId
        logger.verbose(`New message for ${channel}, refId(payId): ${payId}, successful: ${successful}`)

        if (!ObjectId.isValid(payId)) {
            logger.warn('Invalid object id for payId: ', { payId })
            return
        }

        const paymentModel = await PaymentModel.findById(ObjectId(payId))
        if (!paymentModel) {
            logger.warn('No payment found for payId: ', { payId })
            return
        }
        const tgUser = paymentModel.tgUser

        if (!successful) {
            logger.verbose('Payment canceled')
            bot.telegram.sendMessage(tgUser.chatId, __('pay.canceled'))
            return
        }
        logger.verbose('Payment verifed')

        try {
            await savePaymentDiscountFor(tgUser.chatId, payId)
            await paymentModel.updateOne({ _id: payId }, {
                $set: {
                    updated: new Date(),
                    status: paymentState.successful
                }
            })

            tgUser.paymentId = payId
            await PayedUserModel.create(tgUser.toObject())
            bot.telegram.sendMessage(tgUser.chatId, __('pay.success'))
        } catch (error) {
            logger.error('Error occured in payment process', { error })
            paymentModel.updateOne({ _id: payId }, {
                $set: {
                    updated: new Date(),
                    status: paymentState.canceled
                }
            })
            bot.telegram.sendMessage(tgUser.chatId, __('pay.success'))
        }
    })

    sub.subscribe('payment-verify')
}

module.exports = listenToPayments
