const redis = require('redis')

const configs = require('../configs')
const logger = require('../logger')

const sub = redis.createClient(configs.redisUrl)

function listenToPayments(paymentWaitList) {
    sub.on('message', (channel, message) => {
        const { clientRefId, successful } = JSON.parse(message)
        logger.verbose(`New message for ${channel}, refId: ${clientRefId}, successful: ${successful}`)
        const paymentPromise = paymentWaitList.get(clientRefId)

        if (!paymentPromise) {
            logger.info('Payment verfied - No promise to resolve')
            return
        }

        const { resolve, reject } = paymentPromise

        if (successful) {
            logger.verbose('Payment verifed')
            resolve(clientRefId)
        } else {
            logger.verbose('Payment failed')
            reject(clientRefId)
        }
    })

    sub.subscribe('payment-verify')
}

module.exports = listenToPayments
