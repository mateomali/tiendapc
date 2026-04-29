# Plan de migracion completa de CSS a Tailwind

## Objetivo

Migrar toda la capa visual de la aplicacion a Tailwind v4 sin romper la paridad visual actual, reduciendo al minimo el CSS manual y dejando `resources/css/app.css` limitado a:

- importacion de Tailwind
- fuentes y tokens de tema
- reset/base minimo realmente necesario
- compatibilidad puntual de terceros, si hiciera falta

Al finalizar la migracion, la UI no deberia depender de clases semanticas como `site-*`, `catalog-*`, `admin-*`, `repair-*`, `btn-*` ni de componentes estilados desde CSS tradicional.

## Estado actual relevado

- Stack: Laravel + Inertia + React + TypeScript + Vite.
- Tailwind ya esta instalado y activo: `tailwindcss`, `@tailwindcss/vite`.
- Solo existe una hoja CSS de aplicacion: [resources/css/app.css](C:/tienda-nuevo-stack/resources/css/app.css).
- `app.css` tiene aproximadamente 2386 lineas y mezcla toda la UI del proyecto:
  - storefront y layouts publicos
  - admin
  - reparaciones privadas y publicas
  - componentes compartidos
  - responsive y variantes de estado
- La mayor parte de la app sigue usando clases semanticas custom:
  - `site-*`
  - `catalog-*`
  - `product-*`
  - `cart-*`
  - `services-*`
  - `admin-*`
  - `repair-*`
  - `btn-*`
- Ya existe una capa hibrida: algunas pantallas nuevas usan utilidades Tailwind directamente, por ejemplo:
  - [resources/js/pages/Auth/LoginPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Auth/LoginPage.tsx)
  - [resources/js/pages/Admin/TicketPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/TicketPage.tsx)
  - [resources/js/components/FlashMessages.tsx](C:/tienda-nuevo-stack/resources/js/components/FlashMessages.tsx)
  - partes de [resources/js/pages/Admin/TrashPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/TrashPage.tsx)
- Hay indicios de tokens Tailwind aun no normalizados del todo:
  - se usan clases como `text-ink-900`, `text-brand-700`, `bg-brand-500`, `card-surface`
  - esas clases deben consolidarse y definirse correctamente en la fase base para evitar estilos fantasma o inconsistentes
- Los tests E2E existen, pero no cubren paridad visual:
  - [tests/e2e/store.spec.ts](C:/tienda-nuevo-stack/tests/e2e/store.spec.ts)
  - [tests/e2e/admin.spec.ts](C:/tienda-nuevo-stack/tests/e2e/admin.spec.ts)
  - [tests/e2e/repairs.spec.ts](C:/tienda-nuevo-stack/tests/e2e/repairs.spec.ts)
- Un test de storefront depende de una clase CSS concreta (`.catalog-card`), por lo que la migracion debe desacoplar los tests de los nombres de clase.

## Principios de migracion

- Mantener paridad visual por dominio funcional, no migrar todo junto.
- Migrar primero tokens y primitives compartidos, despues pantallas.
- Reducir `app.css` por segmentos enteros, no por reglas aisladas.
- Evitar recrear otra capa semantica grande con `@apply`; la prioridad es mover el styling a JSX con utilidades Tailwind.
- Usar utilidades inline para layout y apariencia final; reservar helpers solo para:
  - combinacion condicional de clases
  - patrones repetidos muy estables
  - estados complejos imposibles de leer si quedan inline
- Proteger la migracion con verificacion visual por screenshots y smoke tests funcionales.
- No cambiar markup ni comportamiento salvo donde sea necesario para expresar mejor los estilos en Tailwind.

## Inventario por dominio

### Base y shell

- [resources/views/app.blade.php](C:/tienda-nuevo-stack/resources/views/app.blade.php)
- [resources/js/app.tsx](C:/tienda-nuevo-stack/resources/js/app.tsx)
- [resources/js/components/FlashMessages.tsx](C:/tienda-nuevo-stack/resources/js/components/FlashMessages.tsx)
- [resources/css/app.css](C:/tienda-nuevo-stack/resources/css/app.css)

### Storefront

- [resources/js/layouts/SiteLayout.tsx](C:/tienda-nuevo-stack/resources/js/layouts/SiteLayout.tsx)
- [resources/js/pages/Store/CatalogPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/CatalogPage.tsx)
- [resources/js/pages/Store/ProductPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/ProductPage.tsx)
- [resources/js/pages/Store/CartPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/CartPage.tsx)
- [resources/js/pages/Store/ServicesPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/ServicesPage.tsx)

