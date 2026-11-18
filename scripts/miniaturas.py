#!/usr/bin/env python3
"""Crea miniaturas ligeras (480 px, webp) de las capturas que usa la portada.

Las láminas de la portada miden ~230 px: cargar capturas de 600 KB las hacía aparecer tarde.
Lee docs/data/proyectos.json, genera docs/capturas/mini/<repo>.webp para los primeros proyectos
con captura y deja el mapa en la clave "miniaturas". Solo descarga si la captura cambió.
Requiere: pip install pillow
"""
import io, json, os, urllib.request
from PIL import Image

RUTA = 'docs/data/proyectos.json'
SALIDA = 'docs/capturas/mini'
ANCHO = 480
CUANTAS = 8  # la portada usa 4; unas cuantas más por si cambia el orden

datos = json.load(open(RUTA, encoding='utf-8'))
previas = datos.get('miniaturas', {})
nuevas = {}
os.makedirs(SALIDA, exist_ok=True)

candidatos = [p for p in datos['proyectos'] if p['name'] in datos['imagenes'] and p.get('liveUrl')
              and p['name'] != 'revista-de-proyectos' and not p['name'].endswith('.github.io')][:CUANTAS]

for p in candidatos:
    nombre, origen = p['name'], datos['imagenes'][p['name']]
    destino = f'{SALIDA}/{nombre}.webp'
    previa = previas.get(nombre)
    if previa and previa.get('src') == origen and os.path.exists(destino):
        nuevas[nombre] = previa
        continue
    try:
        req = urllib.request.Request(origen, headers={'User-Agent': 'catalogo-revista-miniaturas'})
        img = Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=30).read())).convert('RGB')
        alto = round(img.height * ANCHO / img.width)
        img.resize((ANCHO, alto), Image.LANCZOS).save(destino, 'WEBP', quality=80, method=6)
        nuevas[nombre] = {'src': origen, 'url': f'capturas/mini/{nombre}.webp'}
        print(f'[Mini] {nombre}: {os.path.getsize(destino) // 1024} KB')
    except Exception as e:
        print(f'[Mini] {nombre}: no se pudo ({e}); se usará la captura completa')

# Borra miniaturas de proyectos que ya no están entre los candidatos
for f in os.listdir(SALIDA):
    if f[:-5] not in nuevas:
        os.remove(os.path.join(SALIDA, f))

if nuevas != previas:
    datos['miniaturas'] = nuevas
    json.dump(datos, open(RUTA, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    open(RUTA, 'a').write('\n')
    print(f'[Mini] {len(nuevas)} miniaturas')
