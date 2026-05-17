const testTp = require('./tp.test');
const testBlockInfo = require('./blockInfo.test');

async function runAll() {
    console.log('🏁 === STARTING TEST SUITE ===');
    
    const results = [];
    
    try {
        const resTp = await testTp();
        if (resTp) results.push(resTp);
        
        const resInfo = await testBlockInfo();
        if (resInfo) results.push(resInfo);
    } catch (e) {
        console.error('💥 Unexpected error during test sequence:', e);
    }
    
    console.log('\n📊 === FINAL TEST REPORT ===');
    if (results.length > 0) {
        console.table(results);
    } else {
        console.log('❌ No test results collected due to early failure.');
    }
    
    const failed = results.length === 0 || results.some(r => !r || r.Status.includes('❌'));
    if (failed) {
        console.log('\n⚠️ Some tests failed. Check the table above for details.');
        process.exit(1);
    } else {
        console.log('\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨');
    }
}

runAll().catch(err => {
    console.error('💥 Test suite crashed:', err);
    process.exit(1);
});