### Auth

- [resources/js/pages/Auth/LoginPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Auth/LoginPage.tsx)

### Admin

- [resources/js/layouts/AdminLayout.tsx](C:/tienda-nuevo-stack/resources/js/layouts/AdminLayout.tsx)
- 18 pantallas en `resources/js/pages/Admin`

### Reparaciones

- [resources/js/layouts/RepairLayout.tsx](C:/tienda-nuevo-stack/resources/js/layouts/RepairLayout.tsx)
- [resources/js/components/RepairTicketPanel.tsx](C:/tienda-nuevo-stack/resources/js/components/RepairTicketPanel.tsx)
- [resources/js/pages/Repairs/WorkbenchPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Repairs/WorkbenchPage.tsx)
- [resources/js/pages/Repairs/DeliveredPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Repairs/DeliveredPage.tsx)
- [resources/js/pages/Repairs/TechLoginPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Repairs/TechLoginPage.tsx)
- [resources/js/pages/Repairs/PublicTrackingPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Repairs/PublicTrackingPage.tsx)

## Fase 0 - Baseline y red de seguridad

### Objetivo

Congelar el estado visual actual para poder migrar por oleadas sin perder paridad.

### Tareas

- Levantar inventario de selectores de `app.css` por dominio: store, admin, repairs y shared.
- Identificar bloques de CSS muertos o dudosos para no migrarlos a ciegas.
- Generar capturas baseline de pantallas clave en desktop y mobile.
- Definir matriz de vistas criticas para comparar antes y despues:
  - `/productos`
  - detalle de producto
  - `/carrito`
  - `/servicios`
  - `/login`
  - `/admin`
  - `/admin/productos`
  - `/admin/media`
  - `/admin/configuracion`
  - `/consulta`
  - `/entregados`
  - `/reparacion`
- Endurecer Playwright para que no dependa de clases CSS que van a desaparecer.
- Reemplazar selectores fragiles por:
  - texto visible
  - roles accesibles
  - `data-testid` o `data-*` semanticos si hicieran falta

### Entregables

- baseline de screenshots por vista
- checklist de pantallas y breakpoints
- ajustes en tests E2E para desacoplarlos de clases legacy

### Criterio de salida

- Existe una referencia visual confiable.
- Los tests de smoke siguen pasando aun si cambian clases CSS.

## Fase 1 - Fundacion Tailwind y sistema de diseño

### Objetivo

Definir la base visual de Tailwind antes de tocar pantallas para que el resto de la migracion sea consistente y mas rapida.

### Tareas

- Reducir conceptualmente `app.css` a una capa fundacional:
  - `@import 'tailwindcss';`
  - `@source`
  - `@theme`
  - base minima
- Modelar en Tailwind los tokens reales del proyecto:
  - tipografias
  - azules de marca
  - grises y tintas
  - verdes de CTA
  - rojos de alertas/ofertas
  - radios
  - sombras
  - gradientes clave
  - espaciados recurrentes
- Resolver de forma explicita las clases actualmente hibridas:
  - `brand-*`
  - `ink-*`
  - `card-surface`
- Decidir convencion para clases condicionales:
  - helper `cn()` liviano
  - o template strings simples donde alcance
- Crear primitives reutilizables a nivel JSX, no CSS semantico:
  - botones
  - card container
  - input/select/textarea
  - badges/chips
  - section heading
  - paneles con gradiente
- Documentar equivalencias visuales legacy -> Tailwind:
  - boton azul principal
  - boton soft
  - boton danger
  - card blanca con sombra azul
  - chips de estado
  - grid y shells principales

### Archivos objetivo

- [resources/css/app.css](C:/tienda-nuevo-stack/resources/css/app.css)
- [resources/views/app.blade.php](C:/tienda-nuevo-stack/resources/views/app.blade.php)
- [resources/js/components/FlashMessages.tsx](C:/tienda-nuevo-stack/resources/js/components/FlashMessages.tsx)
- posibles nuevos helpers/componentes visuales compartidos en `resources/js`

### Optimizaciones

- Extraer los gradientes repetidos a tokens o constantes semanticas de Tailwind v4.
- Estandarizar radios y sombras para cortar duplicacion masiva.
- Evitar introducir `@apply` para todo; usarlo solo si un patron verdaderamente aparece en muchos archivos y mejora lectura.

