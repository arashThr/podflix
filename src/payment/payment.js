const payments = new Map()

exports.addPay = function(chatId, { resolve, reject }) {
    payments.set(String(chatId), { resolve, reject })
}

exports.getPayment = function(chatId) {
    return payments.get(String(chatId))
}
