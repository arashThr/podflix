const dotenv = require('dotenv')
const i18n = require('i18n')
const path = require('path')
const result = dotenv.config()

if (result.error) {
    console.error('No .env file found. Terminating the program')
    throw result.error
}

const configs = {
    botLang: process.env.BOT_LANG || 'en',
    fakePayment: process.env.FAKE_PAYMENT || false,
    httpPort: 8000, // Port for internal HTTP server
    botPort: 3000,
    serverUrl: process.env.SERVER_URL,
    botUrl: process.env.BOT_URL,
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
    sentryDSN: process.env.SENTRY_DSN,

    app: {
        toomanPrice: process.env.TOOMAN_PRICE || 29000,
        dollarPrice: process.env.DOLLAR_PRICE || 599
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

i18n.configure({
    locales: ['translations', 'translations_fa'],
    directory: path.join(__dirname, 'locales'),
    objectNotation: true,
    register: global
})

i18n.setLocale(configs.botLang === 'en' ? 'translations' : 'translations_fa')

module.exports = configs
