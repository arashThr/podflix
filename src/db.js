const MongoClient = require('mongodb').MongoClient
const configs = require('./configs')
const logger = require('./logger')

let db = null
let client = null
async function initDb() {
    try {
        if (db) {
            logger.warn('Trying to init DB again!')
            return db
        }
        const url = configs.mongoUrl
        client = await MongoClient.connect(url, { useUnifiedTopology: true })
        db = client.db(configs.dbName)
        return db
    } catch (err) {
        logger.error(err)
        throw err
    }
}

module.exports = {
    initDb,
    getDb() { return db },
    usersCollection() { return db.collection('users') },
    filesCollection() { return db.collection('files') },
    paymentsCollection() { return db.collection('payments') },
    close: () => client.close()
}
