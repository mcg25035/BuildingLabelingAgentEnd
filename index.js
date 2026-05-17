require('dotenv').config()
const express = require('express')
const BotManager = require('./src/utils/botManager')
const Router = require('./src/utils/router')
const { Logger } = require('./src/utils/common')

const app = express()
app.use(express.json())

// The "Shield": Catch 1.21 packet errors but don't let them kill the process
process.on('uncaughtException', (err) => {
    if (err.message.includes('unknown chat format')) return // Ignore this specific crash
    Logger.error(`Uncaught Exception: ${err.stack}`)
})

const botManager = new BotManager({
    host: process.env.MC_HOST,
    auth: 'microsoft',
    // REMOVED explicit version, let it auto-detect
    onMsaCode: (d) => {
        Logger.warn(`Manual login needed: ${d.message}`)
        botManager.botError = `Manual login needed: ${d.message}`
    }
}, process.env.VIEWER_PORT || 3001)

botManager.createBot()
Router.register(app, botManager)

const PORT = process.env.HTTP_PORT || 3000
app.listen(PORT, () => Logger.info(`HTTP server listening on port ${PORT}`))
