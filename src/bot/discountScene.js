const Scene = require('telegraf/scenes/base')
const Commons = require('../common')
const { applyDiscount, addFreeUser } = require('../payment/discounts')

const discountScene = new Scene('discount-scene')

discountScene.enter(async ctx => {
    await ctx.reply('Enter code:')
})

discountScene.on('text', async ctx => {
    const code = ctx.message.text
    const chatId = ctx.from.id
    const result = await applyDiscount(chatId, code)
    if (result.discountId) {
        ctx.reply('Code applied')
        if (result.isFree) {
            const user = Commons.getUserFrom(ctx.from)
            await addFreeUser(user, result.discountId)
            ctx.scene.enter('user-menu-scene')
        } else {
            ctx.scene.enter('payment-wizard')
        }
    } else {
        ctx.reply(result.reason + 'Press /start')
        ctx.scene.leave()
    }
})

module.exports = discountScene
