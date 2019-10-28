const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('data/usersData.json')
const userDb = low(adapter)

const USERS_COLLECTION = 'users'

initDb()

function initDb() {
    const dbObj = {}
    dbObj[USERS_COLLECTION] = []
    userDb.defaults(dbObj).write()
}

exports.USERS_COLLECTION = USERS_COLLECTION
exports.userDb = userDb