### Criterio de salida

- Existe un set estable de tokens y primitives.
- Las utilidades `brand`, `ink` y `card-surface` quedan definidas o eliminadas.
- El equipo ya puede migrar pantallas sin depender de CSS nuevo tradicional.

## Fase 2 - Shells compartidos y layout global

### Objetivo

Migrar los contenedores globales y zonas comunes primero, porque impactan todas las pantallas.

### Tareas

- Migrar `SiteLayout` a utilidades Tailwind manteniendo:
  - header
  - buscador
  - nav pills
  - carrito
  - CTA de reparaciones
  - bloque de anuncios
  - footer
- Migrar `AdminLayout` a Tailwind:
  - shell general
  - hero/header admin
  - navegacion principal
  - top actions
- Migrar `RepairLayout` a Tailwind:
  - shell
  - header tecnico
  - nav del modulo
- Unificar wrappers responsive:
  - anchos maximos
  - paddings horizontales
  - gap vertical
  - comportamiento mobile

### Archivos objetivo

- [resources/js/layouts/SiteLayout.tsx](C:/tienda-nuevo-stack/resources/js/layouts/SiteLayout.tsx)
- [resources/js/layouts/AdminLayout.tsx](C:/tienda-nuevo-stack/resources/js/layouts/AdminLayout.tsx)
- [resources/js/layouts/RepairLayout.tsx](C:/tienda-nuevo-stack/resources/js/layouts/RepairLayout.tsx)

### Riesgos

- Los layouts concentran gran parte de la identidad visual.
- Un error aca afecta muchas pantallas aunque no se hayan migrado aun.

### Criterio de salida

- Los tres layouts renderizan igual en desktop y mobile.
- Se puede eliminar el bloque de shells equivalentes en `app.css`.

## Fase 3 - Storefront publico

### Objetivo

Cerrar primero el flujo comercial publico, porque es la cara visible del negocio y tiene un set relativamente acotado de pantallas.

### Tareas

- Migrar catalogo:
  - filtros
  - toolbar
  - count bar
  - cards de producto
  - badges de oferta/destacado/nuevo
  - estados vacios
- Migrar detalle de producto:
  - galeria
  - thumbnails
  - precio
  - descripcion expandible
  - CTA principal y WhatsApp
  - relacionados
- Migrar carrito:
  - line items
  - controles de cantidad
  - resumen
  - CTAs
- Migrar servicios:
  - hero
  - cards
  - CTA final
- Verificar que no cambien:
  - alturas de cards
  - proporciones de imagen
  - jerarquia tipografica
  - comportamiento responsive

### Archivos objetivo

- [resources/js/pages/Store/CatalogPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/CatalogPage.tsx)
- [resources/js/pages/Store/ProductPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/ProductPage.tsx)
- [resources/js/pages/Store/CartPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/CartPage.tsx)
- [resources/js/pages/Store/ServicesPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Store/ServicesPage.tsx)

### Optimizaciones

- Unificar botones `catalog-action-button`, `catalog-toolbar-button`, `product-more-button` con variants Tailwind.
- Unificar shells de cards que hoy repiten bordes, gradientes y sombras.
- Normalizar tamaños de imagen con utilidades compartidas para evitar drift visual.

### Criterio de salida

- Smoke visual del storefront aprobado.
- Se pueden borrar casi todos los bloques `site-*`, `catalog-*`, `product-*`, `cart-*`, `services-*` de `app.css`.

## Fase 4 - Auth y componentes shared ligeros

### Objetivo

Cerrar el estado hibrido de componentes ya parcialmente migrados y dejar consistente la base publica.

### Tareas

- Revisar `LoginPage` para que dependa solo de tokens definidos y utilidades existentes.
- Dejar `FlashMessages` alineado con el sistema final.
- Revisar cualquier wrapper compartido derivado de shells legacy.

### Archivos objetivo

- [resources/js/pages/Auth/LoginPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Auth/LoginPage.tsx)
- [resources/js/components/FlashMessages.tsx](C:/tienda-nuevo-stack/resources/js/components/FlashMessages.tsx)

### Criterio de salida

- No quedan clases hibridas sin respaldo real.
- Shared UI basica lista para reutilizar en admin y repairs.

## Fase 5 - Admin: primitives, dashboard y pantallas de baja complejidad

### Objetivo

Migrar primero las pantallas administrativas mas repetitivas para capitalizar primitives y reducir el costo de las vistas complejas.

### Tareas

