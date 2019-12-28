const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const logger = require('../logger')
const FileModel = require('../models/fileModel')
const { PayedUserModel } = require('../models/userModel')
const { redisClient } = require('../db')
const Commons = require('../common')

const dashboardScene = new Scene('dashboard')
const dashboardState = {
    SENDING_FILE: 'sending',
    MAIN_MENU: 'menu',
    TEASER: Commons.teaserKey,
    EP0: Commons.ep0Key
}

const menuItems = 'Select:'

const menuKeyboard = Markup.inlineKeyboard([
    [
        Markup.callbackButton('Show Files', 'show-files'),
        Markup.callbackButton('Add File', 'add-file')
    ],
    [
        Markup.callbackButton('Add Teaser', Commons.teaserKey),
        Markup.callbackButton('Add Ep0', Commons.ep0Key)
    ],
    [Markup.callbackButton('Exit', 'exit-dashboard')]
]).extra()

function goHomeButton(keys = []) {
    return Markup.inlineKeyboard(
        keys.concat([Markup.callbackButton('Back', 'dashboard-main')])
    ).extra()
}

dashboardScene.enter(ctx => {
    ctx.session.dashboardState = dashboardState.MAIN_MENU
    ctx.reply(menuItems, menuKeyboard)
})

dashboardScene.action(Commons.teaserKey, async ctx => {
    await ctx.answerCbQuery()
    ctx.session.dashboardState = dashboardState.TEASER
    ctx.editMessageText('Send teaser', goHomeButton())
})

dashboardScene.action(Commons.ep0Key, async ctx => {
    await ctx.answerCbQuery()
    ctx.session.dashboardState = dashboardState.EP0
    ctx.editMessageText('Send ep0', goHomeButton())
})

dashboardScene.action('exit-dashboard', ctx => {
    ctx.editMessageText('Good bye admin. Press /start or /login')
    ctx.scene.leave()
})

dashboardScene.action('show-files', async ctx => {
    await ctx.answerCbQuery()
    const files = await FileModel.find()
    if (files.length === 0) {
        return ctx.editMessageText('No episode uploaded', goHomeButton())
    }

    let episodes = ''
    for (const file of files) {
        episodes += `/${file.epKey} : ${file.fileName}\n`
    }

    ctx.editMessageText(episodes, goHomeButton())
})

dashboardScene.hears(Commons.epNameRegex, async ctx => {
    const epKey = ctx.match[1]
    ctx.session.epKey = epKey

    const fileInfo = await FileModel.findOne({ epKey })
    ctx.reply(
        `🗃
name: ${fileInfo.fileName}
caption: ${fileInfo.caption}`,
        goHomeButton([Markup.callbackButton('Remove', 'remove-file')])
    )
})

dashboardScene.action('remove-file', async ctx => {
    await ctx.answerCbQuery()
    const op = await FileModel.deleteOne({
        epKey: ctx.session.epKey
    })
    if (op.ok) {
        ctx.editMessageText(
            'File removed from collection',
            goHomeButton([Markup.callbackButton('Show files', 'show-files')])
        )
    } else ctx.editMessageText('Removal failed', goHomeButton())
})

dashboardScene.action('add-file', async ctx => {
    await ctx.answerCbQuery()
    ctx.session.dashboardState = dashboardState.SENDING_FILE
    ctx.editMessageText('Forward or Send file; Otherwise press back', goHomeButton())
})

dashboardScene.action('dashboard-main', async ctx => {
    await ctx.answerCbQuery()
    ctx.editMessageText(menuItems, menuKeyboard)
    ctx.session.dashboardState = dashboardState.MAIN_MENU
})

dashboardScene.on('message', async ctx => {
    const state = ctx.session.dashboardState
    if (state === dashboardState.MAIN_MENU) return
    const doc = ctx.message.audio || ctx.message.video
    if (!doc) {
        logger.warn('File is not Audio nor Video!')
        return ctx.reply(
            'This is not a file. Try again or hit back',
            goHomeButton()
        )
    }
    if (state === dashboardState.TEASER || state === dashboardState.EP0) {
        redisClient.set(state, doc.file_id, err => {
            if (err) logger.error('Error in setting teaser file', { err })
            ctx.reply(err ? 'Failed' : 'ok', goHomeButton())
        })
        return
    }

    // Todo: check doc.mime_type
    const epKey =
        'ep_' +
        Math.random()
            .toString(36)
            .substring(2, 2 + Commons.EP_NAME_LENGTH)

    const caption = ctx.message.caption || 'No caption'
    const fileName = doc.title || caption.substr(0, 20) + (caption.length > 20 ? '...' : '')
    const fileInfo = {
        epKey,
        fileName,
        caption,
        fileId: doc.file_id,
        size: doc.file_size
    }
    const op = await FileModel.create(fileInfo)
    if (!op.errors) {
        logger.info('File added')
        try {
            broadcastNewFile(ctx, fileInfo)
        } catch (err) {
            logger.error('Broadcasting file failed', { err })
            return
        }
        ctx.reply('Send another or hit back', goHomeButton())
    } else {
        ctx.reply('Adding new file failed', goHomeButton())
        logger.error('Adding file failed - DB error', { fileInfo, errors: op.errors })
    }
})

// There is limitation on how many users a bot can reach per second
// BoardcastNewFile function takes care of this limitation
// More info: https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this
async function broadcastNewFile(ctx, fileInfo) {
    // Todo: Projection is not working
    const usersChatIds = await PayedUserModel.find({}, { chatId: 1 })

    function sendFile(chatIds, i = 0) {
        setTimeout(async () => {
            if (i >= chatIds.length) {
                return
            }
            const chatId = chatIds[i]
            logger.debug('Broadcasting file to ' + chatId)
            await ctx.telegram.sendDocument(chatId,
                fileInfo.fileId,
                {
                    caption: __('user-menu.new-ep') + '\n' + fileInfo.caption,
                    reply_markup: Markup.inlineKeyboard([
                        Markup.callbackButton(__('user-menu.go-home-btn'), 'user-menu')
                    ])
                }
            )
            sendFile(chatIds, i + 1)
        }, 100) // Send message to ten users in each second
    }

    sendFile(usersChatIds.map(u => u.chatId)
        .filter(c => c !== ctx.from.id))
}

module.exports = dashboardScene
