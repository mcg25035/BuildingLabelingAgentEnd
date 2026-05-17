
const puppeteer = require('puppeteer');

(async () => {
const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--use-gl=desktop',        // 嘗試使用桌面級生產環境的 GL (GLX)
    '--disable-gpu-sandbox',
  ]
});

  const page = await browser.newPage();
  await page.goto('https://browserleaks.com/webgl', { waitUntil: 'networkidle2' });

  // Verify or take a screenshot of your OpenGL/WebGL content
  await page.screenshot({ path: 'webgl_test.png' });

  await browser.close();
})();
