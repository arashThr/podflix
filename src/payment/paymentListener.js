const express = require('express')
const fetch = require('node-fetch')
const url = require('url')
const redis = require('redis')
const logger = require('../logger')
const configs = require('../configs')

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

    console.log(`Ref: ${refId}, client: ${clientRefId}`)
    console.log('Doing verfication ....')
    res.sendStatus(200)

    const verifyBody = JSON.stringify({
        amount: 100,
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
    const chatId = configs.adminChatId
    pub.publish('payment-verify', JSON.stringify({
        chatId, status: resp.status
    }))
})

// FOR PAYPING TESTING LOCAL
if (configs.NODE_ENV !== 'production') {
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

        const url = configs.payping.returnUrl + '/?' + qs
        res.redirect(url)
    })
}

exports.startListen = function startListen() {
    app.listen(port, () => logger.info(`Payment server start on port ${port}!`))
}
