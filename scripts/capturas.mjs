// Capturas de revisión en GitHub Actions (no carga el portátil). Sirve docs/ en :8080.
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = 'http://localhost:8080/';
const out = 'capturas-ux';
mkdirSync(out, { recursive: true });

const vistas = [
  { n: 'movil', ctx: { ...devices['iPhone 13'] } },
  { n: 'pequena', ctx: { viewport: { width: 800, height: 600 } } },
  { n: 'escritorio', ctx: { viewport: { width: 1366, height: 768 } } },
];

const browser = await chromium.launch();
for (const v of vistas) {
  const page = await (await browser.newContext(v.ctx)).newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/${v.n}-portada.png` });
  await page.goto(base + '#LeerEsPensar', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${out}/${v.n}-ficha.png` });
  // ¿Caben los botones sin desplazar la ficha?
  const medida = await page.evaluate(() => {
    const rc = document.querySelector('.spread.active .right-content');
    const b = document.querySelector('.spread.active .right-content__actions');
    if (!rc || !b) return 'sin ficha';
    const r = rc.getBoundingClientRect(), a = b.getBoundingClientRect();
    return { botonesVisibles: a.bottom <= r.bottom + 1, sobra: Math.round(rc.scrollHeight - rc.clientHeight) };
  });
  console.log(v.n, JSON.stringify(medida), errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores');
}
await browser.close();
