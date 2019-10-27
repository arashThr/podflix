const { launchBot } = require('./clientBot/clientBot')
const { startListen } = require('./clientBot/paymentListener')

console.log('Launching bot ...')
launchBot()

console.log('Luanching server ...')
startListen()
