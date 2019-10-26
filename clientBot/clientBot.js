const Telegraf = require('telegraf')
const Composer = require('telegraf/composer')
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Markup = require('telegraf/markup')
const WizardScene = require('telegraf/scenes/wizard')

const Payments = require('./payment')

const selectBuyStep = ctx => {
  ctx.reply(
    'Episode descriptions',
    Markup.inlineKeyboard([
      Markup.urlButton('Visit site', 'https://google.com'),
      Markup.callbackButton('Buy', 'buy'),
      Markup.callbackButton('Back', 'home')
    ]).extra()
  )
  return ctx.wizard.next()
}

const paymentDecisonStep = new Composer()
paymentDecisonStep.action('buy', (ctx) => {
  ctx.editMessageText('Are you in Iran?',
    Markup.inlineKeyboard([
      Markup.callbackButton('Yes', 'iran'),
      Markup.callbackButton('No', 'tg-payment')
    ]).extra()
  )
  return ctx.wizard.next()
})
paymentDecisonStep.action('home', ctx => {
  ctx.editMessageText('Leaving the buy. Going back to home.')
  return ctx.scene.leave()
})

const sendPaymentLinkStep = new Composer()
sendPaymentLinkStep.action('iran', async ctx => {
  ctx.editMessageText(
    'Pay from Iran',
    Markup.inlineKeyboard([
      Markup.urlButton('Pay', `${process.env.PAYMENT_SERVER_URL}/irpay/${ctx.chat.id}`)
    ]).extra()
  )

  let paymentPromise = new Promise((resolve, reject) => {
    Payments.addPay(ctx.chat.id, { resolve, reject })
  });
  
  try {
    console.log('Resolved: ' + await paymentPromise)
    ctx.editMessageText('Success')
  } catch (e) {
    console.log('Payment failed ... ', e);
    ctx.editMessageText('Failed!')
  } finally {
    ctx.scene.leave()
  }
})
sendPaymentLinkStep.action('tg-payment', ctx => {
  ctx.editMessageText(
    'Pay with telegram payment. Open this URL:',
    Markup.inlineKeyboard([
      Markup.urlButton('Telegram Payment', `${process.env.PAYMENT_SERVER_URL}/tgpay/${ctx.chat.id}`)
    ]).extra()
  )
})

let waitForPaymentStep = new Composer()
waitForPaymentStep.use(ctx => {
  console.log('AFTER')
  
  ctx.reply("Done111")
  ctx.scene.leave()
})

const paymentWizard = new WizardScene(
  'payment-wizard',
  selectBuyStep,
  paymentDecisonStep,
  sendPaymentLinkStep,
  waitForPaymentStep,
  ctx => {
    ctx.reply('Done')
    return ctx.scene.leave()
  }
)



const stepHandler = new Composer()
stepHandler.action('next', (ctx) => {
  ctx.reply('Step 2. Via inline button')
  return ctx.wizard.next()
})
stepHandler.command('next', (ctx) => {
  ctx.reply('Step 2. Via command')
  return ctx.wizard.next()
})
stepHandler.use((ctx) => ctx.replyWithMarkdown('Press `Next` button or type /next'))

const superWizard = new WizardScene('super-wizard',
  (ctx) => {
    ctx.reply('Step 1', Markup.inlineKeyboard([
      Markup.urlButton('❤️', 'http://telegraf.js.org'),
      Markup.callbackButton('➡️ Next', 'next')
    ]).extra())
    ctx.state.name = 'John'
    ctx.session.counter = 1
    return ctx.wizard.next()
  },
  stepHandler,
  (ctx) => {
    ctx.reply('Step 3: ' + ctx.state.name)
    ctx.session.counter += 1
    return ctx.wizard.next()
  },
  (ctx) => {
    ctx.reply('Step 4: ' + ctx.session.counter)
    return ctx.wizard.next()
  },
  (ctx) => {
    ctx.reply('Done')
    return ctx.scene.leave()
  }
)




exports.launchBot = function launchBot() {
  const bot = new Telegraf(process.env.BOT_TOKEN)
  const stage = new Stage([paymentWizard, superWizard], { default: 'super-wizard' })
  bot.use(session({ /* ttl: 1000 */ }))
  bot.use(stage.middleware())
  bot.launch()
  console.log('Bot started')
}
