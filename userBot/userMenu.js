const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')

const { db, FILES_COLLECTION } = require('../db/adminDb')
const Commons = require('../common')

const userMenuScene = new Scene('user-menu-scene')

const startState = ctx => {
    ctx.reply('Select', Markup.inlineKeyboard([
        Markup.callbackButton('Show All', 'all-episodes'),
        Markup.callbackButton('Get next', 'next-episode')
    ]).extra())
}
userMenuScene.enter(startState)
userMenuScene.action('user-menu', startState)

userMenuScene.action('all-episodes', ctx => {
    const episodes = db.get(FILES_COLLECTION)
        .reverse()
        .value()
    const text = episodes.reduce((prev, cur) => prev + `/${cur.epKey}: ${cur.name}\n\n`, '').trim()
    ctx.editMessageText('Here are the episodes\n' + text)
})

userMenuScene.hears(Commons.epNameRegex, ctx => {
    const epKey = ctx.match[1]
    ctx.session.epKey = epKey

    const fileInfo = db
        .get(FILES_COLLECTION)
        .find({ epKey })
        .value()
    try {
        ctx.replyWithDocument(fileInfo.fileId)
    } catch (e) {
        ctx.reply('Error occured')
        console.error(e)
    }
})

module.exports = userMenuScene
