const express = require('express')
const fetch = require('node-fetch')
const Payments = require('./payment')
const url = require('url')

const app = express()
const port = 3000
const paypingReturnPath = new url.URL(process.env.PAYMENT_RETURN_ADDRESS).pathname

function handleRedirect(res, chatId) {
    const targetUrl = `${process.env.PAYMENT_RETURN_URL}/accepted/${chatId}`
    res.redirect(targetUrl)
}

app.get('/irpay/:chatId', (req, res) => {
    const chatId = req.params.chatId

    setTimeout(() => {
        handleRedirect(res, chatId)
    }, 1000)
})

app.get('/tgpay/:chatId', (req, res) => {
    const chatId = req.params.chatId

    setTimeout(() => {
        handleRedirect(res, chatId)
    }, 1000)
})

app.get('/accepted/:chatId', (req, res) => {
    const chatId = req.params.chatId

    if (Math.random() > 0.5) {
        res.send('Successful payment')
        console.log('Payment completed')

        const { resolve } = Payments.getPayment(chatId)
        resolve(chatId)
    } else {
        res.send('Failed payment')
        console.log('Payment failed')

        const { reject } = Payments.getPayment(chatId)
        reject(chatId)
    }
})

// Return URL
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
    const resp = await fetch(`${process.env.PAYPING_SERVER}/v1/pay/verify`,
        { method: 'POST', body: verifyBody, headers: { 'Content-Type': 'application/json' } }
    )
    if (resp.status === 200) {
        console.log('Payment verifed')
    } else {
        console.error('Verification failed')
    }
})

exports.startListen = function startListen() {
    app.listen(port, () => console.log(`Payment server start on port ${port}!`))
}
