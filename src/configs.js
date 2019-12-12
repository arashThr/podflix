const dotenv = require('dotenv')
const result = dotenv.config()

if (result.error) {
    console.error('No .env file found. Terminating the program')
    throw result.error
}

const configs = {
    botLang: process.env.BOT_LANG || 'en',
    httpPort: 3000, // Port for internal HTTP server
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

    app: {
        toomanPrice: process.env.APP_PRICE || 100,
        dollarPrice: 500
    }
}

configs.serverPort = configs.isInDev ? 443 : 8443 // ngrok vs production

configs.payping = {
    server: process.env.PAYPING_SERVER || 'https://api.payping.ir',
    returnPath: '/payping-done',
    route: '/payping',
    token: process.env.PAYPING_TOKEN
}

configs.stripe = {
    secret: process.env.STRIPE_SECRET,
    public: process.env.STRIPE_PUBLIC,
    route: '/stripe'
}

module.exports = configs
