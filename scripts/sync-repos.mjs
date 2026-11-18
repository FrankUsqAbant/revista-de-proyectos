#!/usr/bin/env node
/**
 * Sincroniza el catálogo con los repositorios públicos de FrankUsqAbant.
 *
 * - Lee la lista de repositorios públicos (sin forks ni el repositorio de perfil), con tope de MAX.
 * - Busca una captura para cada uno (preview.* o la primera imagen real del README, sin insignias)
 *   y la guarda en caché; si una captura guardada ya no existe o es una insignia, la busca de nuevo.
 * - Escribe docs/data/proyectos.json: { actualizado, proyectos, imagenes }.
 * - Los repositorios que ya no existen salen del catálogo y de la caché.
 *
 * Uso: node scripts/sync-repos.mjs   (GITHUB_TOKEN opcional: sube el límite de la API)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const SITE = 'https://frankusqabant.github.io/revista-de-proyectos/';
const AUTOR = 'Frank Abanto';
const NOMBRE_SITIO = 'Revista de proyectos · Frank Abanto';

const USUARIO = 'FrankUsqAbant';
const MAX = 100;
const RUTA = 'docs/data/proyectos.json';
const token = process.env.GITHUB_TOKEN || '';
const cabeceras = { 'User-Agent': 'catalogo-revista-sync', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

// Insignias, contadores y adornos de README: no son capturas del proyecto
const INSIGNIA = /shields\.io|badgen|badge|typing-svg|capsule-render|skillicons|komarev|github-readme-stats|\.svg(\?|$)/i;
const esCaptura = (url) => !INSIGNIA.test(url);

async function pedir(url, formato) {
  const r = await fetch(url, { headers: { ...cabeceras, ...(formato === 'json' ? { Accept: 'application/vnd.github+json' } : {}) } });
  if (!r.ok) {
    if (formato === 'json') throw new Error(`HTTP ${r.status} en ${url}`);
    return null;
  }
  return formato === 'json' ? r.json() : r.text();
}

async function existe(url) {
  try {
    const r = await fetch(url, { method: 'HEAD', headers: cabeceras, redirect: 'follow' });
    return r.ok;
  } catch {
    return false;
  }
}

async function buscarCaptura(repo, rama) {
  for (const b of [...new Set([rama, 'main', 'master'].filter(Boolean))]) {
    for (const ruta of ['preview.webp', 'preview.png', 'docs/preview.webp', 'public/preview.webp', 'public/preview.png']) {
      const url = `https://raw.githubusercontent.com/${USUARIO}/${repo}/${b}/${ruta}`;
      const cuerpo = await pedir(url, 'texto');
      if (cuerpo && cuerpo.length > 100) return url;
    }
    const readme = await pedir(`https://raw.githubusercontent.com/${USUARIO}/${repo}/${b}/README.md`, 'texto');
    if (!readme) continue;
    // Imágenes del README en orden de aparición (Markdown y <img>); la primera real y existente gana
    for (const m of readme.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)|<img[^>]+src=["']([^"']+)["']/gi)) {
      const origen = m[1] || m[2];
      if (!/\.(webp|png|jpe?g|gif)(\?|$)/i.test(origen) && !/githubusercontent\.com|\/raw\//.test(origen)) continue;
      const url = /^https?:/i.test(origen) ? origen : `https://raw.githubusercontent.com/${USUARIO}/${repo}/${b}/${origen.replace(/^\.?\//, '')}`;
      if (esCaptura(url) && (await existe(url))) return url;
    }
  }
  return null;
}

const previo = (() => { try { return JSON.parse(readFileSync(RUTA, 'utf8')); } catch { return { imagenes: {} }; } })();

console.log(`[Sync] Consultando repositorios públicos de @${USUARIO}...`);
const repos = await pedir(`https://api.github.com/users/${USUARIO}/repos?per_page=100&sort=pushed`, 'json');
if (!Array.isArray(repos) || repos.length === 0) throw new Error('La API no devolvió repositorios: se conserva el catálogo anterior.');

const validos = repos.filter((r) => !r.fork && r.name !== USUARIO && r.name !== 'revista-de-proyectos').slice(0, MAX);
const imagenes = {};
const proyectos = [];

for (const r of validos) {
  let img = previo.imagenes?.[r.name] || null;
  if (img && (!esCaptura(img) || !(await existe(img)))) {
    console.log(`[Sync] La captura guardada de ${r.name} no sirve (no existe o es una insignia); se busca otra.`);
    img = null;
  }
  if (!img) {
    console.log(`[Sync] Buscando captura de ${r.name}...`);
    img = await buscarCaptura(r.name, r.default_branch);
  }
  if (img) imagenes[r.name] = img;

  const esSitioDeUsuario = r.name.toLowerCase() === `${USUARIO.toLowerCase()}.github.io`;
  const tags = r.topics?.length
    ? r.topics.slice(0, 5).map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    : [r.language || 'Full-Stack'];

  proyectos.push({
    name: r.name,
    description: r.description || `${r.name}: proyecto de código abierto.`,
    githubUrl: r.html_url,
    liveUrl: r.homepage || (r.has_pages ? (esSitioDeUsuario ? `https://${USUARIO.toLowerCase()}.github.io/` : `https://${USUARIO.toLowerCase()}.github.io/${r.name}/`) : null),
    language: r.language || 'Code',
    stars: r.stargazers_count || 0,
    tags,
    updatedAt: (r.pushed_at || r.updated_at) ? (r.pushed_at || r.updated_at).split('T')[0] : '',
    createdAt: r.created_at ? r.created_at.split('T')[0] : '',
  });
}

// ── Contenido que ven los buscadores y las redes sin ejecutar JavaScript ──
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const titulo = (p) => (p.description && p.description.includes('—') ? p.description.split('—')[0].trim() : p.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()));
const descripcion = (p) => (p.description && p.description.includes('—') ? p.description.split('—').slice(1).join('—').trim() : p.description || '');

function bloqueSeo(lista) {
  const grafo = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': SITE + '#sitio', url: SITE, name: NOMBRE_SITIO, inLanguage: 'es', description: 'Revista interactiva con los proyectos de diseño, web y automatización de ' + AUTOR + '.', author: { '@id': SITE + '#autor' } },
      { '@type': 'Person', '@id': SITE + '#autor', name: AUTOR, url: 'https://github.com/' + USUARIO, sameAs: ['https://github.com/' + USUARIO], jobTitle: 'Desarrollador web y automatizaciones' },
      {
        '@type': 'CollectionPage', '@id': SITE + '#coleccion', url: SITE, name: 'Mis proyectos', isPartOf: { '@id': SITE + '#sitio' }, inLanguage: 'es',
        mainEntity: {
          '@type': 'ItemList', numberOfItems: lista.length,
          itemListElement: lista.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: titulo(p), url: SITE + '#' + encodeURIComponent(p.name), description: descripcion(p) })),
        },
      },
    ],
  };
  return '<script type="application/ld+json">' + JSON.stringify(grafo).replace(/</g, '\\u003c') + '</script>';
}

function bloqueSinJs(lista) {
  const items = lista.map((p) => {
    const enlaces = [p.liveUrl ? `<a href="${esc(p.liveUrl)}">Ver en vivo</a>` : '', `<a href="${esc(p.githubUrl)}">Código</a>`].filter(Boolean).join(' · ');
    return `      <li><strong>${esc(titulo(p))}</strong>: ${esc(descripcion(p))} (${enlaces})</li>`;
  }).join('\n');
  return `<noscript>
    <section style="max-width:42rem;margin:2rem auto;padding:0 1rem;font-family:system-ui,sans-serif;line-height:1.6">
      <h1>Mis proyectos</h1>
      <p>Esta revista necesita JavaScript para pasar las páginas. Estos son los proyectos:</p>
      <ul>
${items}
      </ul>
    </section>
  </noscript>`;
}

function reemplazarEntreMarcas(texto, inicio, fin, nuevo) {
  const a = texto.indexOf(inicio);
  const b = texto.indexOf(fin);
  if (a < 0 || b < a) return texto;
  return texto.slice(0, a + inicio.length) + '\n  ' + nuevo + '\n  ' + texto.slice(b);
}

try {
  const original = readFileSync('docs/index.html', 'utf8').split('\r\n').join('\n');
  let nuevo = reemplazarEntreMarcas(original, '<!-- SEO:INICIO -->', '<!-- SEO:FIN -->', bloqueSeo(proyectos));
  nuevo = reemplazarEntreMarcas(nuevo, '<!-- PROYECTOS:INICIO -->', '<!-- PROYECTOS:FIN -->', bloqueSinJs(proyectos));
  if (nuevo !== original) { writeFileSync('docs/index.html', nuevo); console.log('[Sync] index.html: datos estructurados y lista sin JavaScript actualizados.'); }

  const ultima = proyectos.map((p) => p.updatedAt).filter(Boolean).sort().pop() || new Date().toISOString().split('T')[0];
  const mapa = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE}</loc>\n    <lastmod>${ultima}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`;
  let mapaAnterior = '';
  try { mapaAnterior = readFileSync('docs/sitemap.xml', 'utf8').split('\r\n').join('\n'); } catch { /* primera vez */ }
  if (mapa !== mapaAnterior) { writeFileSync('docs/sitemap.xml', mapa); console.log('[Sync] sitemap.xml actualizado.'); }
} catch (e) {
  console.warn('[Sync] No se pudo actualizar index.html o sitemap.xml:', e.message);
}

mkdirSync('docs/data', { recursive: true });
const salida = JSON.stringify({ actualizado: new Date().toISOString().split('T')[0], proyectos, imagenes }, null, 2) + '\n';
// Solo reescribe si cambió algo además de la fecha (así el historial no se llena de commits vacíos)
const sinFecha = (s) => s.replace(/"actualizado": "[^"]*"/, '');
let anterior = '';
try { anterior = readFileSync(RUTA, 'utf8'); } catch { /* primera vez */ }
if (sinFecha(anterior) === sinFecha(salida)) {
  console.log(`[Sync] Sin cambios: ${proyectos.length} proyectos.`);
} else {
  writeFileSync(RUTA, salida);
  console.log(`[Sync] Catálogo actualizado: ${proyectos.length} proyectos, ${Object.keys(imagenes).length} con captura.`);
}
