# Diferencias Pantallas Legacy

## Objetivo

Inventariar las diferencias visuales y de UX que todavia existen entre `C:\tienda-abril` y este proyecto en las pantallas publicas de tienda, sin ejecutar cambios todavia.

## Alcance

Este relevamiento cubre el storefront publico:

- shell compartido
- `/`
- `/productos`
- `/producto/{slug}`
- `/carrito`
- `/servicios`

Quedan fuera de este documento `admin`, `reparaciones privadas` y el plan funcional mas amplio ya documentado en [plan-correcciones-migracion-legacy.md](C:/tienda-nuevo-stack/plan-correcciones-migracion-legacy.md).

## Fuentes usadas

- Capturas aportadas por el usuario del legacy y del proyecto migrado.
- Layout actual: [resources/js/layouts/SiteLayout.tsx](C:/tienda-nuevo-stack/resources/js/layouts/SiteLayout.tsx:77)
- Catalogo actual: [resources/js/pages/Store/CatalogPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/CatalogPage.tsx:148)
- Producto actual: [resources/js/pages/Store/ProductPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/ProductPage.tsx:1)
- Carrito actual: [resources/js/pages/Store/CartPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/CartPage.tsx:1)
- Servicios actual: [resources/js/pages/Store/ServicesPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/ServicesPage.tsx:1)
- Contrato de datos actual: [app/Http/Controllers/StoreController.php](C:/tienda-nuevo-stack/app/Http/Controllers/StoreController.php:80)
- Contrato legacy: [C:/tienda-abril/app/Frontend/LayoutContext.php](C:/tienda-abril/app/Frontend/LayoutContext.php:51), [C:/tienda-abril/app/Frontend/Bootstrap.php](C:/tienda-abril/app/Frontend/Bootstrap.php:374)

## Resumen Ejecutivo

La migracion actual resolvio bien la superficie funcional del storefront, pero no cerro la paridad fina del shell visual ni varios comportamientos de UX del legacy.

Diferencias transversales mas importantes:

- Falta el header sticky/fijo del storefront.
- El footer perdio el embed de Google Maps y quedo reducido a un link.
- El carrusel superior conserva la rotacion automatica, pero las flechas visibles no son controles reales.
- El catalogo actual simplifico la zona de filtros: se aplanaron los grupos, desaparecio la UI de ordenamiento y cambio la composicion visual de la barra.
- La tarjeta visual del storefront quedo mas “moderna y limpia”, pero menos fiel al legacy en densidad, paneles contenedores, jerarquia y affordances.

## Causas Transversales

- Se preservaron contratos de datos, pero se simplifico el render en React. El caso mas claro es el mapa: el dato sigue existiendo en [app/Services/SiteViewDataService.php](C:/tienda-nuevo-stack/app/Services/SiteViewDataService.php:73), pero el footer actual solo dibuja un link en [resources/js/layouts/SiteLayout.tsx](C:/tienda-nuevo-stack/resources/js/layouts/SiteLayout.tsx:206).
- El shell nuevo fue reescrito como layout estatico en Tailwind. El header actual no tiene `sticky`, `fixed` ni logica de scroll en [resources/js/layouts/SiteLayout.tsx](C:/tienda-nuevo-stack/resources/js/layouts/SiteLayout.tsx:77).
- El backend actual todavia expone capacidades que la UI no muestra. Ejemplo: el catalogo acepta `precio_asc` y `precio_desc` en [app/Http/Controllers/StoreController.php](C:/tienda-nuevo-stack/app/Http/Controllers/StoreController.php:80), pero no existe una UI equivalente de ordenamiento en [resources/js/pages/Store/CatalogPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/CatalogPage.tsx:148).
- El legacy modelaba grupos del catalogo con `productCount` e `isOpenByDefault` en [C:/tienda-abril/app/Frontend/Bootstrap.php](C:/tienda-abril/app/Frontend/Bootstrap.php:374), mientras que el proyecto actual los redujo a pills planas en [app/Http/Controllers/StoreController.php](C:/tienda-nuevo-stack/app/Http/Controllers/StoreController.php:312).
- El propio plan de CSS/Tailwind ya dejaba pendiente la paridad visual fina por fases en [plan-migracion-css-tailwind.md](C:/tienda-nuevo-stack/plan-migracion-css-tailwind.md:201).

## Inventario Pantalla Por Pantalla

## 1. Shell Compartido

Pantallas afectadas:

- `/productos`
- `/producto/{slug}`
- `/carrito`
- `/servicios`

Estado:

- `Parcial`

Prioridad:

- `Alta`

Diferencias confirmadas:

- El header no queda fijo al hacer scroll. En el layout actual no hay clases ni logica sticky/fixed.
- El carrusel superior muestra flechas laterales, pero hoy son decorativas. La rotacion existe por `announcementIndex`, aunque no hay botones de avance/retroceso reales en [resources/js/layouts/SiteLayout.tsx](C:/tienda-nuevo-stack/resources/js/layouts/SiteLayout.tsx:26).
- El footer no replica la estructura legacy en dos paneles con CTA de WhatsApp destacado y mapa embebido. La version actual usa tres columnas textuales y un link simple a ubicacion.
- El boton de carrito no replica la presencia visual del legacy. Hoy es una pill con texto `CART`, sin iconografia equivalente ni el mismo peso visual.
- La densidad general del shell es menor: mas aire, menos separadores, menos contenedores internos y menos “caja” visual que en el legacy.

Por que probablemente no se migro:

- Se rehizo el shell compartido como componente moderno unico, priorizando consistencia y rapidez sobre mimetismo visual 1:1.
- Parte de las microinteracciones del legacy estaban embebidas en la capa visual previa y no se reimplementaron al reconstruir el layout.

