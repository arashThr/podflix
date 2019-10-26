const Telegraf = require('telegraf')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const { enter, leave } = Stage

const loginScene = require('./loginScene')
const dashboardScene = require('./dashboard')

const bot = new Telegraf(process.env.ADMIN_BOT_TOKEN)
const stage = new Stage([loginScene, dashboardScene])
bot.use(session())
bot.start((ctx) => {
    ctx.reply('Welcome start')
})
bot.use(stage.middleware())
bot.command('login', enter('login'))
bot.command('dash', enter('dashboard'))
bot.on('message', (ctx) => ctx.reply('Try /echo or /greeter'))
bot.launch()
console.log('Admin bot started')
