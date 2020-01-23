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
        const { clientRefId, successful, extra } = JSON.parse(message)
        logger.verbose(
            `Payment listener result: ${successful}`, { clientRefId, extra }
        )

        if (!ObjectId.isValid(clientRefId)) {
            logger.warn('Invalid object id for payId ' + clientRefId)
            return
        }
        const payId = ObjectId(clientRefId)

        const payment = await PaymentModel.findById(payId)
        if (!payment) {
            logger.warn('No payment found for payId ' + payId)
            return
        }
        const tgUser = payment.tgUser

        if (!successful) {
            logger.info('Payment canceled on payId ', { payId, ...tgUser, extra })
            bot.telegram.sendMessage(tgUser.chatId, __('pay.canceled'))
            return
        }
        logger.debug('Payment listener received verifed payment', { payId, ...tgUser, extra })

        try {
            await savePaymentDiscountFor(tgUser.chatId, payId)
            await PaymentModel.updateOne(
                { _id: payId },
                {
                    $set: {
                        extra,
                        updated: new Date(),
                        status: paymentState.successful
                    }
                }
            )

            await PayedUserModel.create({ paymentId: payId, ...tgUser.toObject() })
            logger.info('New user subscribed successfully', { payId, ...tgUser, extra })
            bot.telegram.sendMessage(tgUser.chatId, __('pay.success'), {
                parse_mode: 'Markdown'
            })
        } catch (error) {
            logger.error('Error occured in payment process', { error, ...tgUser })
            PaymentModel.updateOne(
                { _id: payId },
                {
                    $set: {
                        updated: new Date(),
                        status: paymentState.canceled
                    }
                }
            )
            bot.telegram.sendMessage(tgUser.chatId, __('pay.success'), {
                parse_mode: 'Markdown'
            })
        }
    })

    sub.subscribe('payment-verify')
}

module.exports = listenToPayments
