const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas>');
  const info = await page.evaluate(() => {
    const c = document.getElementById('c');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return { webgl: false };
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    return { webgl: true, version: gl.getParameter(gl.VERSION), renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'n/a' };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
