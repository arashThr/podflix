const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')

const FileModel = require('../models/fileModel')
const Commons = require('../common')

const userMenuScene = new Scene('user-menu-scene')

const mainMenuButtons = Markup.keyboard([
    [__('user-menu.eps-list-btn')],
    [__('user-menu.last-ep-btn'), __('user-menu.badge-btn')],
    [__('start.about-btn'), __('start.creators-btn')]
])
    .oneTime()
    .resize()
    .extra()

userMenuScene.enter(ctx => {
    ctx.reply(__('user-menu.welcome'), mainMenuButtons)
})

userMenuScene.action('user-menu', async ctx => {
    await ctx.answerCbQuery()
    ctx.reply(__('user-menu.home'), mainMenuButtons)
})

userMenuScene.hears(__('user-menu.eps-list-btn'), async ctx => {
    const episodes = await FileModel.find()
    const list = episodes
        .reduce((prev, cur) => prev + `/${cur.epKey}: ${cur.caption}\n\n`, '')
        .trim()
    ctx.reply(__('user-menu.episodes-list', list),
        Markup.inlineKeyboard([
            Markup.callbackButton(__('user-menu.go-home-btn'), 'user-menu')
        ]).extra()
    )
})

userMenuScene.command('exit', async ctx => {
    ctx.reply(__('user-menu.exit'))
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
                    Markup.callbackButton(__('user-menu.go-home-btn'), 'user-menu')
                ])
            }
        )
    } catch (e) {
        ctx.reply(__('user-menu.ep-fetch-error'))
        console.error(e)
    }
})

module.exports = userMenuScene