- Construir primitives admin en Tailwind:
  - hero cards
  - stats cards
  - settings cards
  - headings
  - fields
  - checkboxes
  - paginacion
  - empty states
  - preview pills
  - tag chips
- Migrar pantallas de baja complejidad:
  - dashboard
  - papelera
  - ticket
  - listados
  - anuncios
  - contacto
  - configuracion
  - servicios admin
  - backups

### Archivos objetivo

- [resources/js/pages/Admin/DashboardPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/DashboardPage.tsx)
- [resources/js/pages/Admin/TrashPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/TrashPage.tsx)
- [resources/js/pages/Admin/TicketPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/TicketPage.tsx)
- [resources/js/pages/Admin/ListadosPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/ListadosPage.tsx)
- [resources/js/pages/Admin/ListadosPrintPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/ListadosPrintPage.tsx)
- [resources/js/pages/Admin/AnnouncementsPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/AnnouncementsPage.tsx)
- [resources/js/pages/Admin/ContactPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/ContactPage.tsx)
- [resources/js/pages/Admin/SettingsPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/SettingsPage.tsx)
- [resources/js/pages/Admin/ServicesAdminPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/ServicesAdminPage.tsx)
- [resources/js/pages/Admin/BackupsPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/BackupsPage.tsx)

### Optimizaciones

- Consolidar formularios y secciones repetidas antes de tocar `ProductsPage`.
- Asegurar que las pantallas nuevas no reintroduzcan clases `admin-*`.

### Criterio de salida

- La mayoria de los componentes admin repetitivos ya viven en Tailwind.
- `app.css` pierde una porcion grande del bloque `admin-*`.

## Fase 6 - Admin: pantallas complejas y de alta densidad

### Objetivo

Migrar las vistas con mas densidad de informacion, tablas y estados inline cuando los primitives ya esten firmes.

### Tareas

- Migrar `ProductsPage`:
  - filtros
  - toolbar masivo
  - tabla ancha
  - filas inline
  - feedback de guardado
  - warnings
  - estados
- Migrar `ProductFormPage`:
  - ficha principal
  - media picker
  - galeria
- Migrar `MediaPage`, `CategoriesPage`, `SalesPage`, `SaleFormPage`, `ProductMissingImagesPage`, `ProductMissingSkusPage`.
- Revisar ergonomia responsive en tablas grandes y decidir:
  - overflow horizontal controlado
  - cards mobile selectivas
  - o combinacion segun pantalla

### Archivos objetivo

- [resources/js/pages/Admin/ProductsPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/ProductsPage.tsx)
- [resources/js/pages/Admin/ProductFormPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/ProductFormPage.tsx)
- [resources/js/pages/Admin/MediaPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/MediaPage.tsx)
- [resources/js/pages/Admin/CategoriesPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/CategoriesPage.tsx)
- [resources/js/pages/Admin/SalesPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/SalesPage.tsx)
- [resources/js/pages/Admin/SaleFormPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/SaleFormPage.tsx)
- [resources/js/pages/Admin/ProductMissingImagesPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/ProductMissingImagesPage.tsx)
- [resources/js/pages/Admin/ProductMissingSkusPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Admin/ProductMissingSkusPage.tsx)

### Riesgos

- Las tablas y toolbars son donde mas facil es degradar legibilidad o spacing.
- Hay mucha interaccion inline; no conviene mezclar cambios de estilo con refactors de logica.

### Criterio de salida

- Todo admin queda en Tailwind.
- Se elimina la dependencia de `admin-inline-field`, `btn`, `admin-stat-card`, `admin-settings-card`, `admin-hero-card`, etc.

## Fase 7 - Reparaciones privadas y publicas

### Objetivo

Migrar el modulo de reparaciones, que hoy combina el mayor volumen de estados visuales, formularios, chips y galerias.

### Tareas

- Migrar `RepairTicketPanel` como pieza central:
  - ticket panel
  - cards de reparacion
  - formularios
  - galerias
  - historiales
  - acciones y estados
- Migrar `WorkbenchPage` y `DeliveredPage`.
- Migrar `TechLoginPage`.
- Migrar `PublicTrackingPage` preservando con muchisimo cuidado:
  - esquema de colores por estado
  - bloques resaltados
  - lightbox
  - imagenes de ingreso/finales
  - jerarquia tipografica
  - CTA de WhatsApp
  - bloque de direccion

### Archivos objetivo

