const { createLogger, format, transports } = require('winston')
const { combine, timestamp, prettyPrint, simple } = format
require('winston-daily-rotate-file')
const configs = require('./configs')

const logsDir = 'logs/'

const timezonedTime = () => {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Tehran'
    })
}

const logger = createLogger({
    transports: [
        new transports.File({
            filename: logsDir + 'info.log',
            format: combine(
                timestamp({
                    format: timezonedTime
                }),
                prettyPrint()
            ),
            level: 'info'
        }),
        new transports.File({
            filename: logsDir + 'errors.log',
            format: combine(
                timestamp({
                    format: timezonedTime
                }),
                prettyPrint()
            ),
            level: 'warn'
        }),
        new transports.DailyRotateFile({
            filename: logsDir + 'debug/%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: combine(
                timestamp({
                    format: timezonedTime
                }),
                format.json()
            ),
            level: 'debug'
        })
    ]
})

if (configs.isInDev) {
    logger.add(
        new transports.Console({
            level: 'debug',
            format: format.combine(
                timestamp({
                    format: timezonedTime
                }),
                format.colorize(),
                simple()
            )
        })
    )
}

logger.level = configs.logLevel

module.exports = logger
