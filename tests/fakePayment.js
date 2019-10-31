require('dotenv').config()
const fetch = require('node-fetch')
const querystring = require('querystring')
const { getPaymentLink } = require('../payment/payping')

const express = require('express')
const app = express()
const port = 3001

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded())

// Parse JSON bodies (as sent by API clients)
app.use(express.json())

app.post('/v1/pay', (req, res) => {
    console.log('New request', req.url)
    console.log('Sendgin to code ...')
    res.send(JSON.stringify({
        code: '8c649a'
    }))
})

app.post('/v1/pay/verify', (req, res) => {
    console.log('Verfication called for amount: ', req.body)
    res.sendStatus(200)
})

async function simulatePaymentProcess() {
    const amount = 100
    const link = await getPaymentLink(amount)
    console.log('Link is: ', link)

    console.log('Wating for user to click on line and pay ...')
    await sleep(1000)
    console.log('Payment is done. Returning to our address')

    const qs = querystring.stringify({
        refid: '1250',
        clientrefid: '4323'
    })

    const url = process.env.PAYMENT_RETURN_ADDRESS + '/?' + qs
    console.log('URL: ', url)
    const resp = await fetch(url, {
        method: 'GET'
    })
    console.log('First sever result: ', resp.status)
}

app.listen(port, () => console.log(`Payment server start on port ${port}!`))
simulatePaymentProcess()
