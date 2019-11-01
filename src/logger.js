const winston = require('winston')
const configs = require('./configs')

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
      })
    ]
})

logger.level = configs.logLevel

module.exports = logger
