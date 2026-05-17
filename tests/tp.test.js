const axios = require('axios');
const fs = require('fs');
const { BASE_URL, waitForReady } = require('./utils/testHelpers');

async function testTp() {
    await waitForReady();
    console.log('\n🚀 Testing PUT /tp...');
    try {
        const startTime = Date.now();
        const res = await axios.put(`${BASE_URL}/tp`, {
            relative_x: 2,
            relative_z: 2
        }, { timeout: 120000 });
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        if (res.data.image_path && fs.existsSync(res.data.image_path)) {
            console.log('✅ PASS: Screenshot created.');
            return { Endpoint: 'PUT /tp', Status: '✅ PASS', Duration: `${duration}s`, Details: 'Screenshot OK' };
        } else {
            return { Endpoint: 'PUT /tp', Status: '❌ FAIL', Duration: `${duration}s`, Details: 'Screenshot missing' };
        }
    } catch (err) {
        return { 
            Endpoint: 'PUT /tp', 
            Status: '❌ FAIL', 
            Duration: '-', 
            Details: err.response ? JSON.stringify(err.response.data) : err.message 
        };
    }
}

if (require.main === module) {
    testTp().then(res => console.table([res]));
}

module.exports = testTp;
