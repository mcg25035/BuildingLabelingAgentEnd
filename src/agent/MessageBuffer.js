const fs = require('fs');
const path = require('path');

class MessageBuffer {
    constructor() {
        this.systemPrompt = fs.readFileSync(path.join(__dirname, '../../prompts.txt'), 'utf8');
        this.messages = [
            { role: 'system', content: this.systemPrompt }
        ];
    }

    addMessage(role, content) {
        this.messages.push({ role, content });
        this.pruneImages();
    }

    pruneImages() {
        // Find all messages that contain images
        const imageMsgIndices = [];
        for (let i = 0; i < this.messages.length; i++) {
            const msg = this.messages[i];
            if (Array.isArray(msg.content) && msg.content.some(item => item.type === 'image_url')) {
                imageMsgIndices.push(i);
            }
        }

        // Prune intermediate images: keep the first (index 0) and the previous (last in the array currently)
        if (imageMsgIndices.length > 2) {
            for (let i = 1; i < imageMsgIndices.length - 1; i++) {
                const idx = imageMsgIndices[i];
                const msg = this.messages[idx];
                msg.content = msg.content.filter(item => item.type !== 'image_url');
                // Only add placeholder if it's not already there to prevent duplication
                if (!msg.content.some(item => item.text && item.text.includes('歷史截圖已移除'))) {
                    msg.content.push({ type: 'text', text: '[系統提示：此處原有的歷史截圖已移除以節省傳輸空間]' });
                }
            }
        }
    }

    getMessages() {
        return this.messages;
    }
}

module.exports = MessageBuffer;
