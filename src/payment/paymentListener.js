const express = require('express')
const fetch = require('node-fetch')
const url = require('url')
const redis = require('redis')
const logger = require('../logger')
const configs = require('../configs')
const { paymentsCollection } = require('../db')
const { ObjectId } = require('mongodb')

const pub = redis.createClient(configs.redisUrl)

const app = express()
const port = configs.listenerPort
const paypingReturnPath = new url.URL(configs.payping.returnUrl)
    .pathname

// PayPing Return URL
app.get(paypingReturnPath, async (req, res) => {
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

    const payment = await paymentsCollection().findOne(
        new ObjectId(clientRefId)
    )

    const verifyBody = JSON.stringify({
        amount: payment.price,
        refId: refId
    })
    const resp = await fetch(`${configs.payping.server}/v1/pay/verify`, {
        method: 'POST',
        body: verifyBody,
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + configs.payping.token
        }
    })
    const chatId = payment.user.chatId
    pub.publish(
        'payment-verify',
        JSON.stringify({
            chatId,
            refId,
            status: resp.status
        })
    )
})

// FOR PAYPING TESTING LOCAL
if (configs.NODE_ENV !== 'production') {
    let payId
    // Parse JSON bodies (as sent by API clients)
    app.use(express.json())

    app.post('/v1/pay', (req, res) => {
        console.log('New request', req.url)
        payId = req.body.clientRefId
        console.log('Sendgin to code ...')
        res.send(
            JSON.stringify({
                code: '8c649a'
            })
        )
    })

    app.post('/v1/pay/verify', (req, res) => {
        console.log('Verfication called for price: ', req.body)
        res.sendStatus(200)
    })

    const querystring = require('querystring')
    app.get('/v1/pay/gotoipg/*', async (req, res) => {
        console.log('Doing pyament')
        const qs = querystring.stringify({
            refid: 'refId123',
            clientrefid: payId
        })

        const url = configs.payping.returnUrl + '/?' + qs
        res.redirect(url)
    })
}

exports.startListen = function startListen() {
    app.listen(port, () => logger.info(`Payment server start on port ${port}!`))
}
