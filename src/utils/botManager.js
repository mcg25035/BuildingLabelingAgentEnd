const mineflayer = require('mineflayer')
const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
const { collectAgentInfo } = require('./agentMessenger')
const { Logger, sleep } = require('./common')

class BotManager {
    constructor(options, viewerPort) {
        this.options = options
        this.viewerPort = viewerPort
        this.bot = null
        this.botError = null
        this.isBotReady = false
        this.viewerStarted = false
    }

    createBot() {
        Logger.info('Connecting to Minecraft server...')
        this.bot = mineflayer.createBot(this.options)

        this.bot.on('login', () => {
            Logger.info('Bot logged in.')
            this.botError = null
        })

        this.bot.on('resource_pack', () => {
            Logger.info('Accepting resource pack...')
            this.bot.acceptResourcePack()
        })

        this.bot.on('message', (cm) => {
            const msg = cm.toString().trim()
            if (!msg.includes('===(agent-info:')) {
                Logger.info(`CHAT: ${msg}`)
            }
        })

        this.bot.on('spawn', () => {
            Logger.info('Bot spawned.')
            this.isBotReady = true
            this.bot.chat('/gamemode creative')

            // Online message
            setTimeout(() => {
                if (this.bot && this.isBotReady) {
                    const env = process.env.ENV === 'production' ? '運作中' : '測試中'
                    const prefix = process.env.BOT_MESSAGE_PREFIX || '建築物資料標記Agent已上線'
                    try { this.bot.chat(`${prefix} （${env}）`) } catch(e) {}
                }
            }, 3000)
            
            if (!this.viewerStarted) {
                // Set viewDistance to 32 to ensure everything is visible from very high altitude
                mineflayerViewer(this.bot, { port: this.viewerPort, firstPerson: true, viewDistance: 32 })
                Logger.info(`Viewer started on port ${this.viewerPort} (viewDistance: 32)`)
                this.viewerStarted = true
            }
        })

        this.bot.on('death', () => {
            Logger.warn('Bot died! Respawning...')
            this.bot.respawn()
            setTimeout(() => this.bot.chat('/gamemode creative'), 2000)
        })

        this.bot.on('end', (reason) => {
            Logger.warn(`Bot disconnected: ${reason}`)
            this.isBotReady = false
            setTimeout(() => this.createBot(), 5000)
        })

        this.bot.on('error', (err) => {
            Logger.error(`Bot error: ${err.message}`)
            this.botError = err.message
        })

        return this.bot
    }

    async prepareResetPosition() {
        Logger.info('Preparing reset position...')
        // Set height to 340 as requested by user
        this.bot.chat('/minecraft:tp @s ~ 340 ~ 0 90')
        this.bot.chat('/gamemode creative')
        await sleep(1000)
        
        if (this.bot.creative) {
            try { await this.bot.creative.startFlying() } catch (e) {}
        }
        
        Logger.info('Executing /reset_position...')
        // Use a simpler tag collector if the message event fails
        await collectAgentInfo(this.bot, '/reset_position', 'reset-position')
    }

    get state() {
        return {
            error: this.botError,
            ready: this.isBotReady
        }
    }
}

module.exports = BotManager
