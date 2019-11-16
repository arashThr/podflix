const configs = require('../configs')
const stripe = require('stripe')(configs.stripe.secret)
const express = require('express')
const app = express()

const webhookPath = '/paysuccess'

app.use(express.static('./static'))

app.get('/', async (req, res) => {
    const html = await pay()
    res.send(html)
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

async function pay() {
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
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

    return portalPage(session.id, 'clientRefId1')
}

function portalPage(sessionId, clientRefId) {
    return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <title>Go to Pay</title>
        <meta charset="utf-8" />
        <script src="https://js.stripe.com/v3/"></script>

        <script>
            alert('We are here')
            var stripe = Stripe('${configs.stripe.public}');
            var handleResult = function(result) {
                if (result.error) {
                    var displayError = document.getElementById('error-message')
                    displayError.textContent = result.error.message
                }
            }

            stripe
                .redirectToCheckout({
                    sessionId: '${sessionId}',
                    client_reference_id: '${clientRefId}',
                })
                .then(handleResult)
        </script>
    </head>
    <body>
        <div id="error-message"></div>       
    </body>
</html>
`
}
