const axios = require('axios');
const fs = require('fs');
const { BASE_URL, waitForReady } = require('./utils/testHelpers');

async function testBlockInfo() {
    await waitForReady();
    console.log('\n🔍 Testing GET /get-block-info...');
    try {
        const startTime = Date.now();
        const res = await axios.get(`${BASE_URL}/get-block-info`, { timeout: 120000 });
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        if (res.data.info && res.data.screenshot) {
            console.log('✅ PASS: Block info received.');
            return { Endpoint: 'GET /get-block-info', Status: '✅ PASS', Duration: `${duration}s`, Details: 'JSON + Image OK' };
        } else {
            return { Endpoint: 'GET /get-block-info', Status: '❌ FAIL', Duration: `${duration}s`, Details: 'Data missing' };
        }
    } catch (err) {
        return { 
            Endpoint: 'GET /get-block-info', 
            Status: '❌ FAIL', 
            Duration: '-', 
            Details: err.response ? JSON.stringify(err.response.data) : err.message 
        };
    }
}

if (require.main === module) {
    testBlockInfo().then(res => console.table([res]));
}

module.exports = testBlockInfo;
