const axios = require('axios');
const { Logger } = require('../utils/common');

class LlmProvider {
    constructor() {
        this.apiUrl = process.env.OPENAI_BASE_URL || 'https://api.banana2556.com/v1';
        this.apiKey = process.env.OPENAI_API_KEY;
        this.model = process.env.OPENAI_MODEL || 'grok-4.20-fast';
        this.group = process.env.OPENAI_GROUP || 'default';
    }

    async chat(messages) {
        const payload = {
            model: this.model,
            group: this.group,
            stream: false,
            messages: messages
        };

        Logger.info(`Sending context to LLM via Axios (URL: ${this.apiUrl}, Model: ${this.model}, Group: ${this.group})...`);

        const response = await axios.post(`${this.apiUrl}/chat/completions`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: 120000
        });

        return response.data.choices[0].message.content;
    }
}

module.exports = LlmProvider;
