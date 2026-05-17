const { Logger } = require('../utils/common')

class BaseEndpoint {
    constructor(botManager) {
        this.botManager = botManager
        this.method = 'get' // default
        this.path = '/'    // default
    }

    checkBot(res) {
        const { error, ready } = this.botManager.state
        if (error) {
            Logger.warn(`API Error: Bot has error - ${error}`)
            res.status(503).json({ error })
            return false
        }
        if (!ready) {
            Logger.warn(`API Error: Bot not ready for ${this.path}`)
            res.status(503).json({ error: 'Bot not ready' })
            return false
        }
        return true
    }
}

module.exports = BaseEndpoint
