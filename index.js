require('dotenv').config()
const express = require('express')
const BotManager = require('./src/utils/botManager')
const Router = require('./src/utils/router')
const { Logger } = require('./src/utils/common')
const LlmAgent = require('./src/agent/llmAgent')

const app = express()
app.use(express.json())

process.on('uncaughtException', (err) => {
    if (err.message.includes('unknown chat format')) return
    Logger.error(`Uncaught Exception: ${err.stack}`)
})

const botManager = new BotManager({
    host: process.env.MC_HOST,
    auth: 'microsoft',
    onMsaCode: (d) => botManager.botError = `Manual login: ${d.message}`
}, process.env.VIEWER_PORT || 3001)

botManager.createBot()
Router.register(app, botManager)

// Start the autonomous LLM agent loop
new LlmAgent(botManager).start()

const PORT = process.env.HTTP_PORT || 3000
app.listen(PORT, () => Logger.info(`HTTP server listening on port ${PORT}`))
