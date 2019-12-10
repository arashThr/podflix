const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const Composer = require('telegraf/composer')
const redis = require('redis')
const { getPaymentLink } = require('../payment/payping')
const { getStripePaymentLink } = require('../payment/stripeRoute')
const configs = require('../configs')
const UserModel = require('../models/userModel')

const logger = require('../logger')
const { irrPaymentModel, usdPaymentModel, paymentState } = require('../models/paymentModel')

const sub = redis.createClient(configs.redisUrl)
sub.on('message', (channel, message) => {
    const { clientRefId, successful } = JSON.parse(message)
    logger.verbose(`New message for ${channel}, refId: ${clientRefId}, successful: ${successful}`)
    const paymentPromise = payments.get(clientRefId)

    if (!paymentPromise) {
        logger.info('Payment verfied - No promise to resolve')
        return
    }

    const { resolve, reject } = paymentPromise

    if (successful) {
        logger.verbose('Payment verifed')
        resolve(clientRefId)
    } else {
        logger.verbose('Payment failed')
        reject(clientRefId)
    }
})
sub.subscribe('payment-verify')

const selectBuyStep = ctx => {
    ctx.reply(
        'Episode descriptions',
        Markup.inlineKeyboard([
            Markup.callbackButton('Buy', 'buy'),
            Markup.urlButton('Visit site', configs.serverUrl)
        ]).extra()
    )
    return ctx.wizard.next()
}

const payments = new Map()

const paymentDecisonStep = new Composer()
paymentDecisonStep.action('buy', ctx => {
    ctx.editMessageText(
        'Are you in Iran?',
        Markup.inlineKeyboard([
            Markup.callbackButton('Yes', 'iran'),
            Markup.callbackButton('No', 'tg-payment')
        ]).extra()
    )
    return ctx.wizard.next()
})

const sendPaymentLinkStep = new Composer()
sendPaymentLinkStep.action('iran', async ctx => {
    const price = configs.app.price
    const chatId = ctx.from.id
    const payment = await irrPaymentModel.create({ price, chatId })

    const link = await getPaymentLink({
        amount: price,
        clientRefId: payment._id.toString(),
        payerIdentity: chatId
    })

    await fulfillPayment(link, ctx, irrPaymentModel, payment._id)
})
sendPaymentLinkStep.action('tg-payment', async ctx => {
    const price = configs.app.usdPrice
    const payment = await usdPaymentModel.create({
        price,
        chatId: ctx.from.id
    })
    const link = await getStripePaymentLink({
        amount: price,
        clientRefId: payment._id.toString()
    })
    logger.debug('Stripe payment link: ' + link)
    await fulfillPayment(link, ctx, usdPaymentModel, payment._id)
})

function getUserFrom(tgUser) {
    return {
        chatId: tgUser.id,
        userName: tgUser.username,
        realName:
            [tgUser.first_name, tgUser.last_name].join(' ').trim() ||
            tgUser.username ||
            'Unknown',
        paymentId: null
    }
}

const paymentWizard = new WizardScene(
    'payment-wizard',
    selectBuyStep,
    paymentDecisonStep,
    sendPaymentLinkStep
)

async function fulfillPayment(link, ctx, paymentModel, payId) {
    const user = getUserFrom(ctx.from)

    if (!link) {
        logger.error('Getting payment link failed for ', ctx.from)
        ctx.editMessageText(
            'Getting payment link failed. Try again later - /start'
        )
        ctx.scene.leave()
        return
    }
    await ctx.editMessageText(
        'Click to pay',
        Markup.inlineKeyboard([Markup.urlButton('Pay', link)]).extra()
    )
    try {
        const successful = await waitForPayment(user, paymentModel, payId)

        if (successful) {
            ctx.editMessageText('Success')
            ctx.scene.enter('user-menu-scene')
        } else {
            ctx.reply('User add failed')
            ctx.scene.leave()
        }
    } catch (e) {
        logger.error('Payment canceled ... ', user, e)
        ctx.editMessageText('Payment canceled. Please try again or contact us')
        paymentModel.updateOne({ _id: payId }, {
            $set: {
                updated: new Date(),
                status: paymentState.canceled
            }
        })

        ctx.scene.enter('payment-wizard')
    }
}

async function waitForPayment(user, paymentModel, payId) {
    const paymentPromise = new Promise((resolve, reject) => {
        payments.set(String(payId), { resolve, reject })
    })
    const refId = await paymentPromise
    logger.debug('Payment resolved with ref id of: ' + refId)

    await paymentModel.updateOne({ _id: payId }, {
        $set: {
            refId,
            updated: new Date(),
            status: paymentState.successful
        }
    })

    user.paymentId = payId
    const result = await UserModel.create(user)
    if (result.errors) {
        logger.error('Error at user creation', result.errors)
        return false
    }
    return true
}

module.exports = paymentWizard
