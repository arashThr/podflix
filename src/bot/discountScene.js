const Scene = require('telegraf/scenes/base')
const { applyDiscount } = require('../payment/discounts')

const discountScene = new Scene('discount-scene')

discountScene.enter(async ctx => {
    await ctx.reply('Enter code:')
})

discountScene.on('text', async ctx => {
    const code = ctx.message.text
    const chatId = ctx.from.id
    const discount = await applyDiscount(chatId, code)
    if (discount) {
        ctx.session.discount = discount
        ctx.reply('Code applied')
    } else {
        ctx.reply('Code used or unavailable')
    }
    ctx.scene.enter('payment-wizard')
})

module.exports = discountScene
