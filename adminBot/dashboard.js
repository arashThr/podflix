const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')
const logger = require('../logger')
const { db, FILES_COLLECTION } = require('./adminDb')
  
const dashboardScene = new Scene('dashboard')
const dashboardState = {
    SENDING_FILE: 'sending',
    MAIN_MENU: 'menu'
}
const EP_NAME_LENGTH = 6

let menuKeyboard = Markup.inlineKeyboard([
    Markup.callbackButton('Show Files', 'show-files'),
    Markup.callbackButton('Add File', 'add-file')]).extra()

function goHomeButton(keys = []) {
    return Markup.inlineKeyboard(keys.concat([
        Markup.callbackButton('Back', 'dashboard-main'),
      ])).extra()
}

dashboardScene.enter(ctx => {
    ctx.session.dashboardState = dashboardState.MAIN_MENU
    ctx.reply('Select', menuKeyboard)
})

dashboardScene.action('show-files', ctx => {
    let files = db.get(FILES_COLLECTION).value()
    if (files.length === 0)
        return ctx.editMessageText('No episode uploaded', goHomeButton())
    
    let episodes = ''
    for (let file of files) {
        episodes += `/${file.epKey} : ${file.name}\n`
    }
    
    ctx.editMessageText(episodes, goHomeButton())
})

const epNameRegex = new RegExp(`^\/(ep_[a-z0-9]{${EP_NAME_LENGTH}})$`)
dashboardScene.hears(epNameRegex, ctx => {
    let epKey = ctx.match[1]
    ctx.session.epKey = epKey

    let fileInfo = db.get(FILES_COLLECTION).find({ epKey }).value()
    ctx.reply(`name: ${fileInfo.name}`, goHomeButton([
        Markup.callbackButton('Remove', 'remove-file')
    ]))
})

dashboardScene.action('remove-file', ctx => {
    let result = db.get(FILES_COLLECTION).remove({epKey: ctx.session.epKey}).write()
    if (result.length === 1)
        ctx.editMessageText('File removed from collection', goHomeButton([
            Markup.callbackButton('Show files', 'show-files')
        ]))
    else
        ctx.editMessageText('Removal failed', goHomeButton())
})

dashboardScene.action('add-file', ctx => {
    ctx.session.dashboardState = dashboardState.SENDING_FILE
    ctx.editMessageText('Send file or press back', goHomeButton())
})

dashboardScene.action('dashboard-main', ctx => {
    ctx.editMessageText('Select', menuKeyboard)
    ctx.session.dashboardState = dashboardState.MAIN_MENU
})
dashboardScene.on('message', ctx => {
    if (ctx.session.dashboardState !== dashboardState.SENDING_FILE)
        return
    // Todo: Music is audio
    let doc = ctx.message.document
    if (!doc) {
        logger.warn('Not a FILE!!!')
        return ctx.reply('This is not a file. Try again or hit back', goHomeButton())
    }
    // Todo: check doc.mime_type
    let epKey = 'ep_' + Math.random().toString(36).substring(2, 2 + EP_NAME_LENGTH)

    let fileInfo = {
        epKey,
        fileId: doc.file_id,
        name: doc.file_name,
        size: doc.file_size
    }
    db.get(FILES_COLLECTION).push(fileInfo).write()
    ctx.reply('Send another or hit back', goHomeButton())
})

module.exports = dashboardScene
