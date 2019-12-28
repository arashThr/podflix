/* eslint-disable no-unused-vars */
const configs = require('../../configs')
var stripe = require('stripe')(configs.stripe.secret)

function createEndpoint(url) {
    stripe.webhookEndpoints.create(
        {
            url,
            enabled_events: ['checkout.session.completed']
        },
        function(err, webhookEndpoint) {
            if (err) {
                console.error('Error occured', err)
                return
            }
            console.log(webhookEndpoint)
        }
    )
}

function listEndpoints() {
    stripe.webhookEndpoints.list({ limit: 3 }, function(err, webhookEndpoints) {
        if (err) {
            console.error('Error: ', err)
            return
        }
        console.log(webhookEndpoints)
        for (const e in webhookEndpoints) console.log(e)
    })
}

function deleteEndpoint(endpointId) {
    stripe.webhookEndpoints.del(endpointId, function(err, confirmation) {
        if (err)
            return console.error(err)
        console.log('Del result: ', confirmation)
    })
}

// createEndpoint(`${configs.serverUrl}${configs.stripe.route}/paysuccess`)
// listEndpoints()
// deleteEndpoint('we_...')
