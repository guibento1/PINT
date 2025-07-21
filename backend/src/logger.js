const winston = require('winston');
const fs = require('fs');
const path = require('path');

const logDir = path.resolve(__dirname, 'logs');

if (!fs.existsSync(logDir)) {
    console.log(`Creating logs directory at: ${logDir}`); 
    fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
            level: 'debug'
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'debug.log'),
            level: 'debug'
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'info.log'),
            level: 'info'
        }),
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error'
        })
    ]
});

module.exports = logger;
