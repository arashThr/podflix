const express = require('express')
const redis = require('redis')
const logger = require('../logger')
const configs = require('../configs')
const { irrPaymentModel } = require('../models/paymentModel')
const { ObjectId } = require('mongodb')
const { verifyPayment } = require('./payping')

const pub = redis.createClient(configs.redisUrl)

const router = express.Router()

router.get(configs.payping.returnPath, async (req, res) => {
    console.log('Payment is done. Return URL called')
    const refId = req.query.refid
    const clientRefId = req.query.clientrefid

    logger.info(`Return URL called - Ref: ${refId}, clientId: ${clientRefId}`)

    if (!ObjectId.isValid(clientRefId)) {
        logger.error('Object id is not valid: ', clientRefId)
        res.sendStatus(404)
        return
    }
    res.sendStatus(200)

    const payment = await irrPaymentModel.findOne(
        new ObjectId(clientRefId)
    )

    const verified = await verifyPayment(payment.price, refId)

    pub.publish(
        'payment-verify',
        JSON.stringify({
            clientRefId,
            successful: verified
        })
    )
})

module.exports = {
    paypingRouter: router
}
