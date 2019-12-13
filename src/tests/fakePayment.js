const configs = require('../configs')
const fetch = require('node-fetch')
const querystring = require('querystring')
const express = require('express')
const { getPaymentLink } = require('../payment/payping')
const { initDb } = require('../db')
const { irrPaymentModel } = require('../models/paymentModel')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

let payId
// Parse JSON bodies (as sent by API clients)
const route = express.Router()

route.post('/v1/pay', (req, res) => {
    console.log('New request', req.url)
    payId = req.body.clientRefId
    console.log('Sendgin to code ...')
    res.send(
        JSON.stringify({
            code: '8c649a'
        })
    )
})

route.post('/v1/pay/verify', (req, res) => {
    console.log('Verfication called for price: ', req.body)
    res.sendStatus(200)
})

route.get('/v1/pay/gotoipg/*', async (req, res) => {
    console.log('Doing pyament')
    const qs = querystring.stringify({
        refid: 'refId123',
        clientrefid: payId
    })

    const url = `${configs.serverUrl}:${configs.serverPort}/${configs.payping.route}/${configs.payping.returnPath}/?` + qs
    res.redirect(url)
})

async function simulatePaymentProcess() {
    await initDb()
    const price = 100
    const op = await irrPaymentModel.insertOne({
        created: new Date(),
        updated: new Date(),
        status: 'req',
        user: { chatId: configs.admin.chatId },
        price
    })
    if (!op.result.ok) {
        console.error('DB insert failed')
        process.exit(1)
    }
    const clientRefId = op.insertedId.toString()
    const link = await getPaymentLink({
        amount: price,
        clientRefId,
        payerIdentity: configs.admin.chatId,
        payerName: 'Arash'
    })
    console.log('Link is: ', link)

    console.log('Wating for user to click on line and pay ...')
    await sleep(1000)
    console.log('Payment is done. Returning to our address')

    const qs = querystring.stringify({
        refid: 'refId',
        clientrefid: clientRefId
    })

    const url = `${configs.serverUrl}:${configs.serverPort}${configs.payping.route}${configs.payping.returnPath}/?${qs}`
    console.log('URL: ', url)
    const resp = await fetch(url, {
        method: 'GET'
    })
    console.log('Status of return URL: ', resp.status)
    const delOp = await irrPaymentModel.deleteOne({ _id: op.insertedId })
    if (delOp.ok) console.log('Fake pay removed')
    else console.error('Fake pay remove failed')
}

exports.fakeRoutes = route
exports.simulatePaymentProcess = simulatePaymentProcess
