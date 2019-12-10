const mongoose = require('mongoose')
const configs = require('./configs')
const logger = require('./logger')

let db = null
async function initDb() {
    try {
        if (db) {
            logger.warn('Trying to init DB again!')
            return db
        }
        const mongoUrl = `${configs.mongoUrl}/${configs.dbName}`
        await mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
        db = mongoose.connection
        db.on('error', console.error.bind(console, 'MongoDB connection error:'))
        return db
    } catch (err) {
        logger.error(err)
        throw err
    }
}

module.exports = {
    initDb,
    getDb() { return db },
    discountsCollection() { return db.collection('discounts') },
    close: () => db.close()
}
