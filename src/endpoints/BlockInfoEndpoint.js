const BaseEndpoint = require('./BaseEndpoint')
const { takeScreenshot } = require('../utils/screenshotManager')
const { collectAgentInfo } = require('../utils/agentMessenger')
const { Logger } = require('../utils/common')

class BlockInfoEndpoint extends BaseEndpoint {
    constructor(botManager) {
        super(botManager)
        this.method = 'get'
        this.path = '/get-block-info'
    }

    async handle(req, res) {
        if (!this.checkBot(res)) return

        try {
            Logger.info('Processing /get-block-info request...')
            await this.botManager.prepareResetPosition()
            
            const screenshot = await takeScreenshot(this.botManager.viewerPort)
            
            Logger.info('Fetching block info from server...')
            const blockInfoStr = await collectAgentInfo(this.botManager.bot, '/get_block_info', 'get-block-info')
            
            let blockInfo = blockInfoStr
            try {
                blockInfo = JSON.parse(blockInfoStr)
            } catch (e) {
                Logger.warn('Failed to parse block info as JSON, returning raw string')
            }

            res.json({
                info: blockInfo,
                screenshot: screenshot.name,
                image_path: screenshot.path
            })
        } catch (err) {
            Logger.error(`BlockInfo Error: ${err.message}`)
            res.status(500).json({ error: err.message })
        }
    }
}

module.exports = BlockInfoEndpoint
