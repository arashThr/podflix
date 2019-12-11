const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const userSchema = new mongoose.Schema({
    chatId: { type: Number, required: true },
    userName: String,
    realName: String
}, { discriminatorKey: 'accountType' }
)

const UserModel = mongoose.model('Users', userSchema)

exports.PayedUserModel = UserModel.discriminator('payedAccount', new mongoose.Schema({
    paymentId: { type: ObjectId, reqiured: true }
}))

exports.FreeUserModel = UserModel.discriminator('freeAccount', new mongoose.Schema({
    discountId: { type: ObjectId, required: true }
}))

exports.UserModel = UserModel
