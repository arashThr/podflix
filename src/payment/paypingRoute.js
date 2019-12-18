const express = require('express')
const redis = require('redis')
const logger = require('../logger')
const configs = require('../configs')
const { ObjectId } = require('mongodb')
const { verifyPayment } = require('./payping')
const { paymentReturnPageInfo } = require('../common')

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

    const verified = await verifyPayment(new ObjectId(clientRefId), refId)
    if (verified) {
        res.render('stripe-success', {
            session: { clientRefId, refId },
            ...paymentReturnPageInfo
        })
    } else {
        res.render('stripe-canceled', paymentReturnPageInfo())
    }

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
