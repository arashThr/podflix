const fetch = require('node-fetch')
const logger = require('../logger')
const configs = require('../configs')

async function getPaymentCode(payload) {
    const paymentBody = JSON.stringify(payload)

    const paymentUrl = configs.payping.server + '/v1/pay'
    logger.debug('Sending request to get to code ...' + paymentUrl)
    const resp = await fetch(paymentUrl, {
        method: 'POST',
        body: paymentBody,
        headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + configs.payping.token
        }
    })
    if (resp.status !== 200) {
        logger.error('Getting payment code failed: ', resp.statusText)
        return null
    }
    const jsonResp = await resp.json()
    logger.debug('Payment code reponse is: ', jsonResp)
    return jsonResp.code
}

async function getPaymentLink(payload) {
    payload.returnUrl = `${configs.serverUrl}${configs.payping.route}${configs.payping.returnPath}`
    payload.description = 'Podflix payment'
    const code = await getPaymentCode(payload)
    if (code) return `${configs.payping.server}/v1/pay/gotoipg/${code}`
    return null
}

async function verifyPayment(price, refId) {
    const verifyBody = JSON.stringify({
        amount: price,
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

    if (resp.status === 200) {
        logger.debug('Payment verifed')
    } else if (resp.status === 400) {
        logger.debug('Payment canceled')
    } else {
        logger.error('Verification failed', verifyBody)
    }
    return resp.status === 200
}

module.exports = {
    getPaymentLink,
    verifyPayment
}
