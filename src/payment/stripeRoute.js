const configs = require('../configs')
const logger = require('../logger')
const stripe = require('stripe')(configs.stripe.secret)
const express = require('express')
const redis = require('redis')
const { paymentReturnPageInfo } = require('../common')

const pub = redis.createClient(configs.redisUrl)

const router = express.Router()

// Webhook path to be set on stripe is ${route}/${webhookPath}
const webhookPath = '/paysuccess'
const payPath = '/pay'
const fakePath = '/fake'
const stripePath = `${configs.serverUrl}${configs.stripe.route}`

router.get(`${payPath}/:sessionId`, async (req, res) => {
    const sessionId = req.params.sessionId
    res.render('stripe-checkout', {
        sessionId,
        stripePublic: configs.stripe.public
    })
})

router.get('/success', async (req, res) => {
    const sessionId = req.query.session_id
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        const sessionJSON = JSON.stringify(session, null, 2)
        res.render('stripe-success', {
            session: sessionJSON,
            ...paymentReturnPageInfo()
        })

        pub.publish(
            'payment-verify',
            JSON.stringify({
                clientRefId: session.client_reference_id,
                successful: true
            })
        )
    } catch (err) {
        logger.error('Error when fetching Checkout session', { err })
        res.send('Error occured when trying to fetch payment details')
    }
})

router.get('/canceled', async (req, res) => {
    const clientRefId = req.query.clientRefId
    pub.publish(
        'payment-verify',
        JSON.stringify({
            clientRefId,
            successful: false
        })
    )

    res.render('stripe-canceled', paymentReturnPageInfo())
})

// Webhook handler for asynchronous events.
router.post(webhookPath, async (req, res) => {
    // Todo: This is where we're sure payment occured
    const data = req.body.data
    const eventType = req.body.type

    if (eventType === 'checkout.session.completed') {
        console.log('🔔  Payment received!', data)
    }

    res.sendStatus(200)
})

if (configs.isInDev && configs.fakePayment) {
    router.get(`${fakePath}/:clientRefId`, async (req, res) => {
        res.send('Fake Success')
        const clientRefId = req.params.clientRefId
        pub.publish(
            'payment-verify',
            JSON.stringify({
                clientRefId,
                successful: true
            })
        )
    })
}

async function getStripeSessionId(amount, clientRefId) {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        client_reference_id: clientRefId,
        line_items: [
            {
                amount,
                name: 'T-shirt',
                description: 'Comfortable cotton t-shirt',
                images: ['https://picsum.photos/200/300'],
                currency: 'usd',
                quantity: 1
            }
        ],
        success_url: `${stripePath}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${stripePath}/canceled?clientRefId=${clientRefId}`
    })
    return session.id
}

async function getStripePaymentLink({ amount, clientRefId }) {
    if (configs.isInDev && configs.fakePayment) {
        return `${stripePath}${fakePath}/${clientRefId}`
    }
    const sessionId = await getStripeSessionId(amount, clientRefId)
    return `${stripePath}${payPath}/${sessionId}`
}

module.exports = {
    getStripePaymentLink,
    stripeRouter: router
}
