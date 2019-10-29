const db = require('../db')

module.exports = class User {
    static mapTgUserToUser(tgUser) {
        return {
            chatId: tgUser.id,
            username: tgUser.username,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name
        }
    }

    static findUser(tgUser) {
        return db.userDb
            .get(db.USERS_COLLECTION)
            .find({ chatId: tgUser.id })
            .value()
    }

    static addNewUser(tgUser) {
        const user = User.mapTgUserToUser(tgUser)
        return db.userDb
            .get(db.USERS_COLLECTION)
            .push(user)
            .write()
    }
}
