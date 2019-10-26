const Scene = require('telegraf/scenes/base')
const Markup = require('telegraf/markup')

let uploadedFiles = []


const dashboardScene = new Scene('dashboard')
const dashboardState = {
    SENDING_FILE: 'sending',
    MAIN_MENU: 'menu'
}

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
    ctx.editMessageText('Showing files', getBackButton())
    ctx.replyWithDocument('BQADBAADJgUAAv70qFHxyWJNHpfNQBYE')
})
dashboardScene.action('add-file', ctx => {
    ctx.session.dashboardState = dashboardState.SENDING_FILE
    ctx.editMessageText('Send file or press back', getBackButton())
})
dashboardScene.action('dashboard-main', ctx => {
    let replyFunc = ctx.session.dashboardState === dashboardState.SENDING_FILE
        ? ctx.reply : ctx.editMessageText
    replyFunc('Select', menuKeyboard)
    ctx.session.dashboardState = dashboardState.MAIN_MENU
})
dashboardScene.on('message', ctx => {
    if (ctx.session.dashboardState !== dashboardState.SENDING_FILE)
        return
    // Todo: Music is audio
    let doc = ctx.message.document
    if (!doc) {
        ctx.reply('This is not a file')
        ctx.scene.enter()
    }
    // if (doc.mime_type)
    let fileInfo = {
        id: doc.file_id,
        name: doc.file_name,
        size: doc.file_size
    }
    uploadedFiles.push(fileInfo)
    ctx.reply('Send another or hit back', getBackButton())
})

module.exports = dashboardScene
