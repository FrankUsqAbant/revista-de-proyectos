/* ═══════════════════════════════════════════
   REVISTA DE PROYECTOS — Motor
   Open-spread magazine with real README screenshots
   ═══════════════════════════════════════════ */

// Los datos (proyectos y capturas) viven en data/proyectos.json y los actualiza scripts/sync-repos.mjs cada semana.
let readmeImages = {};
let miniaturas = {};
let projects = [];

const langIcons = {
  JavaScript: '⚡', TypeScript: '🔷', Python: '🐍', CSS: '🎨',
  HTML: '🌐', Astro: '🚀', Vue: '💚', Nunjucks: '⚙️', Code: '📦',
};

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
}

// Título legible de un proyecto: lo anterior a «—» en la descripción, o el nombre del repositorio
function tituloDe(p) {
  if (p.description && p.description.includes('—')) return p.description.split('—')[0].trim();
  return p.name.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

// Título editorial: la última palabra en cursiva de color (si hay más de una)
function tituloEditorial(t) {
  const palabras = String(t).trim().split(/\s+/);
  if (palabras.length < 2) return esc(t);
  const ultima = palabras.pop();
  return esc(palabras.join(' ')) + '<br><em>' + esc(ultima) + '</em>';
}

function esc(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function getImageForProject(name) {
  return readmeImages[name] || null;
}

// ═══════════════════════════════════════════
// MAGAZINE CONTROLLER
// ═══════════════════════════════════════════
class Magazine {
  constructor() {
    this.state = 'cover'; // 'cover', 'spread', 'backcover'
    this.currentProject = 0;
    this.isAnimating = false;
    this.touchStartX = 0;
    this.touchStartY = 0;

    this.scene = document.getElementById('magazine-scene');
    this.magazine = document.getElementById('magazine');
    this.coverPage = document.getElementById('cover-page');
    this.spreadContainer = document.getElementById('spread-container');
    this.backcoverPage = document.getElementById('backcover-page');
    this.prevSide = document.getElementById('side-prev');
    this.nextSide = document.getElementById('side-next');
    this.counter = document.getElementById('nav-counter');

    this.init();
  }

  init() {
    this.renderSpreadDirect(0);
    const coverBack = document.getElementById('cover-back');
    if (coverBack) {
      coverBack.innerHTML = this.renderLeftPageHTML(projects[0], 1);
    }
    this.updateView();
    this.bindEvents();
    this.hideLoader();
  }

  hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
      }, 300);
    }
  }

  getCoverFrontHTML(esHoja = false) {
    // Láminas: los primeros proyectos con captura (sin la propia revista)
    const laminas = projects
      .filter((p) => readmeImages[p.name] && p.liveUrl && p.name !== 'revista-de-proyectos' && !p.name.endsWith('.github.io'))
      .slice(0, 4)
      .map((p) => `<div class="cv-plate"><img src="${(miniaturas[p.name] && miniaturas[p.name].url) || readmeImages[p.name]}" alt=""><span>${esc(tituloDe(p))}</span></div>`)
      .join('');
    // Lenguajes más usados
    const conteo = {};
    projects.forEach((p) => { if (p.language && p.language !== 'Code') conteo[p.language] = (conteo[p.language] || 0) + 1; });
    const lenguajes = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0]);
    const anio = new Date().getFullYear();
    return `
      <div class="page-inner">
        <div class="cv-meta"><span>Edición ${anio}</span><span>${projects.length} proyectos</span></div>
        <div class="cv-rule"></div>
        <h1 class="cover__title">Mis <em>proyectos</em></h1>
        <p class="cover__subtitle">Soy <strong>Frank Abanto</strong>. Diseño y programo webs y automatizaciones para negocios reales. Aquí está lo que he construido, uno por página.</p>
        <div class="cv-plates">${laminas}</div>
        <div class="cv-pie">
          <div class="cv-chips">${lenguajes.map((l) => `<span>${l}</span>`).join('')}</div>
          <button class="cover__cta" ${esHoja ? 'aria-hidden="true" tabindex="-1"' : 'id="cta-open"'}>Abrir la revista <span aria-hidden="true">→</span></button>
        </div>
      </div>
    `;
  }

  // ── Apertura suave de la portada con desplazamiento físico y pase de hoja 3D ──
  openCover() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // Aseguramos que la doble página del Proyecto 1 esté lista debajo
    this.renderSpreadDirect(0);
    this.spreadContainer.style.display = '';

    // Ocultar la portada estática
    this.coverPage.style.display = 'none';

    // Desplazamiento cinemático de la revista sobre la mesa
    this.scene.classList.remove('is-cover');
    this.scene.classList.add('is-spread');

    if (this.reducedMotion()) {
      this.state = 'spread';
      this.currentProject = 0;
      this.updateNav();
      this.isAnimating = false;
      return;
    }

    // Crear la hoja voladora 3D idéntica a la que pasa las páginas (mag-leaf-flipper)
    const flipper = document.createElement('div');
    flipper.className = 'mag-leaf-flipper flip-forward';
    flipper.innerHTML = `
      <div class="leaf-face leaf-front leaf-front--cover">
        ${this.getCoverFrontHTML(true)}
        <div class="leaf-shadow leaf-shadow-front"></div>
      </div>
      <div class="leaf-face leaf-back">
        ${this.renderLeftPageHTML(projects[0], 1)}
        <div class="leaf-shadow leaf-shadow-back"></div>
      </div>
    `;

    this.magazine.appendChild(flipper);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        flipper.classList.add('is-flipping');
      });
    });

    setTimeout(() => {
      this.state = 'spread';
      this.currentProject = 0;
      this.soltarHoja(flipper);
      this.updateNav();
      this.isAnimating = false;
    }, 750);
  }

  // Desde cualquier ficha: funde a la primera y cierra la revista con el giro de la tapa
  volverAPortada() {
    if (this.isAnimating || this.state !== 'spread') return;
    if (this.currentProject === 0) { this.closeToCover(); return; }
    this.isAnimating = true;
    const base = this.spreadContainer;
    base.style.opacity = '0';
    setTimeout(() => {
      this.currentProject = 0;
      this.renderSpreadDirect(0);
      base.style.opacity = '';
      this.isAnimating = false;
      this.updateNav();
      setTimeout(() => this.closeToCover(), 380);
    }, 480);
  }

  // Espera (máx. 600 ms) a que las imágenes de un bloque estén decodificadas
  imagenesListas(el) {
    const esperas = [...el.querySelectorAll('img')].map((i) => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()));
    return Promise.race([Promise.all(esperas), new Promise((r) => setTimeout(r, 600))]);
  }

  // Suelta la hoja con un fundido corto: así los mínimos desajustes de la página de debajo no se notan como un salto
  soltarHoja(hoja) {
    if (this.reducedMotion()) { hoja.remove(); return; }
    hoja.style.transition = 'opacity .32s ease';
    hoja.style.opacity = '0';
    setTimeout(() => hoja.remove(), 360);
  }

  closeToCover() {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // Desplazamiento cinemático hacia la posición de portada
    this.scene.classList.remove('is-spread');
    this.scene.classList.add('is-cover');

    if (this.reducedMotion()) {
      this.state = 'cover';
      this.coverPage.classList.remove('flipped');
      this.coverPage.style.display = '';
      this.updateNav();
      this.isAnimating = false;
      return;
    }

    // Crear la hoja voladora 3D que regresa hacia la derecha
    const flipper = document.createElement('div');
    flipper.className = 'mag-leaf-flipper flip-backward';
    flipper.innerHTML = `
      <div class="leaf-face leaf-front">
        ${this.renderLeftPageHTML(projects[0], 1)}
        <div class="leaf-shadow leaf-shadow-front"></div>
      </div>
      <div class="leaf-face leaf-back-reverse leaf-back--cover">
        ${this.getCoverFrontHTML(true)}
        <div class="leaf-shadow leaf-shadow-back"></div>
      </div>
    `;

    this.magazine.appendChild(flipper);

    // Las capturas de la portada deben estar listas antes de girar y antes de soltar la hoja (sin saltos)
    this.imagenesListas(flipper).then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          flipper.classList.add('is-flipping');
        });
      });
    });

    setTimeout(async () => {
      this.coverPage.classList.remove('flipped');
      this.coverPage.style.display = '';
      await this.imagenesListas(this.coverPage);
      this.state = 'cover';
      this.soltarHoja(flipper);
      this.updateNav();
      this.isAnimating = false;
    }, 800);
  }

  // ── Navegación con pase de hoja 3D (Page Turn) ──
  next() {
    if (this.isAnimating) return;

    if (this.state === 'cover') {
      this.openCover();
    } else if (this.state === 'spread') {
      this.flipToNext();
    }
  }

  prev() {
    if (this.isAnimating) return;

    if (this.state === 'backcover') {
      this.flipFromBackcover();
    } else if (this.state === 'spread') {
      this.flipToPrev();
    }
  }

  // ── Última ficha → contraportada, con el mismo giro de hoja ──
  flipToBackcover() {
    const ultimo = projects.length - 1;
    if (this.reducedMotion()) { this.state = 'backcover'; this.updateView(); return; }
    this.isAnimating = true;
    const flipper = document.createElement('div');
    flipper.className = 'mag-leaf-flipper flip-forward';
    flipper.innerHTML = `
      <div class="leaf-face leaf-front">${this.renderRightPageHTML(projects[ultimo], ultimo + 1)}<div class="leaf-shadow leaf-shadow-front"></div></div>
      <div class="leaf-face leaf-back"><div class="leaf-shadow leaf-shadow-back"></div></div>`;
    flipper.querySelector('.leaf-back').prepend(this.backcoverPage.querySelector('.backcover-quotes').cloneNode(true));
    this.backcoverPage.classList.add('active', 'entrando');
    this.magazine.appendChild(flipper);
    requestAnimationFrame(() => requestAnimationFrame(() => flipper.classList.add('is-flipping')));
    setTimeout(() => {
      this.state = 'backcover';
      this.updateView();
      this.backcoverPage.classList.remove('entrando');
      this.soltarHoja(flipper);
      this.isAnimating = false;
    }, 780);
  }

  // ── Contraportada → última ficha ──
  flipFromBackcover() {
    const ultimo = projects.length - 1;
    if (this.reducedMotion()) { this.state = 'spread'; this.currentProject = ultimo; this.updateView(); return; }
    this.isAnimating = true;
    this.renderSpreadDirect(ultimo);
    this.spreadContainer.style.display = '';
    const flipper = document.createElement('div');
    flipper.className = 'mag-leaf-flipper flip-backward';
    flipper.innerHTML = `
      <div class="leaf-face leaf-front"><div class="leaf-shadow leaf-shadow-front"></div></div>
      <div class="leaf-face leaf-back-reverse">${this.renderRightPageHTML(projects[ultimo], ultimo + 1)}<div class="leaf-shadow leaf-shadow-back"></div></div>`;
    flipper.querySelector('.leaf-front').prepend(this.backcoverPage.querySelector('.backcover-quotes').cloneNode(true));
    this.backcoverPage.classList.add('entrando');
    this.magazine.appendChild(flipper);
    requestAnimationFrame(() => requestAnimationFrame(() => flipper.classList.add('is-flipping')));
    setTimeout(() => {
      this.state = 'spread';
      this.currentProject = ultimo;
      this.updateView();
      this.backcoverPage.classList.remove('entrando');
      this.soltarHoja(flipper);
      this.isAnimating = false;
    }, 780);
  }

  // ── Efecto de pasar hoja hacia adelante (Derecha a Izquierda) ──
  flipToNext() {
    if (this.isAnimating) return;
    const fromIdx = this.currentProject;
    const toIdx = fromIdx + 1;

    if (toIdx >= projects.length) {
      this.flipToBackcover();
      return;
    }

    if (this.reducedMotion()) {
      this.currentProject = toIdx;
      this.renderSpreadDirect(toIdx);
      this.updateNav();
      return;
    }

    this.isAnimating = true;

    // Crear la hoja física voladora
    const flipper = document.createElement('div');
    flipper.className = 'mag-leaf-flipper flip-forward';
    flipper.innerHTML = `
      <div class="leaf-face leaf-front">
        ${this.renderRightPageHTML(projects[fromIdx], fromIdx + 1)}
        <div class="leaf-shadow leaf-shadow-front"></div>
      </div>
      <div class="leaf-face leaf-back">
        ${this.renderLeftPageHTML(projects[toIdx], toIdx + 1)}
        <div class="leaf-shadow leaf-shadow-back"></div>
      </div>
    `;

    // Actualizar inmediatamente la página derecha del fondo con el nuevo proyecto
    const baseRight = this.spreadContainer.querySelector('.spread__right');
    if (baseRight) {
      baseRight.innerHTML = this.renderRightPageInner(projects[toIdx], toIdx + 1);
    }

    this.magazine.appendChild(flipper);

    // Activar giro 3D de 0deg a -180deg
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        flipper.classList.add('is-flipping');
      });
    });

    setTimeout(() => {
      this.currentProject = toIdx;
      const baseLeft = this.spreadContainer.querySelector('.spread__left');
      if (baseLeft) {
        baseLeft.innerHTML = this.renderLeftPageInner(projects[toIdx], toIdx + 1);
      }
      this.soltarHoja(flipper);
      this.updateNav();
      this.isAnimating = false;
    }, 750);
  }

  // ── Efecto de pasar hoja hacia atrás (Izquierda a Derecha) ──
  flipToPrev() {
    if (this.isAnimating) return;
    const fromIdx = this.currentProject;
    const toIdx = fromIdx - 1;

    if (toIdx < 0) {
      this.closeToCover();
      return;
    }

    if (this.reducedMotion()) {
      this.currentProject = toIdx;
      this.renderSpreadDirect(toIdx);
      this.updateNav();
      return;
    }

    this.isAnimating = true;

    // Crear la hoja física voladora que empieza en 0deg en la izquierda y gira hacia la derecha
    const flipper = document.createElement('div');
    flipper.className = 'mag-leaf-flipper flip-backward';
    flipper.innerHTML = `
      <div class="leaf-face leaf-front">
        ${this.renderLeftPageHTML(projects[fromIdx], fromIdx + 1)}
        <div class="leaf-shadow leaf-shadow-front"></div>
      </div>
      <div class="leaf-face leaf-back-reverse">
        ${this.renderRightPageHTML(projects[toIdx], toIdx + 1)}
        <div class="leaf-shadow leaf-shadow-back"></div>
      </div>
    `;

    // Actualizar la página izquierda del fondo con el proyecto previo
    const baseLeft = this.spreadContainer.querySelector('.spread__left');
    if (baseLeft) {
      baseLeft.innerHTML = this.renderLeftPageInner(projects[toIdx], toIdx + 1);
    }

    this.magazine.appendChild(flipper);

    // Activar giro 3D de 0deg a 180deg
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        flipper.classList.add('is-flipping');
      });
    });

    setTimeout(() => {
      this.currentProject = toIdx;
      const baseRight = this.spreadContainer.querySelector('.spread__right');
      if (baseRight) {
        baseRight.innerHTML = this.renderRightPageInner(projects[toIdx], toIdx + 1);
      }
      this.soltarHoja(flipper);
      this.updateNav();
      this.isAnimating = false;
    }, 750);
  }

  goToProject(idx) {
    if (idx < 0 || idx >= projects.length) return;
    this.currentProject = idx;
    this.state = 'spread';
    this.coverPage.classList.add('flipped');
    this.coverPage.style.display = 'none';
    this.scene.classList.remove('is-cover');
    this.scene.classList.add('is-spread');
    this.renderSpreadDirect(idx);
    this.updateNav();
  }

  updateView() {
    if (this.state === 'cover') {
      this.scene.className = 'magazine-scene is-cover';
      this.coverPage.classList.remove('flipped');
      this.coverPage.style.display = '';
      this.coverPage.classList.remove('flipped');
      this.spreadContainer.style.display = '';
      this.backcoverPage.classList.remove('active');
    } else if (this.state === 'spread') {
      this.scene.className = 'magazine-scene is-spread';
      this.coverPage.style.display = 'none';
      this.spreadContainer.style.display = '';
      this.backcoverPage.classList.remove('active');
      this.renderSpreadDirect(this.currentProject);
    } else if (this.state === 'backcover') {
      this.scene.className = 'magazine-scene is-spread';
      this.coverPage.style.display = 'none';
      this.spreadContainer.style.display = 'none';
      this.backcoverPage.classList.add('active');
    }

    this.updateNav();
  }

  renderSpreadDirect(index) {
    const p = projects[index];
    const pageNum = index + 1;

    let spread = this.spreadContainer.querySelector('.spread');
    if (!spread) {
      this.spreadContainer.innerHTML = `
        <div class="spread active">
          ${this.renderLeftPageHTML(p, pageNum)}
          <div class="spread__spine" aria-hidden="true"></div>
          ${this.renderRightPageHTML(p, pageNum)}
        </div>
      `;
      return;
    }

    const baseLeft = spread.querySelector('.spread__left');
    const baseRight = spread.querySelector('.spread__right');
    if (baseLeft) baseLeft.innerHTML = this.renderLeftPageInner(p, pageNum);
    if (baseRight) baseRight.innerHTML = this.renderRightPageInner(p, pageNum);
  }

  renderLeftPageHTML(p, pageNum) {
    return `<section class="spread__left" aria-label="Vista previa de ${p.name}">
      ${this.renderLeftPageInner(p, pageNum)}
    </section>`;
  }

  renderRightPageHTML(p, pageNum) {
    return `<section class="spread__right" aria-label="Detalles de ${p.name}">
      ${this.renderRightPageInner(p, pageNum)}
    </section>`;
  }

  renderLeftPageInner(p, pageNum) {
    const imgUrl = getImageForProject(p.name);
    const icon = langIcons[p.language] || '📦';
    const langClass = `ph--${p.language.toLowerCase()}`;

    const leftContent = imgUrl
      ? `<div class="spread__image-wrap">
           <img src="${imgUrl}" alt="" class="spread__image-bg" aria-hidden="true">
           <div class="spread__image-frame">
             <div class="shot"><div class="shot__bar" aria-hidden="true"><i></i><i></i><i></i></div><img src="${imgUrl}" alt="Captura del proyecto ${p.name}" class="spread__image" loading="lazy" data-fallo-lang="${langClass}" data-fallo-icon="${icon}" data-fallo-name="${p.name}"></div>
           </div>
           <div class="spread__image-overlay"></div>
         </div>`
      : `<div class="spread__placeholder ${langClass}">
           <div class="ph-pattern" aria-hidden="true"></div>
           <span class="spread__placeholder-icon">${icon}</span>
           <span class="spread__placeholder-name">${p.name}</span>
           <span class="spread__placeholder-sub">Proyecto</span>
         </div>`;

    return `
      <div class="spread__left-header">
        <span class="spread__page-num">PÁG. ${pageNum < 10 ? '0' + pageNum : pageNum}</span>
        <span class="spread__lang-pill">${p.language}</span>
      </div>
      ${leftContent}
      <div class="spread__left-footer">
        <button type="button" class="spread__caption volver-portada" aria-label="Volver a la portada">Revista de proyectos</button>
      </div>
    `;
  }

  renderRightPageInner(p, pageNum) {
    let displayTitle = p.name;
    let displayDesc = p.description;

    if (p.description && p.description.includes('—')) {
      const parts = p.description.split('—');
      displayTitle = parts[0].trim();
      displayDesc = parts.slice(1).join('—').trim();
    } else if (p.name) {
      displayTitle = p.name.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    const liveBtn = p.liveUrl
      ? `<a href="${p.liveUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--primary" aria-label="Abrir demo de ${displayTitle}">
           <span aria-hidden="true">↗</span> Ver Proyecto en Vivo
         </a>` : '';

    const tagsHTML = p.tags.map(t => `<span class="tag-pill"><span class="tag-dot" aria-hidden="true"></span>${t}</span>`).join('');
    const padNum = pageNum < 10 ? '0' + pageNum : pageNum;
    const totalPad = projects.length < 10 ? '0' + projects.length : projects.length;

    return `
      <div class="right-content">
        <span class="folio-grande" aria-hidden="true">${padNum}</span>
        <div class="right-content__header">
          <div class="right-content__kicker">
            <span class="kicker-dot" aria-hidden="true"></span>
            <span class="right-content__eyebrow">CASE STUDY · Nº ${padNum}</span>
          </div>
          <span class="right-content__date">${formatDate(p.updatedAt)}</span>
        </div>

        <h2 class="right-content__name">${tituloEditorial(displayTitle)}</h2>

        <div class="right-content__repo-badge">
          <svg class="repo-icon" width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1h-8a1 1 0 00-1 1v6.708A2.486 2.486 0 014.5 9h8V1.5z"/></svg>
          <code>${p.name}</code>
        </div>

        <p class="right-content__desc">${displayDesc}</p>

        <div class="right-content__tags-section">
          <span class="tags-title">STACK TECNOLÓGICO & CAPACIDADES</span>
          <div class="right-content__tags">${tagsHTML}</div>
        </div>

        <div class="right-content__meta-grid">
          <div class="meta-box">
            <span class="meta-box__label">REPOSITORIO</span>
            <span class="meta-box__value">⭐ ${p.stars} ${p.stars === 1 ? 'Star' : 'Stars'}</span>
          </div>
          <div class="meta-box">
            <span class="meta-box__label">LENGUAJE CORE</span>
            <span class="meta-box__value">⚡ ${p.language}</span>
          </div>
          <div class="meta-box">
            <span class="meta-box__label">CREACIÓN</span>
            <span class="meta-box__value">📅 ${formatDate(p.createdAt)}</span>
          </div>
        </div>

        <div class="right-content__actions">
          ${liveBtn}
          <a href="${p.githubUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--ghost" aria-label="Ver código de ${p.name} en GitHub">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            Ver en GitHub
          </a>
        </div>
      </div>

      <div class="right-content__footer">
        <button type="button" class="mag-signature volver-portada" aria-label="Volver a la portada">Revista de proyectos</button>
        <span class="spread__page-num">FOLIO ${padNum} / ${totalPad}</span>
      </div>
    `;
  }

  // Cada proyecto tiene su propio tono (sale de su nombre, siempre el mismo)
  pintarTono() {
    const p = projects[this.currentProject];
    if (this.state === 'spread' && p) {
      let n = 0;
      for (const c of p.name) n = (n * 31 + c.charCodeAt(0)) % 360;
      this.scene.style.setProperty('--tono', n);
    } else {
      this.scene.style.removeProperty('--tono');
    }
  }

  // Puntos de posición e indicación de uso (se apaga al pasar la primera página)
  pintarGuia(current, total) {
    const cont = document.getElementById('puntos');
    if (cont) {
      if (cont.childElementCount !== total) cont.innerHTML = '<i></i>'.repeat(total);
      [...cont.children].forEach((d, i) => d.classList.toggle('on', i === current));
    }
    const pista = document.getElementById('pista');
    if (!pista) return;
    if (this._pistaInicio === undefined) {
      this._pistaInicio = current;
      pista.textContent = window.matchMedia('(pointer: coarse)').matches ? 'Desliza para pasar de página' : 'Usa ← → , la rueda o arrastra para pasar de página';
      pista.classList.add('on');
      setTimeout(() => pista.classList.remove('on'), 9000);
    } else if (current !== this._pistaInicio) {
      pista.classList.remove('on');
    }
  }

  // Frases de la contraportada: rotan solas mientras se ve esa página
  rotarFrases() {
    const frases = [...document.querySelectorAll('#bq-stage .bq')];
    if (frases.length < 2) return;
    clearInterval(this._frasesT);
    if (this.state !== 'backcover' || this.reducedMotion()) return;
    this._frasesT = setInterval(() => {
      const i = frases.findIndex((f) => f.classList.contains('on'));
      frases[i]?.classList.remove('on');
      frases[(i + 1) % frases.length].classList.add('on');
    }, 7000);
  }

  updateNav() {
    this.rotarFrases();
    this.pintarTono();
    const total = projects.length + 2;
    let current, label;

    if (this.state === 'cover') {
      current = 0; label = 'Portada';
    } else if (this.state === 'backcover') {
      current = total - 1; label = 'Contraportada';
    } else {
      current = this.currentProject + 1;
      label = `Pág. ${current} de ${projects.length}`;
    }

    // La dirección refleja la página: se puede copiar y compartir un proyecto concreto (#nombre). No guarda nada.
    try {
      const destino = this.state === 'spread' && projects[this.currentProject] ? '#' + encodeURIComponent(projects[this.currentProject].name) : location.pathname + location.search;
      if (location.hash !== (destino.startsWith('#') ? destino : '')) history.replaceState(null, '', destino);
    } catch { /* sin historial: se ignora */ }

    this.counter.textContent = label;
    this.pintarGuia(current, total);

    if (this.prevSide) this.prevSide.disabled = this.state === 'cover';
    if (this.nextSide) this.nextSide.disabled = this.state === 'backcover';
  }

  reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  bindEvents() {
    if (this.prevSide) this.prevSide.addEventListener('click', () => this.prev());
    if (this.nextSide) this.nextSide.addEventListener('click', () => this.next());

    this.coverPage.addEventListener('click', (e) => {
      if (e.target.closest('.cover__cta')) return;
      this.openCover();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault(); this.next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault(); this.prev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        this.state = 'cover';
        this.coverPage.classList.remove('flipped');
        this.updateView();
      } else if (e.key === 'End') {
        e.preventDefault();
        this.state = 'backcover';
        this.coverPage.classList.add('flipped');
        this.updateView();
      }
    });

    this.scene.addEventListener('click', (e) => { if (e.target.closest('.volver-portada')) this.volverAPortada(); });

    // Rueda del ratón: pasa de página (sin romper el desplazamiento interno de una ficha larga)
    let bloqueoRueda = 0;
    this.scene.addEventListener('wheel', (e) => {
      const caja = e.target.closest('.right-content');
      if (caja && caja.scrollHeight > caja.clientHeight + 2) return;
      if (Math.abs(e.deltaY) < 12 && Math.abs(e.deltaX) < 12) return;
      e.preventDefault();
      const ahora = Date.now();
      if (ahora - bloqueoRueda < 800) return;
      bloqueoRueda = ahora;
      if ((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) > 0) this.next(); else this.prev();
    }, { passive: false });

    // Arrastrar con el ratón (el tacto se resuelve abajo con touchstart/touchend)
    let arrastre = null;
    this.scene.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a, button')) return;
      arrastre = { x: e.clientX, y: e.clientY };
    });
    window.addEventListener('pointerup', (e) => {
      if (!arrastre) return;
      const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
      arrastre = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) this.next(); else this.prev(); }
    });

    const touchTarget = this.scene;
    touchTarget.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    touchTarget.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].screenX - this.touchStartX;
      const dy = e.changedTouches[0].screenY - this.touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) this.next(); else this.prev();
      }
    }, { passive: true });
  }
}

