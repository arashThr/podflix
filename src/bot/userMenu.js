const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')

const FileModel = require('../models/fileModel')
const Commons = require('../common')
const logger = require('../logger')

const userMenuScene = new Scene('user-menu-scene')

const mainMenuButtons = Markup.keyboard([
    [__('user-menu.eps-list-btn'), __('user-menu.last-ep-btn')],
    [__('start.about-btn'), __('user-menu.badge-btn')]
])
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
        .reduce((prev, cur) => prev + `/${cur.epKey}: ${cur.fileName}\n\n`, '')
        .trim()
    ctx.reply(
        __('user-menu.episodes-list', list), {
            parse_mode: 'HTML'
        }
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

userMenuScene.hears(__('user-menu.badge-btn'), ctx => {
    ctx.reply(
        __('user-menu.badges'),
        Markup.inlineKeyboard([
            [
                Markup.callbackButton(__('user-menu.badge.insta-post'), 'insta-post'),
                Markup.callbackButton(__('user-menu.badge.insta-story'), 'insta-story')
            ],
            [
                Markup.callbackButton(__('user-menu.badge.twitter'), 'twitter')
            ]
        ]).extra({ parse_mode: 'Markdown' })
    )
})

userMenuScene.action('twitter', ctx => {
    ctx.answerCbQuery()
    ctx.replyWithPhoto('https://telegra.ph/file/a233ca5e094d3922175e2.jpg')
})

userMenuScene.action('insta-post', ctx => {
    ctx.answerCbQuery()
    ctx.replyWithPhoto('https://telegra.ph/file/2956cf191282c5adb15eb.jpg')
})

userMenuScene.action('insta-story', ctx => {
    ctx.answerCbQuery()
    ctx.replyWithPhoto('https://telegra.ph/file/28cecf1cec69ed910d34b.jpg')
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
    // I saw no difference between replyWithDocument and replyWithAudio
    // But I rather to stick to more restrcited version
    // Also since we're forwarding files from Telegram servers
    // 50 MB limitation on files does not affecting us
    // (Bot API has its own limit on uploading files)
    ctx.replyWithAudio(fileInfo.fileId, {
        caption: fileInfo.caption,
        parse_mode: 'Markdown'
    })
}

module.exports = userMenuScene
