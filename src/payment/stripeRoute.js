const configs = require('../configs')
const path = require('path')
const stripe = require('stripe')(configs.stripe.secret)
const express = require('express')

const router = express.Router()

const webhookPath = '/paysuccess'

router.use(express.static(path.join(__dirname, './static')))

router.get('/', async (req, res) => {
    const sessionId = await getStripeSessionId()
    res.render('stripe-checkout', {
        sessionId,
        stripePublic: configs.stripe.public
    })
})

// Fetch the Checkout Session to display the JSON result on the success page
router.get('/checkout-session', async (req, res) => {
    const { sessionId } = req.query
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    res.send(session)
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
        success_url: `${configs.serverUrl}${configs.stripe.route}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${configs.serverUrl}${configs.stripe.route}/canceled.html`
    })

    return session.id
}

exports.stripeRouter = router
