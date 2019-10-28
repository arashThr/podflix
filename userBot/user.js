const { userDb, USERS_COLLECTION } = require('../db/userDb')

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
        return userDb
            .get(USERS_COLLECTION)
            .find({ chatId: tgUser.id })
            .value()
    }

    static addNewUser(tgUser) {
        const user = User.mapTgUserToUser(tgUser)
        return userDb
            .get(USERS_COLLECTION)
            .push(user)
            .write()
    }
}
