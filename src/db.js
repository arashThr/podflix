const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adminDb = low(new FileSync('data/adminData.json'))
const userDb = low(new FileSync('data/usersData.json'))

const DB = {
    adminDb,
    userDb,
    FILES_COLLECTION: 'files',
    ADMIN_COLLECTION: 'admins',
    USERS_COLLECTION: 'users'
}

const adminDbObj = {}
adminDbObj[DB.FILES_COLLECTION] = []
adminDbObj[DB.ADMIN_COLLECTION] = []
adminDb.defaults(adminDbObj).write()

const userDbObj = {}
userDbObj[DB.USERS_COLLECTION] = []
userDb.defaults(userDbObj).write()

module.exports = DB
