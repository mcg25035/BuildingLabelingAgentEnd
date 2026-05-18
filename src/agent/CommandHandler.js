const { Logger, sleep } = require('../utils/common');
const { collectAgentInfo } = require('../utils/agentMessenger');
const { takeScreenshot } = require('../utils/screenshotManager');

class CommandHandler {
    constructor(botManager) {
        this.botManager = botManager;
    }

    async handle(commandLine) {
        let currentPrompt = '';
        let screenshot = null;

        if (commandLine === '.get-block-info') {
            Logger.info('Executing /get_block_info...');
            const infoStr = await collectAgentInfo(this.botManager.bot, '/get_block_info', 'get-block-info');
            
            let formattedInfo = infoStr;
            try {
                const parsed = JSON.parse(infoStr);
                if (parsed.heightest_blocks && Array.isArray(parsed.heightest_blocks)) {
                    const blocks = parsed.heightest_blocks;

                    if (blocks && blocks.length > 0) {
                        const yaw = (this.botManager.bot.entity && this.botManager.bot.entity.yaw) || 0;
                        let normalizedYaw = yaw % (2 * Math.PI);
                        if (normalizedYaw < 0) normalizedYaw += 2 * Math.PI;
                        const dir = Math.round(normalizedYaw / (Math.PI / 2)) % 4;

                        const avgX = blocks.reduce((sum, b) => sum + b.x, 0) / blocks.length;
                        const avgZ = blocks.reduce((sum, b) => sum + b.z, 0) / blocks.length;

                        blocks.forEach(b => {
                            const dx = b.x - Math.round(avgX);
                            const dz = b.z - Math.round(avgZ);
                            let row = 0, col = 0;
                            if (dir === 0) { // South
                                row = -dz; col = -dx;
                            } else if (dir === 1) { // West
                                row = dx; col = -dz;
                            } else if (dir === 2) { // North
                                row = dz; col = dx;
                            } else { // East
                                row = -dx; col = dz;
                            }
                            b.row = row;
                            b.col = col;
                        });

                        blocks.sort((a, b) => {
                            if (a.row !== b.row) return a.row - b.row;
                            return a.col - b.col;
                        });
                    }

                    let grid = '';
                    for (let i = 0; i < blocks.length; i += 3) {
                        const rowStr = blocks.slice(i, i + 3).map(b => `${b.x} ${b.y} ${b.z} ${b.block}`).join(' ; ');
                        grid += rowStr + '\n';
                    }
                    formattedInfo = grid.trim();
                }
            } catch (e) {
                Logger.warn('Failed to parse block info as JSON, using raw string');
            }

            currentPrompt = `.get-block-info 執行完成。伺服器回傳：\n${formattedInfo}`;
            screenshot = await takeScreenshot(this.botManager.viewerPort);
        } else if (commandLine.startsWith('.tp ')) {
            const parts = commandLine.split(' ').filter(p => p.length > 0);
            const rx = parseFloat(parts[1]);
            const rz = parseFloat(parts[2]);
            if (isNaN(rx) || isNaN(rz)) {
                currentPrompt = `指令格式錯誤 (${commandLine})。參數必需為數字。`;
            } else {
                Logger.info(`Executing relative TP: ~${rx} ~ ~${rz}`);
                this.botManager.bot.chat(`/minecraft:tp @s ~${rx} ~ ~${rz} 0 90`);
                await sleep(1000);
                await this.botManager.prepareResetPosition();
                currentPrompt = `.tp 執行完成。`;
            }
            screenshot = await takeScreenshot(this.botManager.viewerPort);
        } else if (commandLine.startsWith('.confirm ')) {
            const pt = commandLine.split(' ')[1];
            Logger.info(`Agent confirmed point ${pt}`);
            currentPrompt = `已確認對角 ${pt}。請繼續後續標記。`;
            screenshot = await takeScreenshot(this.botManager.viewerPort);
        } else {
            currentPrompt = `不支援的指令格式 (${commandLine})。`;
            screenshot = await takeScreenshot(this.botManager.viewerPort);
        }

        return { currentPrompt, screenshot };
    }
}

module.exports = CommandHandler;
