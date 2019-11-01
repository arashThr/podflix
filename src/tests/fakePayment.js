require('dotenv').config()
const fetch = require('node-fetch')
const querystring = require('querystring')
const { getPaymentLink } = require('../payment/payping')
const configs = require('../configs')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

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

    const url = configs.payping.returnUrl + '/?' + qs
    console.log('URL: ', url)
    const resp = await fetch(url, {
        method: 'GET'
    })
    console.log('First sever result: ', resp.status)
}

simulatePaymentProcess()
