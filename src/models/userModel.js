const mongoose = require('mongoose')
const { ObjectId } = require('mongodb')

const userSchema = new mongoose.Schema({
    chatId: Number,
    userName: String,
    realName: String,
    paymentId: ObjectId
})

const UserModel = mongoose.model('Users', userSchema)
module.exports = UserModel
