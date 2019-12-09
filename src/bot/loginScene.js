const Scene = require('telegraf/scenes/base')
const logger = require('../logger')
const configs = require('../configs')

const defaultAdmin = configs.admin.chatId
const adminsId = defaultAdmin ? [String(defaultAdmin)] : []
const bannedUsers = []

const loginScene = new Scene('login')
loginScene.enter(ctx => {
    if (adminsId.includes(ctx.from.id)) {
        ctx.scene.enter('dashboard')
        return
    }
    if (
        (adminsId.length !== 0 && configs.admin.disableLoginWithPass) ||
        bannedUsers.includes(ctx.from.id)
    ) {
        ctx.scene.leave()
        return
    }
    logger.info('Admin loggin in')
    ctx.session.loginAttempt = 0
    ctx.reply('Welcome. Enter pass')
})

loginScene.leave(async ctx => {
    if (adminsId.includes(ctx.from.id)) {
        await ctx.reply('Going to dashboard')
    } else ctx.reply('Go away')
})

loginScene.command('back', ctx => {
    ctx.scene.leave()
})

loginScene.on('text', ctx => {
    ctx.session.loginAttempt += 1
    logger.warn(
        `User (${ctx.from.id}) attempted to login ${ctx.session.loginAttempt} times`
    )

    if (ctx.message.text === configs.admin.pass) {
        ctx.deleteMessage()
        ctx.session.loginAttempt = 0
        adminsId.push(ctx.from.id)
        ctx.scene.enter('dashboard')
    } else ctx.reply('Wrong')

    if (ctx.session.loginAttempt >= 3) {
        ctx.reply('You are a fraud!')
        bannedUsers.push(ctx.from.id)
        ctx.scene.leave()
    }
})

loginScene.on('message', ctx => ctx.reply('Only text messages please'))

module.exports = loginScene
