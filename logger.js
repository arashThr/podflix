const winston = require('winston')

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
      })
    ]
});

logger.level = process.env.LOG_LEVEL

module.exports = logger
