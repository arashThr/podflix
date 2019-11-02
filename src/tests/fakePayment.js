require('dotenv').config()
const fetch = require('node-fetch')
const querystring = require('querystring')
const { getPaymentLink } = require('../payment/payping')
const configs = require('../configs')
const { initDb, paymentsCollection } = require('../db')

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function simulatePaymentProcess() {
    await initDb()
    const price = 100
    const op = await paymentsCollection().insertOne({
        created: new Date(),
        updated: new Date(),
        status: 'req',
        user: { chatId: configs.adminChatId },
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
        payerIdentity: configs.adminChatId,
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

    const url = configs.payping.returnUrl + '/?' + qs
    console.log('URL: ', url)
    const resp = await fetch(url, {
        method: 'GET'
    })
    console.log('Status of return URL: ', resp.status)
    const delOp = await paymentsCollection().deleteOne({ _id: op.insertedId })
    if (delOp.result.ok) console.log('Fake pay removed')
    else console.error('Fake pay remove failed')
}

simulatePaymentProcess()
