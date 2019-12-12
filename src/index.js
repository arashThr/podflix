const path = require('path')
const crypto = require('crypto')

const express = require('express')
const Telegraf = require('telegraf')

const configs = require('./configs')
const { initBot } = require('./bot/botStarter')
const { initDb } = require('./db')

const { stripeRouter } = require('./payment/stripeRoute')
const { paypingRouter } = require('./payment/paypingRoute')

async function start() {
    const connected = await initDb()
    if (!connected) {
        console.error('DB connection failed')
        process.exit(1)
    }

    const app = express()
    initPaymentServer(app)

    const bot = new Telegraf(configs.botToken, {
        telegram: { webhookReply: false }
    })
    initBot(bot)

    const secretPath = '/podflixbot/' + crypto.randomBytes(32).toString('hex')
    app.use(bot.webhookCallback(secretPath))
    bot.telegram.setWebhook(`${configs.serverUrl}:${configs.serverPort}${secretPath}`)

    console.log('Launching server ...')
    const port = configs.httpPort
    app.listen(port, () => console.log(`Payment server start on port ${port}!`))
}

function initPaymentServer(app) {
    app.set('view engine', 'ejs')
    app.set('views', path.join(__dirname, './payment/views'))

    app.use(configs.payping.route, paypingRouter)
    app.use(configs.stripe.route, stripeRouter)
}

start()
