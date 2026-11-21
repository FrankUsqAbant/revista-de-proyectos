/* Revista de proyectos — páginas con StPageFlip (docs/vendor, MIT).
   Datos: data/proyectos.json (lo escribe scripts/sync-repos.mjs). */
'use strict';

const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dos = (n) => String(n).padStart(2, '0');
const fecha = (d) => (d ? new Date(d + 'T00:00:00').toLocaleDateString('es', { month: 'short', year: 'numeric' }) : '');

// «Título — descripción» en GitHub: el título va grande y el resto como texto
function partes(p) {
  let titulo = p.name.replace(/[-_]/g, ' ').replace(/(^|\s)\w/g, (l) => l.toUpperCase());
  let texto = p.description || '';
  if (texto.includes('—')) [titulo, texto] = [texto.split('—')[0].trim(), texto.split('—').slice(1).join('—').trim()];
  texto = texto.replace(/([^.])\.\.$/, '$1.');
  return { titulo, texto: texto.charAt(0).toUpperCase() + texto.slice(1) };
}

// La última palabra del título en cursiva de color
function tituloEditorial(t) {
  const w = t.trim().split(/\s+/);
  return w.length < 2 ? esc(t) : `${esc(w.slice(0, -1).join(' '))} <em>${esc(w.at(-1))}</em>`;
}

// Tono de color propio de cada proyecto, sacado de su nombre
const tono = (nombre) => [...nombre].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

// Curvas de nivel (cerros de Cajamarca): anillos ondulados alrededor de dos cumbres
function curvasDeNivel() {
  const cumbres = [{ x: 140, y: 250, r: 22 }, { x: 330, y: 330, r: 16 }];
  let d = '';
  cumbres.forEach((c, k) => {
    for (let i = 1; i <= 11; i++) {
      const pts = [];
      for (let a = 0; a <= 64; a++) {
        const t = (a / 64) * Math.PI * 2;
        const r = c.r * i * (1 + 0.16 * Math.sin(3 * t + i * 0.7 + k) + 0.08 * Math.cos(5 * t - i * 0.4));
        pts.push(`${(c.x + r * Math.cos(t)).toFixed(1)},${(c.y + r * 0.72 * Math.sin(t)).toFixed(1)}`);
      }
      d += `M${pts.join('L')}Z`;
    }
  });
  return `<svg class="curvas" viewBox="0 0 450 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="${d}"/></svg>`;
}

const portada = (total) => `
  <div class="pagina tapa" data-density="hard">
    <div class="tapa__luz" aria-hidden="true"></div>${curvasDeNivel()}
    <p class="tapa__linea"><span>Frank Abanto</span><span>Nº ${total} · ${new Date().toLocaleDateString('es', { month: 'long', year: 'numeric' })}</span></p>
    <h1 class="tapa__titulo">Proyectos</h1>
    <p class="tapa__pie">Diseño, web y automatización<br>Cajamarca, Perú</p>
  </div>`;

const contratapa = () => `
  <div class="pagina tapa tapa--atras" data-density="hard">
    <div class="tapa__luz" aria-hidden="true"></div>${curvasDeNivel()}
    <p class="tapa__pie">Frank Abanto<br><a href="https://github.com/FrankUsqAbant" target="_blank" rel="noopener noreferrer">github.com/FrankUsqAbant</a></p>
  </div>`;

// Página izquierda: la captura del proyecto (el src real se pone al acercarse, ver cargarCercanas)
const paginaImagen = (p, n, img) => `
  <div class="pagina hoja hoja--imagen" style="--tono:${tono(p.name)}">
    <span class="folio">${dos(n)}</span>
    ${img
      ? `<figure class="captura"><div class="captura__barra" aria-hidden="true"><i></i><i></i><i></i></div><img data-src="${esc(img)}" alt="Captura de ${esc(p.name)}" decoding="async"></figure>`
      : `<div class="captura captura--vacia"><span>${esc(partes(p).titulo)}</span></div>`}
  </div>`;

// Página derecha: la ficha
function paginaFicha(p, n, total) {
  const { titulo, texto } = partes(p);
  return `
  <div class="pagina hoja hoja--ficha" style="--tono:${tono(p.name)}">
    <p class="ficha__cabeza"><span>Proyecto · Nº ${dos(n)}</span><span>${fecha(p.updatedAt)}</span></p>
    <h2 class="ficha__titulo">${tituloEditorial(titulo)}</h2>
    <p class="ficha__texto">${esc(texto)}</p>
    <p class="ficha__tags">${(p.tags || []).map((t) => `<span>${esc(t)}</span>`).join('')}</p>
    <p class="ficha__enlaces">
      ${p.liveUrl ? `<a href="${esc(p.liveUrl)}" target="_blank" rel="noopener noreferrer">Ver en vivo ↗</a>` : ''}
      <a href="${esc(p.githubUrl)}" target="_blank" rel="noopener noreferrer">Código en GitHub ↗</a>
    </p>
    <span class="folio">${dos(n)} / ${dos(total)}</span>
  </div>`;
}

const FRASES = [
  'Ya no discutas qué es un buen hombre: sé uno.',
  'Lo que se interpone en el camino se convierte en el camino.',
  'Si algo te aflige, no es la cosa, sino tu juicio sobre ella; y está en tu mano cambiarlo ahora.',
  'Lo que no beneficia a la colmena, tampoco beneficia a la abeja.',
  'La mejor venganza es no parecerte a quien te hizo daño.',
  'Haz cada cosa como si fuera la última de tu vida.',
];