- [resources/js/components/RepairTicketPanel.tsx](C:/tienda-nuevo-stack/resources/js/components/RepairTicketPanel.tsx)
- [resources/js/pages/Repairs/WorkbenchPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Repairs/WorkbenchPage.tsx)
- [resources/js/pages/Repairs/DeliveredPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Repairs/DeliveredPage.tsx)
- [resources/js/pages/Repairs/TechLoginPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Repairs/TechLoginPage.tsx)
- [resources/js/pages/Repairs/PublicTrackingPage.tsx](C:/tienda-nuevo-stack/resources/js/pages/Repairs/PublicTrackingPage.tsx)

### Optimizaciones

- Modelar variantes de estado una sola vez: `success`, `warning`, `danger`, `info`, `secondary`, `waiting`, `highlight`.
- Reutilizar tokens y helpers para:
  - chips
  - banners de estado
  - bordes de cards
  - fondos contextuales

### Criterio de salida

- Todo repairs privado y publico queda en Tailwind.
- Se puede borrar el bloque `repair-*` completo de `app.css`.

## Fase 8 - Limpieza final, deuda tecnica y endurecimiento

### Objetivo

Cerrar la migracion eliminando CSS legacy, estabilizando performance y dejando una base mantenible.

### Tareas

- Eliminar reglas legacy ya sin uso de `app.css`.
- Confirmar que no queden clases semanticas antiguas en JSX.
- Verificar que `rg "className=.*(site-|catalog-|product-|cart-|services-|admin-|repair-|btn)" resources/js` no devuelva deuda residual, salvo casos justificados.
- Revisar bundle CSS final y recortar lo innecesario.
- Revisar responsive en breakpoints reales.
- Revisar focus states, hover states y accesibilidad visual.
- Revisar `resources/views/welcome.blade.php`:
  - decidir si queda fuera de alcance por ser scaffold
  - o alinearlo para no mantener dos lenguajes visuales

### Criterio de salida

- `resources/css/app.css` queda reducido a una base minima.
- La app completa usa Tailwind como fuente primaria de estilos.
- No quedan dependencias visuales del CSS legacy.

## Orden recomendado de ejecucion

1. Fase 0
2. Fase 1
3. Fase 2
4. Fase 3
5. Fase 4
6. Fase 5
7. Fase 6
8. Fase 7
9. Fase 8

## Estrategia de verificacion por fase

- `npm run build` al cierre de cada fase
- smoke E2E del dominio tocado
- comparacion visual desktop:
  - 1440px
- comparacion visual tablet:
  - 1024px
- comparacion visual mobile:
  - 390px o 393px
- chequeo manual de:
  - tipografia
  - sombras
  - gradientes
  - radios
  - spacing vertical
  - estados hover/focus/disabled
  - overflow horizontal
  - altura de cards y tablas

## Riesgos principales y mitigacion

- Riesgo: romper la identidad visual al pasar de gradientes y sombras custom a utilidades genericas.
  - Mitigacion: modelar tokens primero y validar por screenshots.
- Riesgo: mezclar migracion visual con refactor de componentes complejos.
  - Mitigacion: mantener logica intacta y tocar primero solo clases/markup minimo.
- Riesgo: dejar Tailwind a medias con clases custom nuevas.
  - Mitigacion: prohibir nuevas clases semanticas legacy durante la migracion.
- Riesgo: tests E2E fragiles por selectores CSS.
  - Mitigacion: mover tests a roles, textos y `data-*` estables.
- Riesgo: explosiones de className dificiles de mantener.
  - Mitigacion: crear primitives/variants reutilizables en JSX y helper `cn()` si hace falta.

## Criterio de exito final

- La aplicacion completa queda visualmente equivalente a la actual.
- Tailwind pasa a ser la unica fuente primaria de estilos.
- `app.css` deja de contener la implementacion visual completa del producto.
- Los tests funcionales y la validacion visual cubren storefront, admin y repairs.
- La base queda lista para futuras pantallas sin volver a CSS tradicional.

## Recomendacion operativa

La migracion no deberia ejecutarse como un mega PR unico. Conviene trabajar por fases cerradas y mergeables, idealmente con este corte:

- PR 1: baseline + fundacion Tailwind
- PR 2: shells compartidos + storefront
- PR 3: auth + admin simple
- PR 4: admin complejo
- PR 5: repairs
- PR 6: limpieza final y remocion de CSS legacy

Ese enfoque reduce mucho el riesgo, acelera QA y permite detectar rapido cualquier deriva visual.
