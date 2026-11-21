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
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${v.n}-1-portada.png` });

  // Pasar dos veces: foto a mitad del giro y al terminar
  for (const paso of [2, 3]) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${out}/${v.n}-${paso}-giro.png` });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}/${v.n}-${paso}-final.png` });
  }

  // Enlace directo: ¿abre el proyecto y sus capturas cercanas están cargadas?
  await page.goto(base + '#LeerEsPensar', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${v.n}-4-enlace.png` });
  const datos = await page.evaluate(() => ({
    hash: location.hash,
    libro: document.querySelector('.stf__parent') ? 'ok' : 'sin libro',
    imgsCargadas: [...document.querySelectorAll('.pagina img')].filter((i) => i.complete && i.naturalWidth).length,
  }));
  console.log(v.n, JSON.stringify(datos), errores.length ? 'ERRORES: ' + errores.join(' | ') : 'sin errores');
}
// Imagen para redes (og.jpg 1200×630): la portada sobre la mesa, tema oscuro
const og = await (await browser.newContext({ viewport: { width: 1200, height: 630 }, colorScheme: 'dark' })).newPage();
await og.goto(base, { waitUntil: 'networkidle' });
await og.waitForTimeout(1500);
await og.addStyleTag({ content: '.tema, .pista { display: none !important; }' });
await og.screenshot({ path: `${out}/og.jpg`, type: 'jpeg', quality: 86 });
await browser.close();
