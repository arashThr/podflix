const configs = require('../configs')
const logger = require('../logger')
const stripe = require('stripe')(configs.stripe.secret)
const express = require('express')

const router = express.Router()

const webhookPath = '/paysuccess'

router.get('/', async (req, res) => {
    const sessionId = await getStripeSessionId()
    res.render('stripe-checkout', {
        sessionId,
        stripePublic: configs.stripe.public
    })
})

router.get('/success', async (req, res) => {
    const sessionId = req.query.session_id
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        var sessionJSON = JSON.stringify(session, null, 2)
        res.render('stripe-success', {
            session: sessionJSON
        })
    } catch (err) {
        logger.error('Error when fetching Checkout session', err)
        res.send('Error occured when trying to fetch payment details')
    }
})

router.get('/canceled', (req, res) => {
    res.render('stripe-canceled')
})

// Webhook handler for asynchronous events.
router.post(webhookPath, async (req, res) => {
    const data = req.body.data
    const eventType = req.body.type

    if (eventType === 'checkout.session.completed') {
        console.log('🔔  Payment received!', data)
    }

    res.sendStatus(200)
})

async function getStripeSessionId() {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        client_reference_id: 'lalala123',
        line_items: [
            {
                name: 'T-shirt',
                description: 'Comfortable cotton t-shirt',
                images: ['https://example.com/t-shirt.png'],
                amount: 500,
                currency: 'usd',
                quantity: 1
            }
        ],
        success_url: `${configs.serverUrl}${configs.stripe.route}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${configs.serverUrl}${configs.stripe.route}/canceled.html`
    })

    return session.id
}

exports.stripeRouter = router
