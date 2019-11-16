const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')
const Composer = require('telegraf/composer')
const redis = require('redis')
const { getPaymentLink } = require('../payment/payping')
const configs = require('../configs')

const logger = require('../logger')
const { usersCollection, rialPaymentsCollection } = require('../db')

const paymentState = {
    requestedLink: 'requested',
    canceled: 'canceled',
    successful: 'success'
}

const sub = redis.createClient(configs.redisUrl)
sub.on('message', (channel, message) => {
    const { chatId, refId, status } = JSON.parse(message)
    console.log('New message from ' + channel + ', message: ' + chatId)
    const paymentPromise = payments.get(String(chatId))

    if (!paymentPromise) {
        logger.info('Payment verfied - No promise to resolve')
        return
    }

    const { resolve, reject } = paymentPromise

    if (status === 200) {
        logger.verbose('Payment verifed')
        resolve(refId)
    } else {
        if (status === 400) logger.verbose('Payment canceled')
        else logger.error('Verification failed')
        reject(refId)
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
    const user = getUserFrom(ctx.from)
    const payId = await initPay(rialPaymentsCollection(), user, price)

    const link = await getPaymentLink({
        amount: price,
        clientRefId: payId.toString(),
        payerIdentity: user.chatId,
        payerName: user.realName
    })

    await fulfillPayment(link, ctx, rialPaymentsCollection(), payId)
})
sendPaymentLinkStep.action('tg-payment', ctx => {
    // Stripe: create page => const sessionId = await getStripeSessionId()
    ctx.editMessageText(
        'Pay with telegram payment. Open this URL:',
        Markup.inlineKeyboard([
            Markup.urlButton('Telegram Payment', 'http://google.com')
        ]).extra()
    )
})

function getUserFrom(tgUser) {
    return {
        chatId: tgUser.id,
        userName: tgUser.username,
        realName:
            [tgUser.first_name, tgUser.last_name].join(' ').trim() ||
            tgUser.username ||
            'Unknown'
    }
}

const paymentWizard = new WizardScene(
    'payment-wizard',
    selectBuyStep,
    paymentDecisonStep,
    sendPaymentLinkStep
)

async function initPay(moneyCollection, user, price) {
    const payment = {
        created: new Date(),
        updated: new Date(),
        status: paymentState.requestedLink,
        user,
        price
    }
    const payRes = await moneyCollection.insertOne(payment)
    const payId = payRes.insertedId
    return payId
}

async function fulfillPayment(link, ctx, moneyCollection, payId) {
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
        const result = await waitForPayment(user, moneyCollection, payId)

        if (result.ok) {
            ctx.editMessageText('Success')
            ctx.scene.enter('user-menu-scene')
        } else {
            ctx.reply('User add failed')
            ctx.scene.leave()
        }
    } catch (e) {
        logger.error('Payment canceled ... ', user, e)
        ctx.editMessageText('Payment canceled. Please try again or contact us')
        moneyCollection.updateOne({ _id: payId }, {
            $set: {
                updated: new Date(),
                status: paymentState.canceled
            }
        })

        ctx.scene.enter('payment-wizard')
    }
}

async function waitForPayment(user, moneyCollection, payId) {
    const paymentPromise = new Promise((resolve, reject) => {
        payments.set(String(user.chatId), { resolve, reject })
    })

    const refId = await paymentPromise

    logger.debug('Payment resolved with ref id of: ' + refId)

    await moneyCollection.updateOne({ _id: payId }, {
        $set: {
            refId,
            updated: new Date(),
            status: paymentState.successful
        }
    })

    user.paymentId = payId
    const { result } = await usersCollection().insertOne(user)
    return result
}

module.exports = paymentWizard
