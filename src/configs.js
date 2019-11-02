const dotenv = require('dotenv')
dotenv.config()

module.exports = {
    listenerPort: 3000,
    NODE_ENV: process.env.NODE_ENV,
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

    payping: {
        server: process.env.PAYPING_SERVER || 'https://api.payping.ir',
        returnUrl: process.env.PAYMENT_RETURN_ADDRESS,
        token: process.env.PAYPING_TOKEN
    },

    app: {
        price: process.env.APP_PRICE || 100
    }
}
