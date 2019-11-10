const dotenv = require('dotenv')
dotenv.config()

const configs = {
    listenerPort: 3000,
    serverUrl: process.env.SERVER_URL,
    isInDev: (process.env.NODE_ENV || 'development') === 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017',
    dbName: process.env.DB_NAME || 'podflix',

    admin: {
        chatId: process.env.ADMIN_CHAT_ID,
        pass: process.env.ADMIN_PASS || 'dw2!3rS%s',
        disableLoginWithPass: false
    },
    botToken: process.env.BOT_TOKEN,
    botPort: process.env.BOT_PORT || 8443,

    app: {
        price: process.env.APP_PRICE || 100
    }
}

configs.payping = {
    server: process.env.PAYPING_SERVER || 'https://api.payping.ir',
    returnUrl: configs.serverUrl + '/payping-done',
    token: process.env.PAYPING_TOKEN
}

module.exports = configs
