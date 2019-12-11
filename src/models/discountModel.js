const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const discountSchema = new mongoose.Schema({
    dateApplied: { type: Date, default: new Date() },
    chatId: { type: Number, required: true },
    code: { type: String, required: true },
    dollarPrice: { type: Number, required: true },
    toomanPrice: { type: Number, required: true },
    payId: ObjectId
})

const discountModel = mongoose.model('Discounts', discountSchema)
module.exports = discountModel
