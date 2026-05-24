const axios = require('axios');
const { Logger } = require('../utils/common');

class LlmProvider {
    constructor() {
        this.activeProvider = process.env.ACTIVE_PROVIDER || 'banana';

        if (this.activeProvider === 'openrouter') {
            this.apiUrl = (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
            this.apiKey = process.env.OPENROUTER_API_KEY;
            this.model = process.env.OPENROUTER_MODEL || 'google/gemma-4-31b-it:free';
            this.group = null;
        } else {
            // Default to banana, with backward compatibility for OPENAI_ prefix
            this.apiUrl = (process.env.BANANA_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.banana2556.com/v1').replace(/\/$/, '');
            this.apiKey = process.env.BANANA_API_KEY || process.env.OPENAI_API_KEY;
            this.model = process.env.BANANA_MODEL || process.env.OPENAI_MODEL || 'grok-4.20-fast';
            this.group = process.env.BANANA_GROUP || process.env.OPENAI_GROUP || 'default';
        }
    }

    async chat(messages) {
        const payload = {
            model: this.model,
            stream: false,
            messages: messages
        };

        if (this.group) {
            payload.group = this.group;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey.trim()}`
        };

        if (this.activeProvider === 'openrouter') {
            headers['HTTP-Referer'] = 'https://github.com/BuildingLabelingAgent';
            headers['X-Title'] = 'BuildingLabelingAgent';
        }

        const fullUrl = `${this.apiUrl}/chat/completions`;
        Logger.info(`Sending context to LLM via Axios (Provider: ${this.activeProvider}, URL: ${fullUrl}, Model: ${this.model}${this.group ? `, Group: ${this.group}` : ''})...`);

        const response = await axios.post(fullUrl, payload, {
            headers: headers,
            timeout: 120000
        });

        return response.data.choices[0].message.content;
    }
}

module.exports = LlmProvider;
