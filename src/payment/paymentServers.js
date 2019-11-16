const path = require('path')
const express = require('express')
const configs = require('../configs')
const logger = require('../logger')
const app = express()
const { stripeRouter } = require('./stripeRoute')
const { paypingRouter } = require('./paypingRoute')

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, './views'))

app.use(configs.payping.route, paypingRouter)
app.use(configs.stripe.route, stripeRouter)

const port = configs.listenerPort

exports.startListen = function startListen() {
    app.listen(port, () => logger.info(`Payment server start on port ${port}!`))
}
