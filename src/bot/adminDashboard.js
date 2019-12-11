const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const logger = require('../logger')
const FileModel = require('../models/fileModel')
const { PayedUserModel } = require('../models/userModel')
const Commons = require('../common')

const dashboardScene = new Scene('dashboard')
const dashboardState = {
    SENDING_FILE: 'sending',
    MAIN_MENU: 'menu'
}

const menuKeyboard = Markup.inlineKeyboard([
    Markup.callbackButton('Show Files', 'show-files'),
    Markup.callbackButton('Add File', 'add-file'),
    Markup.callbackButton('Exit', 'exit-dashboard')
]).extra()

function goHomeButton(keys = []) {
    return Markup.inlineKeyboard(
        keys.concat([Markup.callbackButton('Back', 'dashboard-main')])
    ).extra()
}

dashboardScene.enter(ctx => {
    ctx.session.dashboardState = dashboardState.MAIN_MENU
    ctx.reply('Select', menuKeyboard)
})

dashboardScene.action('exit-dashboard', ctx => {
    ctx.editMessageText('Good byy admin. Press /start or /login')
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
        episodes += `/${file.epKey} : ${file.name}\n`
    }

    ctx.editMessageText(episodes, goHomeButton())
})

dashboardScene.hears(Commons.epNameRegex, async ctx => {
    const epKey = ctx.match[1]
    ctx.session.epKey = epKey

    const fileInfo = await FileModel.findOne({ epKey })
    ctx.reply(
        `🗃
name: ${fileInfo.name}
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
    ctx.editMessageText('Select', menuKeyboard)
    ctx.session.dashboardState = dashboardState.MAIN_MENU
})

dashboardScene.on('message', async ctx => {
    if (ctx.session.dashboardState !== dashboardState.SENDING_FILE) return
    // Todo: Music is audio
    const doc = ctx.message.document
    if (!doc) {
        logger.warn('Not a FILE!!!')
        return ctx.reply(
            'This is not a file. Try again or hit back',
            goHomeButton()
        )
    }
    // Todo: check doc.mime_type
    const epKey =
        'ep_' +
        Math.random()
            .toString(36)
            .substring(2, 2 + Commons.EP_NAME_LENGTH)

    const fileInfo = {
        epKey,
        fileId: doc.file_id,
        name: doc.file_name,
        caption: ctx.message.caption || '',
        size: doc.file_size
    }
    const op = await FileModel.create(fileInfo)
    if (!op.errors) {
        logger.info('File added')
        broadcastNewFile(ctx, fileInfo)
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
                    caption: 'New episode released!\n' + fileInfo.caption,
                    reply_markup: Markup.inlineKeyboard([
                        Markup.callbackButton('Get home', 'user-menu-reply')
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
