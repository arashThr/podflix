const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')

const { filesCollection } = require('../db')
const Commons = require('../common')

const userMenuScene = new Scene('user-menu-scene')

const mainMenuButtons = Markup.inlineKeyboard([
    Markup.callbackButton('Show All', 'all-episodes'),
    Markup.callbackButton('Get next', 'next-episode'),
    Markup.callbackButton('Exit', 'exit-user-bot')
]).extra()

const enterMenu = ctx => ctx.reply('Select', mainMenuButtons)
userMenuScene.enter(enterMenu)
userMenuScene.action('user-menu-reply', enterMenu)
userMenuScene.action('user-menu', ctx =>
    ctx.editMessageText('Select', mainMenuButtons)
)

userMenuScene.action('all-episodes', async ctx => {
    const episodes = await filesCollection()
        .find()
        .toArray()
    const text = episodes
        .reduce((prev, cur) => prev + `/${cur.epKey}: ${cur.name}\n\n`, '')
        .trim()
    ctx.editMessageText(
        'Here are the episodes\n' + text,
        Markup.inlineKeyboard([
            Markup.callbackButton('Get home', 'user-menu')
        ]).extra()
    )
})

userMenuScene.action('exit-user-bot', ctx => {
    ctx.editMessageText('Goddbyt. Press /start to start again')
    ctx.scene.leave()
})

userMenuScene.hears(Commons.epNameRegex, async ctx => {
    const epKey = ctx.match[1]
    ctx.session.epKey = epKey

    const fileInfo = await filesCollection().findOne({ epKey })
    try {
        ctx.replyWithDocument(
            fileInfo.fileId,
            Markup.inlineKeyboard([
                Markup.callbackButton('Get home', 'user-menu-reply')
            ]).extra()
        )
    } catch (e) {
        ctx.reply('Error occured')
        console.error(e)
    }
})

module.exports = userMenuScene
