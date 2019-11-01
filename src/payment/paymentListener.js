const express = require('express')
const fetch = require('node-fetch')
const url = require('url')
const redis = require('redis')
const logger = require('../logger')

const pub = redis.createClient(process.env.REDIS_URL)

const app = express()
const port = 3000
const paypingReturnPath = new url.URL(process.env.PAYMENT_RETURN_ADDRESS)
    .pathname

// PayPing Return URL
app.get(paypingReturnPath, async (req, res) => {
    console.log('Payment is done. Return URL called')
    const refId = req.query.refid
    const clientRefId = req.query.clientrefid

    console.log(`Ref: ${refId}, client: ${clientRefId}`)
    console.log('Doing verfication ....')
    res.sendStatus(200)

    const verifyBody = JSON.stringify({
        amount: 100,
        refId: refId
    })
    const resp = await fetch(`${process.env.PAYPING_SERVER}/v1/pay/verify`, {
        method: 'POST',
        body: verifyBody,
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + process.env.PAYPING_TOKEN
        }
    })
    const chatId = process.env.DEFAULT_CHAT_ID
    pub.publish('payment-verify', JSON.stringify({
        chatId, status: resp.status
    }))
})

// FOR PAYPING TESTING LOCAL
if (process.env.NODE_ENV !== 'production') {
    // Parse JSON bodies (as sent by API clients)
    app.use(express.json())

    app.post('/v1/pay', (req, res) => {
        console.log('New request', req.url)
        console.log('Sendgin to code ...')
        res.send(
            JSON.stringify({
                code: '8c649a'
            })
        )
    })

    app.post('/v1/pay/verify', (req, res) => {
        console.log('Verfication called for amount: ', req.body)
        res.sendStatus(200)
    })

    const querystring = require('querystring')
    app.get('/v1/pay/gotoipg/*', async (req, res) => {
        console.log('Doing pyament')
        const qs = querystring.stringify({
            refid: '1250',
            clientrefid: '4323'
        })

        const url = process.env.PAYMENT_RETURN_ADDRESS + '/?' + qs
        res.redirect(url)
    })
}

exports.startListen = function startListen() {
    app.listen(port, () => logger.info(`Payment server start on port ${port}!`))
}
