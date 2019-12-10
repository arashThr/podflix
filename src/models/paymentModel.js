const mongoose = require('mongoose')

const paymentState = {
    requestedLink: 'requested',
    canceled: 'canceled',
    successful: 'success'
}

const paymentSchema = new mongoose.Schema(
    {
        created: { type: Date, default: new Date() },
        updated: { type: Date, default: new Date() },
        status: {
            type: String,
            enum: [
                paymentState.requestedLink,
                paymentState.canceled,
                paymentState.successful
            ],
            default: 'requested'
        },
        chatId: Number,
        price: Number,
        refId: String
    },
    { discriminatorKey: 'currency' }
)

const PaymentModel = mongoose.model('Payment', paymentSchema)

exports.irrPaymentModel = PaymentModel.discriminator('IRR', new mongoose.Schema({}))
exports.usdPaymentModel = PaymentModel.discriminator('USD', new mongoose.Schema({}))
exports.paymentState = paymentState
