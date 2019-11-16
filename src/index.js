const { launchBot } = require('./userBot/userBot')
const { startListen } = require('./payment/paymentServers')
const { initDb } = require('./db')

async function start() {
    const connected = await initDb()
    if (!connected) {
        console.error('DB connection failed')
        process.exit(1)
    }

    console.log('Launching bot ...')
    launchBot()

    console.log('Luanching server ...')
    startListen()
}

start()
