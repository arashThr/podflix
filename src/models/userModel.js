const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const userSchema = new mongoose.Schema({
    chatId: Number,
    userName: String,
    realName: String,
    paymentId: ObjectId
})

const UserModel = mongoose.model('Users', userSchema)
module.exports = UserModel
