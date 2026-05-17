const BaseEndpoint = require('./BaseEndpoint')
const { takeScreenshot } = require('../utils/screenshotManager')
const { Logger, sleep } = require('../utils/common')

class TpEndpoint extends BaseEndpoint {
    constructor(botManager) {
        super(botManager)
        this.method = 'put'
        this.path = '/tp'
    }

    async handle(req, res) {
        if (!this.checkBot(res)) return

        const { relative_x, relative_z } = req.body
        if (relative_x === undefined || relative_z === undefined) {
            return res.status(400).json({ error: 'Missing relative_x or relative_z' })
        }

        try {
            Logger.info(`Processing /tp request: ~${relative_x} ~ ~${relative_z}`)
            this.botManager.bot.chat(`/minecraft:tp @s ~${relative_x} ~ ~${relative_z} 0 90`)
            this.botManager.bot.chat('/gamemode creative')
            
            await sleep(1000)
            
            Logger.info('Resetting position after TP...')
            await this.botManager.prepareResetPosition()
            
            const screenshot = await takeScreenshot(this.botManager.viewerPort)
            
            res.json({
                message: 'Teleported and reset position',
                screenshot: screenshot.name,
                image_path: screenshot.path
            })
        } catch (err) {
            Logger.error(`TP Error: ${err.message}`)
            res.status(500).json({ error: err.message })
        }
    }
}

module.exports = TpEndpoint
