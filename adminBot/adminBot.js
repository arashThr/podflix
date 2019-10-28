const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const { enter } = Stage
const logger = require('../logger')

const loginScene = require('./loginScene')
const dashboardScene = require('./dashboard')

const bot = new Telegraf(process.env.ADMIN_BOT_TOKEN)
const stage = new Stage([loginScene, dashboardScene])
bot.use(session())
bot.start((ctx) => {
    ctx.reply('Welcome. try /login')
})
bot.use(stage.middleware())
bot.command('login', enter('login'))
bot.command('dash', enter('dashboard'))
bot.on('message', (ctx) => ctx.reply('Try /login'))
bot.launch()
logger.info('Admin bot started')
