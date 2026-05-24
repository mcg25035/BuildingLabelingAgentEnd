const fs = require('fs');
const { takeScreenshot } = require('../utils/screenshotManager');
const { Logger, sleep } = require('../utils/common');
const LlmProvider = require('./LlmProvider');
const MessageBuffer = require('./MessageBuffer');
const CommandHandler = require('./CommandHandler');

class LlmAgent {
    constructor(botManager) {
        this.botManager = botManager;
        this.provider = new LlmProvider();
        this.messageBuffer = new MessageBuffer();
        this.commandHandler = new CommandHandler(botManager);
        this.isRunning = false;
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        Logger.info('Starting LLM Agent Loop...');

        while (!this.botManager.state.ready) {
            await sleep(1000);
        }

        Logger.info('Initial TP to 226 94 207...');
        this.botManager.bot.chat('/minecraft:tp @s 226 94 207 0 90');
        this.botManager.bot.chat('/gamemode creative');
        await sleep(2000);

        await this.botManager.prepareResetPosition();
        let screenshot = await takeScreenshot(this.botManager.viewerPort);
        let currentPrompt = "遊戲已初始化。目前位置：226 94 207。請根據畫面給出指令。";

        while (this.isRunning) {
            try {
                const base64Image = fs.readFileSync(screenshot.path).toString('base64');
                const userContent = [
                    { type: 'text', text: currentPrompt },
                    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ];

                this.messageBuffer.addMessage('user', userContent);

                const replyText = await this.provider.chat(this.messageBuffer.getMessages());
                Logger.info(`\n🤖 LLM Reply:\n${replyText}\n`);
                this.messageBuffer.addMessage('assistant', replyText);

                // Parse command
                const lines = replyText.split('\n');
                let commandLine = lines.find(l => l.trim().startsWith('.'));

                if (!commandLine) {
                    Logger.warn('No command found in LLM response.');
                    currentPrompt = "系統提示：未偵測到您的指令（指令必須以 . 開頭，且單獨佔一行）。請重新給予指令。";
                    screenshot = await takeScreenshot(this.botManager.viewerPort);
                    continue;
                }

                commandLine = commandLine.trim();
                Logger.info(`⚙️ Executing parsed command: ${commandLine}`);

                const result = await this.commandHandler.handle(commandLine);
                currentPrompt = `系統提示：${result.currentPrompt}`;
                screenshot = result.screenshot;

            } catch (err) {
                const isRateLimit = err.response && (err.response.status === 429 || err.response.status === 402);
                Logger.error(`LLM Agent loop error: ${err.message}${isRateLimit ? ' (Rate Limit/Balance)' : ''}`);

                if (isRateLimit) {
                    // Remove the failed user message from buffer to prevent duplication on retry
                    if (this.messageBuffer.messages.length > 0 && this.messageBuffer.messages[this.messageBuffer.messages.length - 1].role === 'user') {
                        this.messageBuffer.messages.pop();
                    }
                    Logger.info('Waiting 30s before retrying due to rate limit...');
                    await sleep(30000);
                    // Do NOT retake screenshot, reuse the current one
                } else {
                    await sleep(5000);
                    try { screenshot = await takeScreenshot(this.botManager.viewerPort) } catch(e) {}
                    currentPrompt = `系統提示：發生錯誤 (${err.message})，請重試或重新發送指令。`;
                }
            }
        }

    }
}

module.exports = LlmAgent;
