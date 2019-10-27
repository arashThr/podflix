const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const logger = require('../logger')

let uploadedFiles = new Map()

const dashboardScene = new Scene('dashboard')
const dashboardState = {
    SENDING_FILE: 'sending',
    MAIN_MENU: 'menu'
}
const EP_NAME_LENGTH = 6

let menuKeyboard = Markup.inlineKeyboard([
    Markup.callbackButton('Show Files', 'show-files'),
    Markup.callbackButton('Add File', 'add-file')]).extra()

function getBackButton(keys = []) {
    return Markup.inlineKeyboard(keys.concat([
        Markup.callbackButton('Back', 'dashboard-main'),
      ])).extra()
}

dashboardScene.enter(ctx => {
    ctx.session.dashboardState = dashboardState.MAIN_MENU
    ctx.reply('Select', menuKeyboard)
})

dashboardScene.action('show-files', ctx => {
    if (uploadedFiles.size === 0)
        return ctx.editMessageText('No episode uploaded', getBackButton())
    
    let episodes = ''
    for (let [id, details] of uploadedFiles) {
        episodes += `/${id} : ${details.name}\n`
    }
    
    ctx.editMessageText(episodes, getBackButton())
})

const epNameRegex = new RegExp(`^\/(ep_[a-z0-9]{${EP_NAME_LENGTH}})$`)
dashboardScene.hears(epNameRegex, ctx => {
    let fileId = ctx.match[1]
    let fileInfo = uploadedFiles.get(fileId)

    ctx.session.fileId = fileId
    ctx.reply(`name: ${fileInfo.name}`, getBackButton([
        Markup.callbackButton('Remove', 'remove-file')
    ]))
})

dashboardScene.action('remove-file', ctx => {
    let success = uploadedFiles.delete(ctx.session.fileId)
    if (success)
        ctx.editMessageText('File removed from collection', getBackButton([
            Markup.callbackButton('Show files', 'show-files')
        ]))
    else
        ctx.editMessageText('Removal failed', getBackButton())
})

dashboardScene.action('add-file', ctx => {
    ctx.session.dashboardState = dashboardState.SENDING_FILE
    ctx.editMessageText('Send file or press back', getBackButton())
})

dashboardScene.action('dashboard-main', ctx => {
    let replyFunc = ctx.session.dashboardState === dashboardState.SENDING_FILE
        ? ctx.editMessageText : ctx.reply
    replyFunc('Select', menuKeyboard)
    ctx.session.dashboardState = dashboardState.MAIN_MENU
})
dashboardScene.on('message', ctx => {
    if (ctx.session.dashboardState !== dashboardState.SENDING_FILE)
        return
    // Todo: Music is audio
    let doc = ctx.message.document
    if (!doc) {
        logger.warn('Not a FILE!!!')
        ctx.reply('This is not a file')
        return ctx.scene.enter()
    }
    // if (doc.mime_type)
    let fileInfo = {
        id: doc.file_id,
        name: doc.file_name,
        size: doc.file_size
    }
    let randomString = Math.random().toString(36).substring(2, 2 + EP_NAME_LENGTH)
    uploadedFiles.set('ep_' + randomString, fileInfo)
    ctx.reply('Send another or hit back', getBackButton())
})

module.exports = dashboardScene
