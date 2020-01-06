const fetch = require('node-fetch')
const express = require('express')
const redis = require('redis')
const { ObjectId } = require('mongodb')

const configs = require('../configs')
const logger = require('../logger')
const { irrPaymentModel } = require('../models/paymentModel')
const { paymentReturnPageInfo } = require('../common')

const pub = redis.createClient(configs.redisUrl)

const returnPath = '/zarinpal-done'
const merchantId = configs.zarinpal.merchantId

async function getZarinpalPaymentLink({ amount, clientRefId }) {
    const body = {
        MerchantID: merchantId,
        Amount: amount,
        CallbackURL: `${configs.serverUrl}${configs.zarinpal.route}${returnPath}/${clientRefId}`,
        Description: __('pay.payload-desc')
    }

    try {
        const resp = await fetch(
            'https://www.zarinpal.com/pg/rest/WebGate/PaymentRequest.json',
            {
                method: 'post',
                body: JSON.stringify(body),
                headers: { 'Content-Type': 'application/json' }
            }
        )
        const result = (await resp.json()) || {}

        if (result.Status === 100) {
            const link =
                'https://www.zarinpal.com/pg/StartPay/' + result.Authority
            logger.verbose('Zain payment link created', { link })
            return link
        } else {
            logger.error('Creating zarinpal payment link failed', {
                err: JSON.stringify(result)
            })
        }
    } catch (err) {
        logger.error('Error in getting zarinpal payment link', err)
    }
}

async function verifyPayment(clientRefId, authority) {
    const payment = await irrPaymentModel.findOne(clientRefId)
    const amount = payment.amount
    const verifyBody = {
        MerchantID: merchantId,
        Authority: authority,
        Amount: amount
    }
    try {
        const resp = await fetch(
            'https://www.zarinpal.com/pg/rest/WebGate/PaymentVerification.json',
            {
                method: 'post',
                body: JSON.stringify(verifyBody),
                headers: { 'Content-Type': 'application/json' }
            }
        )
        const result = (await resp.json()) || {}
        if (result.Status === 100) {
            logger.info('Transation success. RefID:', { refId: result.RefID, authority })
            return result.RefID
        }
        logger.verbose('zarinpal Transction canceled', { result })
    } catch (err) {
        logger.error('Error in zarinpal payment verfication', err)
    }
}

const router = express.Router()

router.get(`${returnPath}/:clientRefId`, async (req, res) => {
    const clientRefId = req.params.clientRefId
    const Authority = req.query.Authority

    if (!ObjectId.isValid(clientRefId)) {
        logger.error('Object id is not valid: ', clientRefId)
        res.sendStatus(404)
        return
    }
    const verificationId = await verifyPayment(
        new ObjectId(clientRefId),
        Authority
    )
    if (verificationId) {
        res.render('stripe-success', {
            session: { clientRefId, refId: Authority },
            verificationId,
            ...paymentReturnPageInfo()
        })
    } else {
        res.render('stripe-canceled', paymentReturnPageInfo())
    }

    pub.publish(
        'payment-verify',
        JSON.stringify({
            clientRefId,
            successful: !!verificationId,
            extra: { Authority, verificationId }
        })
    )
})

module.exports = {
    getZarinpalPaymentLink,
    zarinpalRouter: router
}
