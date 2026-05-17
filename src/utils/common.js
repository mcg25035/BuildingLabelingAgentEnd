const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../../bot.log');

class Logger {
    static log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const formattedMsg = `[${timestamp}] [${level}] ${message}`;
        console.log(formattedMsg);
        fs.appendFileSync(LOG_FILE, formattedMsg + '\n');
    }

    static info(msg) { this.log(msg, 'INFO'); }
    static warn(msg) { this.log(msg, 'WARN'); }
    static error(msg) { this.log(msg, 'ERROR'); }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = { Logger, sleep };
