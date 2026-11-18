<div align="center">

<a href="https://frankusqabant.github.io/revista-de-proyectos/">
  <img src="docs/preview.webp" alt="Revista de proyectos: una página con la captura de un proyecto y, al lado, su ficha" width="760">
</a>

# Revista de proyectos

**Mis proyectos públicos de GitHub, en una revista digital: pasa las páginas, mira la captura de cada uno y entra a la demo o al código.**

[![En línea](https://img.shields.io/badge/GitHub%20Pages-en%20línea-14b8a6?style=flat-square&logo=github&logoColor=white&labelColor=0f172a)](https://frankusqabant.github.io/revista-de-proyectos/)
![Se actualiza solo](https://img.shields.io/badge/se%20actualiza-cada%20semana-2dd4bf?style=flat-square&labelColor=0f172a)
![Sin frameworks](https://img.shields.io/badge/frameworks-ninguno-5eead4?style=flat-square&labelColor=0f172a)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-94a3b8?style=flat-square&labelColor=0f172a)](LICENSE)

### [Abrir la revista →](https://frankusqabant.github.io/revista-de-proyectos/)

</div>

---

## ✨ Qué incluye

| | |
|---|---|
| 📖 **Formato revista** | Doble página: a la izquierda la captura del proyecto, a la derecha su ficha con el stack, las estrellas, la fecha y los enlaces a la demo y al código. |
| 🍃 **Giro de página en 3D** | Las hojas se doblan con sombra y lomo central. |
| 🧘 **Modo lectura** | Las barras se esconden y reaparecen al acercar el cursor a los bordes. |
| 🌓 **Tema claro y oscuro** | Sigue el del sistema y el botón lo cambia, sin guardar nada en tu navegador. |
| ⌨️ **Teclado** | Flechas, barra espaciadora, `Inicio` y `Fin`. |
| 🔄 **Se actualiza solo** | Cada domingo una acción de GitHub lee mis repositorios públicos y refresca la revista. Los que ya no existen salen. |

## 🕹️ Controles

| Acción | Control |
| :--- | :--- |
| Página siguiente | `→`, barra espaciadora o el botón `›` |
| Página anterior | `←` o el botón `‹` |
| Portada / contraportada | `Inicio` / `Fin` |
| Mostrar las barras | Acercar el ratón al borde superior o inferior |
| Cambiar de tema | Botón de luna o sol, arriba a la derecha |

## 🧱 Estructura

```
docs/                    el sitio (GitHub Pages sirve esta carpeta)
├─ index.html  style.css  script.js
├─ data/proyectos.json   proyectos y capturas (lo escribe la sincronización)
├─ fonts/                fuentes propias
└─ preview.webp  og.jpg  imágenes para el README y para compartir
scripts/sync-repos.mjs   sincronización con la API de GitHub
.github/workflows/       ejecución semanal y manual
```

## 🔄 Cómo se actualiza

La acción **Sincronizar catálogo** corre cada domingo (00:00 UTC) y a mano desde la pestaña *Actions*. También se puede lanzar en local:

```bash
node scripts/sync-repos.mjs
```

1. Lista los repositorios públicos, sin forks ni el repositorio de perfil.
2. Para cada uno busca la captura: `preview.webp`, `docs/preview.webp` o la primera imagen real del README. Las insignias no cuentan.
3. Si una captura guardada ya no existe, busca otra. Si un repositorio desaparece, sale del catálogo.
4. Guarda el resultado en `docs/data/proyectos.json`, y solo hace commit si algo cambió.

## 🔒 Privacidad y seguridad

- **Sin rastros:** no guarda nada en el navegador.
- **Política de contenido** en el HTML: solo se ejecuta el script propio, y las fuentes son propias.
- **Imágenes:** las capturas se cargan desde GitHub (`raw.githubusercontent.com`); no hay más servicios de terceros.
- **Escaneo de secretos** activado en el repositorio.

## 📄 Licencia

[MIT](LICENSE) · © 2026 Frank Abanto
