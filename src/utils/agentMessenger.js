const { Logger, sleep } = require('./common')

async function collectAgentInfo(bot, command, type, timeout = 15000) {
    return new Promise((resolve, reject) => {
        const startTag = `===(agent-info:[${type}])`
        const endTag = `===(end-agent-info)`
        let collecting = false
        let lines = []
        
        const onMessage = (cm) => {
            const msg = cm.toString().trim()
            if (msg === startTag) {
                collecting = true
                return
            }
            if (msg === endTag) {
                bot.removeListener('message', onMessage)
                clearTimeout(timer)
                resolve(lines.join('\n'))
                return
            }
            if (collecting) {
                lines.push(msg)
            }
        }
        
        const timer = setTimeout(() => {
            bot.removeListener('message', onMessage)
            Logger.warn(`Timeout waiting for agent-info:[${type}]`)
            reject(new Error(`Timeout waiting for agent-info:[${type}] after command: ${command}`))
        }, timeout)

        bot.on('message', onMessage)
        bot.chat(command)
    })
}

module.exports = { collectAgentInfo }
