const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')

const FileModel = require('../models/fileModel')
const Commons = require('../common')
const logger = require('../logger')

const userMenuScene = new Scene('user-menu-scene')

const mainMenuButtons = Markup.keyboard([
    [__('user-menu.eps-list-btn')],
    [__('user-menu.last-ep-btn'), __('user-menu.badge-btn')],
    [__('start.about-btn'), __('start.creators-btn')]
])
    .oneTime()
    .resize()
    .extra({ parse_mode: 'Markdown' })

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
    ctx.reply(
        __('user-menu.episodes-list', list),
        Markup.inlineKeyboard([
            Markup.callbackButton(__('user-menu.go-home-btn'), 'user-menu')
        ]).extra({ parse_mode: 'HTML' })
    )
})

userMenuScene.hears(__('user-menu.last-ep-btn'), async ctx => {
    try {
        const latest = await FileModel.find()
            .sort({ _id: -1 })
            .limit(1)
        if (latest.length !== 1) {
            ctx.reply('Nothing exists')
            return
        }
        const fileInfo = latest[0]
        sendEpisodeFile(ctx, fileInfo)
    } catch (err) {
        logger.error('Error in user menu, sending last ep file', { err })
        ctx.reply(__('user-menu.ep-fetch-error'))
    }
})

userMenuScene.command('exit', async ctx => {
    ctx.reply(__('user-menu.exit'))
    ctx.scene.leave()
})

userMenuScene.hears(Commons.epNameRegex, async ctx => {
    try {
        const epKey = ctx.match[1]
        ctx.session.epKey = epKey
        const fileInfo = await FileModel.findOne({ epKey })
        sendEpisodeFile(ctx, fileInfo)
    } catch (err) {
        logger.error('Error in user menu, sending ep file', { err })
        ctx.reply(__('user-menu.ep-fetch-error'))
    }
})

function sendEpisodeFile(ctx, fileInfo) {
    ctx.replyWithDocument(fileInfo.fileId, {
        caption: fileInfo.caption,
        reply_markup: Markup.inlineKeyboard([
            Markup.callbackButton(__('user-menu.go-home-btn'), 'user-menu')
        ])
    })
}

module.exports = userMenuScene
