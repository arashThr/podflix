const { createLogger, format, transports } = require('winston')
const { combine, timestamp, prettyPrint, simple } = format
const configs = require('./configs')

const logsDir = 'logs'

const logger = createLogger({
    transports: [
        new transports.File({
            filename: logsDir + '/info.log',
            format: combine(timestamp(), simple()),
            level: 'info'
        }),
        new transports.File({
            filename: logsDir + '/errors.log',
            format: combine(timestamp(), prettyPrint()),
            level: 'error'
        }),
        new transports.File({
            filename: logsDir + '/all.log',
            format: combine(timestamp(), format.json()),
            level: 'debug'
        })
    ]
})

if (configs.isInDev) {
    logger.add(
        new transports.Console({
            level: 'debug',
            format: format.combine(
                timestamp(),
                format.colorize(),
                simple()
            )
        })
    )
}

logger.level = configs.logLevel

module.exports = logger
