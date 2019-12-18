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
        // For more info on webhookReply: false checkout this issue:
        // https://github.com/telegraf/telegraf/issues/320
        telegram: { webhookReply: false }
    })
    initBot(bot)

    // The reason to seperate these two is that in production I want to be able to serve
    // web pages on 443 port. On other ports there might be problems, enforced by VPN
    // I can emulate the same sitation in dev env, because I can only get one URL from ngrok
    if (configs.isInDev) {
        const secretPath = '/podflixbot/' + crypto.randomBytes(32).toString('hex')
        app.use(bot.webhookCallback(secretPath))
        bot.telegram.setWebhook(`${configs.serverUrl}:${configs.serverPort}${secretPath}`)
    } else {
        bot.launch({
            webhook: {
                domain: `${configs.serverUrl}:${configs.serverPort}`,
                port: configs.botPort
            }
        })
    }
    console.log('Launching server ...')
    const port = configs.isInDev ? configs.botPort : configs.httpPort
    app.listen(port, () => console.log(`Payment server start on port ${port}!`))
}

function initPaymentServer(app) {
    app.set('view engine', 'ejs')
    app.set('views', path.join(__dirname, './payment/views'))

    app.use(configs.payping.route, paypingRouter)
    app.use(configs.stripe.route, stripeRouter)
}

start()
