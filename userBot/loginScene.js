const Scene = require('telegraf/scenes/base')
const logger = require('../logger')

const defaultAdmin = process.env.DEFAULT_CHAT_ID
const adminsId = defaultAdmin ? [String(defaultAdmin)] : []

const loginScene = new Scene('login')
loginScene.enter(ctx => {
    logger.info('User loggin in')
    ctx.session.loginAttempt = 1
    ctx.reply('Welcome. Enter pass')
})

loginScene.leave(ctx => {
    if (adminsId.includes(ctx.from.id)) {
        ctx.reply('Going to dashboard')
    } else ctx.reply('Go away')
})

loginScene.command('back', ctx => {
    ctx.scene.leave()
})

loginScene.on('text', ctx => {
    ctx.session.loginAttempt += 1
    console.log('Attempts: ', ctx.session.loginAttempt)

    if (ctx.message.text === '123') {
        ctx.reply('Correct')
        ctx.session.loginAttempt = 0
        adminsId.push(ctx.from.id)
        ctx.scene.enter('dashboard')
    } else ctx.reply('Wrong')

    if (ctx.session.loginAttempt > 2) {
        ctx.reply('You are a fraud!')
        ctx.scene.leave()
    }
})

loginScene.on('message', ctx => ctx.reply('Only text messages please'))

module.exports = loginScene
