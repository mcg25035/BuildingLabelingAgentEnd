const axios = require('axios');
require('dotenv').config();

const BASE_URL = `http://localhost:${process.env.HTTP_PORT || 3000}`;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForReady(maxRetries = 3, interval = 2000) {
    console.log(`⏳ Waiting for bot to be ready (up to ${maxRetries * interval / 1000}s)...`);
    for (let i = 0; i < maxRetries; i++) {
        try {
            const res = await axios.get(`${BASE_URL}/status`);
            if (res.data.ready) {
                console.log('✅ Bot is ready!');
                return true;
            }
            if (res.data.error) {
                console.error('❌ Bot reported error:', res.data.error);
                process.exit(1);
            }
        } catch (e) {
            // Server might not be up yet
        }
        await sleep(interval);
    }
    throw new Error('❌ Timeout waiting for bot to be ready');
}

module.exports = { BASE_URL, waitForReady, sleep };
