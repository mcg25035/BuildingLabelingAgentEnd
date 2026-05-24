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
        
        // Wait for network to be idle to ensure assets (textures, etc.) are loaded
        // Using networkidle2 is more robust for pages with persistent WebSocket connections
        Logger.info(`Navigating to http://localhost:${viewerPort}...`)
        await page.goto(`http://localhost:${viewerPort}`, { waitUntil: 'networkidle2', timeout: 60000 })
        Logger.info('Navigation complete.')
        
        // Wait for canvas to be present
        try {
            Logger.info('Waiting for canvas selector...')
            await page.waitForSelector('canvas', { timeout: 15000 })
            Logger.info('Canvas selector found.')
        } catch (e) {
            Logger.warn('Canvas selector timeout, proceeding anyway.')
        }

        // Wait for chunks to load using pixel-based stability detection
        // Since window.viewer is not exposed in production builds
        let isReady = false
        let stableTicks = 0
        let lastFrameHash = null
        
        Logger.info('Starting pixel-based stability polling...')
        for (let i = 0; i < 30; i++) {
            const currentFrame = await page.evaluate(() => {
                const canvas = document.querySelector('canvas')
                if (!canvas) return null
                
                // Take a small sample of the canvas to check for changes
                // We use a small scale to make hashing fast
                const tempCanvas = document.createElement('canvas')
                tempCanvas.width = 64
                tempCanvas.height = 36
                const ctx = tempCanvas.getContext('2d')
                ctx.drawImage(canvas, 0, 0, 64, 36)
                return tempCanvas.toDataURL('image/jpeg', 0.1)
            })

            if (currentFrame) {
                // If it's the same as the last frame, the world is likely loaded and stable
                if (lastFrameHash && currentFrame === lastFrameHash) {
                    stableTicks++
                    Logger.info(`Retry ${i}: Frame stable. StableTicks=${stableTicks}`)
                } else {
                    stableTicks = 0
                    Logger.info(`Retry ${i}: Frame changed (loading or animating).`)
                }
                lastFrameHash = currentFrame

                // We need at least some ticks of stability
                // For Minecraft, textures and chunks take time, but once stable, it's usually done
                if (stableTicks >= 3) {
                    isReady = true
                    Logger.info(`Viewer state stabilized after ${i} retries.`)
                    break
                }
            } else {
                Logger.warn(`Retry ${i}: Canvas not found.`)
            }
            await sleep(1000)
        }
        
        if (!isReady) {
            Logger.warn('Viewer might not be fully loaded (no chunks detected), taking screenshot anyway.')
        }

        // Additional small sleep for rendering stability
        await sleep(1000)

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