// ── Theme Manager ── (sin guardar nada: arranca con el tema del sistema y el botón lo cambia mientras la página está abierta)
class ThemeManager {
  constructor() {
    this.toggle = document.getElementById('theme-toggle');
    const consulta = window.matchMedia('(prefers-color-scheme: dark)');
    this.set(consulta.matches ? 'dark' : 'light');
    this.manual = false;

    this.toggle.addEventListener('click', () => {
      const actual = document.documentElement.getAttribute('data-theme');
      this.manual = true;
      this.set(actual === 'dark' ? 'light' : 'dark');
    });

    consulta.addEventListener('change', (e) => {
      if (!this.manual) this.set(e.matches ? 'dark' : 'light');
    });
  }

  set(theme) { document.documentElement.setAttribute('data-theme', theme); }
}

let magazine;

// Si una captura no carga, la página muestra una portada con el icono y el nombre del proyecto (sin manejadores en línea, por la política de contenido)
document.addEventListener('error', (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement)) return;
  if (img.closest('.cv-plate')) { img.closest('.cv-plate').remove(); return; }
  if (!img.classList.contains('spread__image')) return;
  const marco = img.closest('.spread__image-wrap');
  if (!marco) return;
  const ph = document.createElement('div');
  ph.className = 'spread__placeholder ' + (img.dataset.falloLang || '');
  const crear = (clase, texto) => { const el = document.createElement('span'); el.className = clase; el.textContent = texto; return el; };
  ph.append(crear('spread__placeholder-icon', img.dataset.falloIcon || '📦'), crear('spread__placeholder-name', img.dataset.falloName || ''), crear('spread__placeholder-sub', 'Proyecto'));
  marco.replaceWith(ph);
}, true);

