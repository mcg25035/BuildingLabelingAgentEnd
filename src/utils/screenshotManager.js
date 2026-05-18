const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')
const { Logger, sleep } = require('./common')

const SCREENSHOT_DIR = path.join(__dirname, '../../screenshots')

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR)
}

async function takeScreenshot(viewerPort) {
    Logger.info('Starting Puppeteer for screenshot...')
    let browser
    try {
        browser = await puppeteer.launch({ 
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--use-gl=angle',
                '--use-angle=swiftshader',
                '--enable-unsafe-swiftshader',
                '--ozone-platform=headless'
            ],
            headless: 'shell',
            env: { ...process.env, DISPLAY: '' }
        })
        const page = await browser.newPage()
        await page.setViewport({ width: 1280, height: 720 })
        await page.goto(`http://localhost:${viewerPort}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
        
        await sleep(2000)
        
        try {
            await page.waitForSelector('canvas', { timeout: 10000 })
        } catch (e) {
            Logger.warn('Canvas selector timeout, proceeding anyway.')
        }
        await sleep(500)

        const screenshotName = `screenshot-${Date.now()}.jpg`
        const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName)
        
        // Use JPEG with 60% quality to drastically reduce base64 size (prevents API 403 payload limits)
        await page.screenshot({ path: screenshotPath, type: 'jpeg', quality: 60 })
        Logger.info(`Screenshot saved: ${screenshotName}`)
        return { name: screenshotName, path: screenshotPath }
    } finally {
        if (browser) await browser.close()
    }
}

module.exports = { takeScreenshot }
