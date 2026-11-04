# Revisión visual del catálogo — 4 de noviembre de 2026

## Decisiones aplicadas

- Categorías pasa a ser un icono de 44 × 44 px, separado del marco del buscador y situado a la izquierda del logo. Conserva nombre accesible, título al pasar el cursor y apertura del selector existente.
- El selector del encabezado se posiciona junto al icono y debajo del encabezado fijo, también después de hacer scroll.
- El icono de menú del encabezado solo aparece cuando los controles del catálogo quedan por encima del área visible, detrás del encabezado fijo. Se oculta al volver a verlos; el logo y la búsqueda conservan su posición.
- Los tres banners comparten una composición de dos columnas. Título, subtítulo y acción se centran sobre el mismo eje.
- Las acciones tienen un ancho uniforme: 240 px en escritorio y 220 px en móvil, con al menos 44 px de alto.
- La imagen del banner se atenúa en móvil para priorizar la lectura.
- Se conserva Noviembre 2026, los destinos existentes y la navegación mediante flechas, indicadores y deslizamiento.
- Se añade pausa y reanudación explícita. El teclado detiene la rotación hasta que se solicita reanudar; se respeta la preferencia de movimiento reducido.

## Iteraciones y evidencia

Las capturas se guardan en `dist/catalog-visual-review/`, fuera de los archivos publicados:

1. `01-before-*`: estado inicial en escritorio y móvil.
2. `02-*-slide-*`: primera propuesta, 27 capturas; revisión visual de escritorio y móviles pequeños.
3. `03-*-slide-*`: ajuste de anchos de acción y legibilidad sobre las imágenes.
4. `04-*-slide-*`: confirmación final, esperando explícitamente al anuncio seleccionado antes de capturar.

- [Escritorio final](../../dist/catalog-visual-review/04-1440-slide-1.png)
- [Móvil final](../../dist/catalog-visual-review/04-390-slide-0.png)
- [Categorías tras hacer scroll](../../dist/catalog-visual-review/04-categories-scrolled.png)
- [Mediciones finales](../../dist/catalog-visual-review/04-report.json)
- [Verificación funcional](../../dist/catalog-visual-review/functional-report.json)

## Resultado de las verificaciones

Tres anuncios en nueve anchos: 1920, 1440, 1024, 861, 768, 430, 390, 360 y 320 px.
Las 27 combinaciones finales no muestran desbordamiento horizontal, recortes del texto ni acciones menores de 44 px. La diferencia máxima entre los centros del título y su acción fue inferior a 0,01 px.

Verificados: categorías en el encabezado fijo, selección, cierre con Escape y retorno del foco, búsqueda, menú móvil, destinos de los anuncios, deslizamiento, rotación, pausa, reanudación y movimiento reducido. Sin errores JavaScript observados. Build de producción y comprobación UTF-8/LF correctos.

Navegador probado: Chromium mediante Playwright. No se hicieron pruebas en dispositivos físicos ni en Hostinger.

## Referencias consultadas

- [W3C: patrón de carrusel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/): control de rotación, navegación y tratamiento del foco.
- [W3C: animaciones en carruseles](https://www.w3.org/WAI/tutorials/carousels/animations/): pausa durante la interacción.
- [NN/g: usabilidad de iconos](https://www.nngroup.com/articles/icon-usability/): un icono aislado necesita contexto. Se conserva la etiqueta accesible y el título emergente, respetando la petición de quitar el texto permanente.
