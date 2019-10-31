const { launchBot } = require('./userBot/userBot')
const { startListen } = require('./payment/paymentListener')

console.log('Launching bot ...')
launchBot()

console.log('Luanching server ...')
startListen()
