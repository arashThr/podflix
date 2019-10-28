const { launchBot } = require('./userBot/userBot')
const { startListen } = require('./userBot/paymentListener')

console.log('Launching bot ...')
launchBot()

console.log('Luanching server ...')
startListen()
