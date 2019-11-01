require('dotenv').config()
const fetch = require('node-fetch')
const querystring = require('querystring')
const { getPaymentLink } = require('../payment/payping')
const Payments = require('../payment/payment')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function simulatePaymentProcess() {
    const p = new Promise((resolve, reject) => {
        Payments.addPay(100, { resolve, reject })
    })
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

    const result = await p
    console.log('Result is: ', result)
}

simulatePaymentProcess()
