# Plan De Migracion Tienda

## Resumen
Migracion de `C:\tienda-abril` a un monolito Laravel 13.6 + Inertia 3 + React 19.2.5 + TypeScript 6.0.3, preservando rutas publicas, backoffice, reparaciones y storage legacy dentro de `C:\tienda-nuevo-stack`.

## Arquitectura Propuesta
```text
Browser
  -> Inertia 3
    -> React 19.2.5 + TypeScript strict + Tailwind 4.2.4
      -> Laravel 13.6 Controllers / Form Requests / Policies / Services
        -> Eloquent Models
          -> MySQL 8.4.8 LTS
        -> public/assets/uploads + public/uploads + backups ZIP
```

## Estado Implementado
- Laravel 13 + Inertia + React + TS + Tailwind + Vite montados en el repo destino.
- Rutas legacy preservadas para storefront, auth, admin y reparaciones.
- Migraciones explicitas para catalogo, configuracion, media, ventas, orders y reparaciones.
- Modelos y servicios para carrito, ventas, backups y reparaciones.
- UI Inertia para catalogo, producto, carrito, login, admin, media, ventas, backups y reparaciones.
- Restauracion de backups ZIP implementada.
- Ziggy integrado para mantener helpers `route(...)` en React.
- Pest y Playwright inicializados para smoke tests.

## Estrategia De Datos
1. Exportar schema y conteos del sistema legacy.
2. Crear el esquema Laravel como superset del schema actual.
3. Migrar tablas canonicas: `categories`, `products`, `users`, `sales`, `sale_items`, `site_*`, `media_library`, `orders`, `order_items`, `pages`, `posts`, `ordenes`, `orden_eventos`.
4. Copiar uploads legacy a `public/assets/uploads/products`, `public/assets/uploads/library`, `public/uploads` y `public/uploads/thumbnails`.
5. Validar integridad con conteos, tickets, catalogo, anuncios, servicios y seguimiento de reparaciones.
6. Ejecutar corte `big bang` con freeze de escritura y smoke tests post-cutover.

## Breaking Changes
- Se elimina el runtime schema sync; todo queda en migraciones Laravel.
- Se reemplaza el bridge custom `View -> Bootstrap -> React bundle` por Inertia.
- Se encapsulan rate limiting, backups y locks en servicios Laravel.
- El acceso tecnico de reparaciones deja de depender de scripts sueltos y pasa a middleware + sesion.

## Roadmap Por Fases
1. Preparacion del entorno.
2. Migracion del core de base de datos y modelos.
3. Implementacion de controladores Inertia y endpoints JSON imprescindibles.
4. Desarrollo UI con React 19 y Tailwind 4.
5. Suite de pruebas con Pest y Playwright.

## Validacion
- `npm run build`
- `php artisan route:list`
- `php artisan test`
- `npx playwright test`
