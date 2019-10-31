const fetch = require('node-fetch')

async function getPaymentCode(amount) {
    const paymentBody = JSON.stringify({
        amount,
        returnUrl: process.env.PAYMENT_RETURN_ADDRESS,
        payerIdentity: 'PId',
        payerName: 'PName',
        description: 'Desc',
        clientRefId: 'CRFID'
    })

    console.log('Sending request to get to code ...')
    const paymentUrl = process.env.PAYPING_SERVER + '/v1/pay'
    const resp = await fetch(paymentUrl, { method: 'POST', body: paymentBody })
    const jsonResp = await resp.json()
    return jsonResp.code
}

async function getPaymentLink(amount) {
    const code = await getPaymentCode(amount)
    return `${process.env.PAYPING_SERVER}/v1/pay/gotoipg/${code}`
}

async function verifyPayment(amount, refId) {
    const verifyBody = JSON.stringify({
        amount,
        refId: refId
    })
    const resp = await fetch(process.env.PAYPING_SERVER + '/v1/pay/verify',
        { method: 'POST', body: verifyBody }
    )

    if (resp.status === 200) {
        console.log('Payment verifed')
        return true
    } else {
        console.error('Verification failed')
        return false
    }
}

module.exports = { getPaymentLink, verifyPayment }