async function cargarCatalogo() {
  const respuesta = await fetch('data/proyectos.json', { cache: 'no-cache' });
  if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
  const datos = await respuesta.json();
  projects = datos.proyectos || [];
  readmeImages = datos.imagenes || {};
  miniaturas = datos.miniaturas || {};
  if (!projects.length) throw new Error('catálogo vacío');
}

document.addEventListener('DOMContentLoaded', async () => {
  new ThemeManager();
  try {
    await cargarCatalogo();
  } catch (e) {
    document.getElementById('loader')?.classList.add('hidden');
    const aviso = document.createElement('p');
    aviso.setAttribute('role', 'alert');
    aviso.style.cssText = 'position:fixed;inset:40% 10% auto;text-align:center;font:16px system-ui;opacity:.8';
    aviso.textContent = 'No se pudo cargar el catálogo. Recarga la página en unos minutos.';
    document.body.appendChild(aviso);
    return;
  }
  document.getElementById('cover-front').innerHTML = Magazine.prototype.getCoverFrontHTML.call({}, false);
  // Las imágenes de la portada se guardan en memoria para que nunca tarden al volver
  window.__portadaImgs = [...document.querySelectorAll('#cover-front .cv-plate img')].map((i) => { const n = new Image(); n.src = i.src; return n; });
  const hashInicial = location.hash; // se lee antes de crear la revista, que reescribe la dirección
  magazine = new Magazine();
  document.getElementById('cta-open')?.addEventListener('click', () => magazine.openCover());

  // Enlace directo a un proyecto: https://…/revista-de-proyectos/#nombre-del-repo
  const abrirDesdeEnlace = (hash) => {
    const nombre = decodeURIComponent((hash || '').slice(1));
    const idx = nombre ? projects.findIndex((p) => p.name === nombre) : -1;
    if (idx >= 0 && !(magazine.state === 'spread' && magazine.currentProject === idx)) magazine.goToProject(idx);
  };
  abrirDesdeEnlace(hashInicial);
  window.addEventListener('hashchange', () => abrirDesdeEnlace(location.hash));
  const escena = document.getElementById('magazine-scene');
  if (escena && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('pointermove', (e) => {
      const x = e.clientX / window.innerWidth - 0.5;
      const y = e.clientY / window.innerHeight - 0.5;
      escena.style.setProperty('--inc-x', (x * 7).toFixed(2) + 'deg');
      escena.style.setProperty('--inc-y', (-y * 5).toFixed(2) + 'deg');
    }, { passive: true });
  }
  document.getElementById('btn-inicio')?.addEventListener('click', () => magazine.goToProject(0));
});
