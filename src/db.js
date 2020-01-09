const mongoose = require('mongoose')
const configs = require('./configs')
const logger = require('./logger')
const redis = require('redis')

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
        logger.error('Connecting to db failed', { err })
        throw err
    }
}

const redisClient = redis.createClient()
redisClient.on('error', err => {
    logger.error('Erros in Redis', { err })
    process.exit()
})

module.exports = {
    initDb,
    redisClient
}
