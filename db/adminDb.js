const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('data/ownersData.json')
const db = low(adapter)

const FILES_COLLECTION = 'files', ADMIN_COLLECTION = 'admins'

// Set some defaults (required if your JSON file is empty)
initDb()

function initDb() {
    let dbObj = {}
    dbObj[FILES_COLLECTION] = []
    dbObj[ADMIN_COLLECTION] = []
    db.defaults(dbObj).write()
}

exports.FILES_COLLECTION = FILES_COLLECTION
exports.ADMIN_COLLECTION = ADMIN_COLLECTION
exports.db = db