## 2. `/`

Estado:

- `Redirige a /productos`

Prioridad:

- `Baja`

Diferencias confirmadas:

- No existe una homepage propia: la ruta actual redirige a catalogo desde [app/Http/Controllers/StoreController.php](C:/tienda-nuevo-stack/app/Http/Controllers/StoreController.php:19).

Nota:

- Si el legacy tambien terminaba llevando al catalogo, no hay deuda funcional aca. La deuda real esta en la experiencia de `/productos`.

## 3. `/productos`

Estado:

- `Migrado funcionalmente, con deuda visual/UX alta`

Prioridad:

- `Alta`

Diferencias confirmadas:

- La barra de filtros quedo rearmada con otra composicion. En el proyecto actual hay un `select` de categoria a la izquierda y pills de grupos/flags a la derecha en [resources/js/pages/Store/CatalogPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/CatalogPage.tsx:148). En las capturas legacy se ve otra jerarquia visual y otro balance del espacio.
- Se perdio la UI de ordenamiento del catalogo. El backend soporta `fecha_ingreso`, `precio_asc` y `precio_desc`, pero el frontend actual no expone esos controles.
- Los grupos de catalogo quedaron simplificados. El legacy construia grupos con conteo y apertura por defecto; la version nueva usa una lista plana de botones.
- La grilla de productos ya no vive dentro del gran panel azul del legacy. Hoy las cards se renderizan directamente sobre el flujo principal sin ese contenedor visual.
- La franja de resumen de cantidad de productos esta, pero no reproduce la misma ubicacion relativa ni la misma convivencia con los controles del legacy.
- La composicion header + anuncio + filtros + resumen + grilla se ve mas “separada” y menos compacta que en el legacy.

Diferencias confirmadas por capturas:

- En el legacy la botonera secundaria se integraba mejor a la caja azul del catalogo.
- En la version actual la zona de grupos sobresale como un bloque aparte y cambia mucho la lectura del panel.
- La parte inferior del storefront muestra un footer claramente mas pobre que el legacy.

Por que probablemente no se migro:

- Se mantuvo la funcionalidad central de filtros, busqueda y flags, pero se simplifico la presentacion del toolbar.
- La estructura rica de grupos/categorias del legacy no se porto completa al JSX nuevo.
- La prioridad fue dejar navegable el catalogo y no cerrar el pixel parity del panel principal.

## 4. `/producto/{slug}`

Estado:

- `Migrado funcionalmente, pendiente auditoria visual fina`

Prioridad:

- `Media`

Diferencias confirmadas:

- Hereda todas las diferencias del shell compartido: header no sticky, carrusel no navegable y footer sin mapa embebido.
- La pantalla actual esta resuelta como una composicion de dos bloques limpios y una grilla de relacionados. Eso sugiere una simplificacion visual respecto del lenguaje mas denso del legacy.

Diferencias que requieren verificacion visual puntual contra legacy:

- jerarquia exacta entre galeria, precio, descripcion y CTAs
- tratamiento de miniaturas y bloque principal de imagen
- nivel de protagonismo de productos relacionados
- espaciados y alto visual del bloque descriptivo

Por que probablemente no se migro:

- No hay indicios de deuda funcional fuerte en el contrato de datos; la deuda restante parece ser casi toda de UI y de fidelidad visual del armado.

## 5. `/carrito`

Estado:

- `Migrado funcionalmente, pendiente auditoria visual fina`

Prioridad:

- `Media`

Diferencias confirmadas:

- Hereda las diferencias del shell compartido.
- La pantalla actual resuelve el carrito como lista + resumen lateral minimalista. Es consistente con el stack nuevo, pero mas simple que el lenguaje de paneles del legacy.

Diferencias que requieren verificacion visual puntual contra legacy:

- estados vacios
- orden visual de acciones
- densidad del resumen
- tratamiento responsive del bloque lateral
- microcopys y jerarquia entre “seguir comprando”, “vaciar” y CTA principal

Por que probablemente no se migro:

- La prioridad fue cerrar el flujo de compra por WhatsApp y la manipulacion del carrito. La capa de paridad fina del layout quedo para una etapa posterior.

## 6. `/servicios`

Estado:

- `Migrado funcionalmente, pendiente auditoria visual fina`

Prioridad:

- `Media`

Diferencias confirmadas:

- Hereda las diferencias del shell compartido.
- La version actual usa hero + cards + CTA final con un lenguaje bastante genérico en [resources/js/pages/Store/ServicesPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/ServicesPage.tsx:1).

Diferencias que requieren verificacion visual puntual contra legacy:

- orden real de bloques
- copy exacto por seccion
- jerarquia entre imagen, subtitulo y bullets
- tono visual del CTA final
- comportamiento responsive

Por que probablemente no se migro:

- Se reconstruyo la pagina con el mismo contenido funcional, pero sin una pasada final de paridad visual contra la referencia legacy.

## Prioridad Recomendada De Correccion

Orden sugerido para una futura ejecucion:

1. Shell compartido del storefront.
2. `/productos`.
3. `/producto/{slug}`.
4. `/carrito`.
5. `/servicios`.

## Checklist Minimo Para Cerrar La Brecha

- Reponer header sticky del storefront.
- Convertir el carrusel superior en componente realmente navegable, no solo auto-rotativo.
- Recuperar el footer legado con CTA fuerte de WhatsApp y mapa embebido.
- Restaurar la UI de ordenamiento del catalogo.
- Rehacer la zona de filtros y grupos para acercarla a la estructura del legacy.
- Reincorporar el contenedor visual principal del catalogo y recalibrar densidad/espaciados.
- Hacer una pasada final pantalla por pantalla con capturas desktop y mobile antes de dar por cerrada la paridad.
