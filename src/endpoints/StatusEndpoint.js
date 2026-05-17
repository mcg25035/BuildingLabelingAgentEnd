const BaseEndpoint = require('./BaseEndpoint')

class StatusEndpoint extends BaseEndpoint {
    constructor(botManager) {
        super(botManager)
        this.method = 'get'
        this.path = '/status'
    }

    async handle(req, res) {
        res.json(this.botManager.state)
    }
}

module.exports = StatusEndpoint
