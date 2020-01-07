const { createLogger, format, transports } = require('winston')
const { combine, timestamp, prettyPrint } = format
const configs = require('./configs')

const logger = createLogger({
    format: combine(timestamp(), prettyPrint()),
    transports: [
        new transports.File({
            filename: 'data/info.log',
            level: 'info'
        }),
        new transports.File({
            filename: 'data/errors.log',
            level: 'error'
        }),
        new transports.File({
            filename: 'data/all.log',
            level: 'debug'
        })
    ]
})

if (configs.isInDev) {
    logger.add(
        new transports.Console({
            level: 'debug',
            format: format.combine(
                format.colorize(),
                format.simple()
              )
        })
    )
}

logger.level = configs.logLevel

module.exports = logger
