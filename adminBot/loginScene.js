const Scene = require('telegraf/scenes/base')

let adminsId = ['37037901']

const loginScene = new Scene('login')
loginScene.enter((ctx) => {
    ctx.session.loginAttempt = 1
    ctx.reply('Welcome. Enter pass')
})
loginScene.leave((ctx) => {
    if (adminsId.includes(ctx.from.id)) {
        ctx.reply('Going to dashboard')
        // enter('dashboard')
    }
    else
        ctx.reply('Go away')
})
loginScene.command('back', (ctx) => {
    ctx.scene.leave()
})
loginScene.on('text', (ctx) => {
    ctx.session.loginAttempt += 1
    console.log('Attempts: ', ctx.session.loginAttempt);
    
    if (ctx.message.text === '123') {
        ctx.reply('Correct')
        ctx.session.loginAttempt = 0
        adminsId.push(ctx.from.id)
        ctx.scene.leave()
    }
    else
        ctx.reply('Wrong')
    
    if (ctx.session.loginAttempt > 2) {
        ctx.reply('You are a fraud!')
        ctx.scene.leave()
    }
})
loginScene.on('message', (ctx) => ctx.reply('Only text messages please'))

module.exports = loginScene