const paginaFrases = () => `
  <div class="pagina hoja hoja--frases">
    <span class="ficha__cabeza"><span>Marco Aurelio · Meditaciones</span></span>
    <div class="frases">${FRASES.map((f, i) => `<blockquote class="${i ? '' : 'on'}"><p>${esc(f)}</p></blockquote>`).join('')}</div>
    <span class="folio">Traducción libre</span>
  </div>`;

const paginaGracias = () => `
  <div class="pagina hoja hoja--gracias">
    <h2 class="ficha__titulo">Gracias por <em>leer</em></h2>
    <p class="ficha__texto">Aquí se irán sumando nuevos proyectos, solos: la revista se actualiza cada 30 minutos. Todo el código está abierto en GitHub.</p>
  </div>`;

let libro, proyectos = [];

// Pone el src a las capturas de las 6 páginas más cercanas: llegan cargadas antes de girar
function cargarCercanas(i) {
  document.querySelectorAll('.pagina img[data-src]').forEach((img) => {
    const pos = Number(img.closest('.pagina').dataset.i);
    if (Math.abs(pos - i) <= 6) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
  });
}

// Página ↔ dirección: #nombre-del-repo abre ese proyecto
const indiceDe = (nombre) => { const k = proyectos.findIndex((p) => p.name === nombre); return k < 0 ? 0 : 1 + 2 * k; };
const nombreDe = (i) => (i >= 1 && i <= 2 * proyectos.length ? proyectos[Math.floor((i - 1) / 2)].name : '');

function alCambiar(i) {
  cargarCercanas(i);
  const nombre = nombreDe(i);
  history.replaceState(null, '', nombre ? '#' + encodeURIComponent(nombre) : location.pathname);
  document.getElementById('lector').textContent = nombre ? `Proyecto ${Math.floor((i - 1) / 2) + 1} de ${proyectos.length}: ${nombre}` : i === 0 ? 'Portada' : 'Final de la revista';
}

async function iniciar() {
  const datos = await (await fetch('data/proyectos.json', { cache: 'no-cache' })).json();
  proyectos = datos.proyectos || [];
  const imgs = datos.imagenes || {};
  const total = proyectos.length;

  const html = [portada(total)];
  proyectos.forEach((p, k) => html.push(paginaImagen(p, k + 1, imgs[p.name]), paginaFicha(p, k + 1, total)));
  html.push(paginaFrases(), paginaGracias(), contratapa());

  const cont = document.getElementById('revista');
  cont.innerHTML = html.join('');
  const paginas = cont.querySelectorAll('.pagina');
  paginas.forEach((el, i) => { el.dataset.i = i; });

  const inicio = indiceDe(decodeURIComponent(location.hash.slice(1)));
  cargarCercanas(inicio);

  libro = new St.PageFlip(cont, {
    width: 450, height: 600, size: 'stretch',
    minWidth: 200, maxWidth: 900, minHeight: 260, maxHeight: 1200,
    showCover: true, usePortrait: true, mobileScrollSupport: false,
    flippingTime: sinMovimiento ? 1 : 900, maxShadowOpacity: 0.45,
    startPage: inicio, autoSize: true,
  });
  libro.loadFromHTML(paginas);
  libro.on('flip', (e) => alCambiar(e.data));
  alCambiar(inicio);

  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') libro.flipNext();
    else if (e.key === 'ArrowLeft') libro.flipPrev();
    else if (e.key === 'Home') libro.turnToPage(0);
  });
  addEventListener('hashchange', () => libro.turnToPage(indiceDe(decodeURIComponent(location.hash.slice(1)))));

  // Frases: una cada 7 s, solo si la pestaña está a la vista
  const frases = cont.querySelectorAll('.frases blockquote');
  let f = 0;
  if (!sinMovimiento) setInterval(() => { if (document.hidden) return; frases[f].classList.remove('on'); f = (f + 1) % frases.length; frases[f].classList.add('on'); }, 7000);

  // Si una captura no carga, la página muestra el nombre del proyecto
  cont.addEventListener('error', (e) => {
    const fig = e.target.closest?.('.captura');
    if (fig) fig.outerHTML = `<div class="captura captura--vacia"><span>${esc(e.target.alt.replace('Captura de ', ''))}</span></div>`;
  }, true);

  // En pantallas táctiles, una pista breve la primera vez
  if (matchMedia('(pointer: coarse)').matches) {
    const pista = document.getElementById('pista');
    pista.classList.add('on');
    setTimeout(() => pista.classList.remove('on'), 5000);
  }
}

// La luz de la tapa sigue al cursor (solo ratón y sin movimiento reducido)
if (!sinMovimiento && matchMedia('(pointer: fine)').matches) {
  addEventListener('pointermove', (e) => {
    document.documentElement.style.setProperty('--lx', (e.clientX / innerWidth * 100).toFixed(1) + '%');
    document.documentElement.style.setProperty('--ly', (e.clientY / innerHeight * 100).toFixed(1) + '%');
  }, { passive: true });
}

// Tema: sigue al sistema; el botón lo cambia mientras la página está abierta (sin guardar nada)
const sistema = matchMedia('(prefers-color-scheme: dark)');
const ponerTema = (t) => document.documentElement.setAttribute('data-theme', t);
ponerTema(sistema.matches ? 'dark' : 'light');
let temaManual = false;
sistema.addEventListener('change', (e) => { if (!temaManual) ponerTema(e.matches ? 'dark' : 'light'); });
document.getElementById('tema').addEventListener('click', () => {
  temaManual = true;
  ponerTema(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
});

iniciar().catch(() => {
  document.getElementById('revista').innerHTML = '<p class="aviso" role="alert">No se pudo cargar el catálogo. Recarga la página en unos minutos.</p>';
});
