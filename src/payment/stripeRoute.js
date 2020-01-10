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

router.use(
    express.json({
        // We need the raw body to verify webhook signatures.
        // Let's compute it only when hitting the Stripe webhook endpoint.
        // More info on https://stripe.com/docs/payments/checkout/one-time
        verify: function(req, res, buf) {
            if (req.originalUrl.startsWith(`${configs.stripe.route}${webhookPath}`)) {
                req.rawBody = buf.toString()
            }
        }
    })
)

router.get(`${payPath}/:sessionId`, async (req, res) => {
    const sessionId = req.params.sessionId
    res.render('stripe-checkout', {
        sessionId,
        stripePublic: configs.stripe.public
    })
})

router.get('/success', async (req, res) => {
    const sessionId = req.query.session_id
    logger.debug('Success called. Session id is: ' + sessionId, { url: req.url })
    try {
        const info = paymentReturnPageInfo()
        res.render('stripe-success', info)
    } catch (err) {
        logger.error('Rendering success page failed', { sessionId, err })
        res.send('Error occured when trying to fetch payment details')
    }
})

router.get('/canceled', async (req, res) => {
    const clientRefId = req.query.clientRefId
    logger.verbose('Cancel page called', { clientRefId, url: req.url })
    pub.publish(
        'payment-verify',
        JSON.stringify({
            clientRefId,
            successful: false
        })
    )

    res.render('stripe-canceled', paymentReturnPageInfo())
})

router.post(webhookPath, async (req, res) => {
    let data
    let eventType

    if (configs.stripe.webhookSecret) {
        let event
        const signature = req.headers['stripe-signature']
        try {
            event = stripe.webhooks.constructEvent(
                req.rawBody,
                signature,
                configs.stripe.webhookSecret
            )
            data = event.data
            eventType = event.type
        } catch (err) {
            logger.error('Webhook signature verification failed.', { data, url: req.url })
            return res.sendStatus(400)
        }
    } else {
        data = req.body.data
        eventType = req.body.type
    }

    if (eventType === 'checkout.session.completed') {
        const session = data.object
        logger.info('🔔 Payment received for ' + session.client_reference_id)
        logger.verbose('Payment info:', { data })
        pub.publish(
            'payment-verify',
            JSON.stringify({
                clientRefId: session.client_reference_id,
                successful: true,
                extra: session
            })
        )
    }

    res.sendStatus(200)
})

// Fake payment
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
                name: __('stripe-page.name'),
                description: __('stripe-page.desc'),
                images: [configs.app.coverImage],
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
