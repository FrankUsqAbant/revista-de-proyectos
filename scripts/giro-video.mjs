// Graba en video el paso portada → página 1 (y uno normal) para ver saltos cuadro a cuadro.
// Variantes: actual | tapa-blanda (cover sin rigidez) | tapa-ligera (sin grano ni mezcla).
import { chromium, devices } from 'playwright';
import { mkdirSync, renameSync } from 'node:fs';

const base = 'http://localhost:8080/';
const out = 'capturas-ux/video';
mkdirSync(out, { recursive: true });
const variantes = {
  actual: '',


};
const pantallas = { escritorio: { viewport: { width: 1366, height: 768 } }, movil: { ...devices['iPhone 13'] } };

const browser = await chromium.launch();
for (const [pn, ctxOpts] of Object.entries(pantallas)) {
  for (const [vn, js] of Object.entries(variantes)) {
    const ctx = await browser.newContext({ ...ctxOpts, recordVideo: { dir: out, size: ctxOpts.viewport || { width: 390, height: 664 } } });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    if (js) await page.evaluate(js);
    const marcas = await page.evaluate(async () => {
      const deltas = []; let last = performance.now(); const t0 = last;
      await new Promise((res) => { const f = (now) => { deltas.push(Math.round(now - last)); last = now; if (now - t0 < 1400) requestAnimationFrame(f); else res(); }; libro.flipNext(); requestAnimationFrame(f); });
      return { max: Math.max(...deltas), lentos: deltas.filter((d) => d > 50).length };
    });
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1500);
    // Volver a la portada: dos páginas atrás y foto final de la portada cerrada
    for (let k = 0; k < 2; k++) { await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(1300); }
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${out}/${pn}-vuelta.png` });
    const v = page.video();
    await ctx.close();
    renameSync(await v.path(), `${out}/${pn}-${vn}.webm`);
    console.log('VIDEO', pn, vn, JSON.stringify(marcas));
  }
}
await browser.close();
