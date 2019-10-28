const express = require('express')
const Payments = require('./payment')

const app = express()
const port = 3000

function handleRedirect (res, chatId) {
  const targetUrl = `${process.env.PAYMENT_SERVER_URL}/accepted/${chatId}`
  res.redirect(targetUrl)
}

app.get('/irpay/:chatId', (req, res) => {
  const chatId = req.params.chatId
  
  setTimeout(() => {
    handleRedirect(res, chatId)
  }, 1000);
})

app.get('/tgpay/:chatId', (req, res) => {
  const chatId = req.params.chatId
  
  setTimeout(() => {
    handleRedirect(res, chatId)
  }, 1000);
})


app.get('/accepted/:chatId', (req, res) => {
  const chatId = req.params.chatId

  if (Math.random() > 0.5) {
    res.send('Successful payment');
    console.log('Payment completed');

    const { resolve } = Payments.getPayment(chatId)
    resolve(chatId)
  } else {
    res.send('Failed payment');
    console.log('Payment failed');

    const { reject } = Payments.getPayment(chatId)
    reject(chatId)
  }
})

exports.startListen = function startListen() {
  app.listen(port, () => console.log(`Payment server start on port ${port}!`))
}
