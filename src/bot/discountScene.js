const Scene = require('telegraf/scenes/base')
const { applyDiscount } = require('../payment/discounts')

const discountScene = new Scene('discount-scene')

discountScene.enter(async ctx => {
    await ctx.reply('Enter code:')
})

discountScene.on('text', async ctx => {
    const code = ctx.message.text
    const chatId = ctx.from.id
    const applied = await applyDiscount(chatId, code)
    if (applied) {
        ctx.session.discount = applied
        ctx.reply('Code applied')
        ctx.scene.enter('payment-wizard')
    } else {
        ctx.reply('Code used or unavailable. Press /start')
        ctx.scene.leave()
    }
})

module.exports = discountScene
