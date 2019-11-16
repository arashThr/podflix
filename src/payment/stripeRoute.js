const path = require('path')
const configs = require('../configs')
const stripe = require('stripe')(configs.stripe.secret)
const express = require('express')
const app = express()

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, './views'))

const webhookPath = '/paysuccess'

app.use(express.static(path.join(__dirname, './static')))

app.get('/', async (req, res) => {
    const sessionId = await getStripeSessionId()
    res.render('stripe-checkout', {
        sessionId,
        stripePublic: configs.stripe.public
    })
})

// Fetch the Checkout Session to display the JSON result on the success page
app.get('/checkout-session', async (req, res) => {
    const { sessionId } = req.query
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    res.send(session)
})

// Webhook handler for asynchronous events.
app.post(webhookPath, async (req, res) => {
    const data = req.body.data
    const eventType = req.body.type

    if (eventType === 'checkout.session.completed') {
        console.log('🔔  Payment received!', data)
    }

    res.sendStatus(200)
})

app.listen(3000, () => console.log(`Node server listening on port ${3000}!`))

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
        success_url: `${configs.serverUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${configs.serverUrl}/canceled.html`
    })

    return session.id
}
