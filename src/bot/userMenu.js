const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')

const FileModel = require('../models/fileModel')
const Commons = require('../common')

const userMenuScene = new Scene('user-menu-scene')

const mainMenuButtons = Markup.inlineKeyboard([
    Markup.callbackButton(__('user-menu.show-episodes-btn'), 'all-episodes'),
    Markup.callbackButton(__('user-menu.exit-btn'), 'exit-user-bot')
]).extra()

const enterMenu = ctx => ctx.reply(__('user-menu.main-select'), mainMenuButtons)
userMenuScene.enter(enterMenu)
userMenuScene.action('user-menu-reply', enterMenu)
userMenuScene.action('user-menu', async ctx => {
    await ctx.answerCbQuery()
    ctx.editMessageText('Select', mainMenuButtons)
})

userMenuScene.action('all-episodes', async ctx => {
    await ctx.answerCbQuery()
    const episodes = await FileModel.find()
    const list = episodes
        .reduce((prev, cur) => prev + `/${cur.epKey}: ${cur.name}\n\n`, '')
        .trim()
    ctx.editMessageText(
        __('user-menu.episodes-list', list),
        Markup.inlineKeyboard([
            Markup.callbackButton(__('user-menu.go-home-btn'), 'user-menu')
        ]).extra()
    )
})

userMenuScene.action('exit-user-bot', async ctx => {
    await ctx.answerCbQuery()
    ctx.editMessageText(__('user-menu.user-exit'))
    ctx.scene.leave()
})

userMenuScene.hears(Commons.epNameRegex, async ctx => {
    const epKey = ctx.match[1]
    ctx.session.epKey = epKey

    const fileInfo = await FileModel.findOne({ epKey })
    try {
        ctx.replyWithDocument(
            fileInfo.fileId,
            {
                caption: fileInfo.caption,
                reply_markup: Markup.inlineKeyboard([
                    Markup.callbackButton(__('user-menu.go-home-btn'), 'user-menu-reply')
                ])
            }
        )
    } catch (e) {
        ctx.reply(__('user-menu.ep-fetch-error'))
        console.error(e)
    }
})

module.exports = userMenuScene
