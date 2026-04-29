# Deploy Hostinger

## Estado del servidor

- El servidor de Hostinger ya fue actualizado a PHP 8.4.
- No volver a tratar el error `Composer dependencies require PHP >= 8.4` desde el bundle.
- El acceso disponible en Hostinger es solo a `public_html`, no a una carpeta hermana fuera del web root.

## Comando correcto para publicar

Generar siempre el bundle con:

```powershell
powershell -ExecutionPolicy Bypass -File tools\build-hostinger-bundle.ps1 -PublicHtmlOnly -IncludeServerEnv -Zip
```

El ZIP generado queda en `dist/` con nombre similar a:

```text
hostinger_public_html_only_YYYYMMDD_HHMMSS.zip
```

## Regla para futuras publicaciones

- No crear parches sueltos salvo que se pida explicitamente una emergencia puntual.
- Publicar siempre un bundle completo saneado con el comando anterior.
- El error PHP ya fue corregido en el servidor; no volver a resolverlo desde el bundle.
- La correccion del manifest ya forma parte del proceso normal de publicacion.

## Como subir

Extraer el ZIP directamente dentro de:

```text
domains/sudokumerlo.com/public_html
```

La estructura final esperada dentro de `public_html` es:

```text
index.php
.htaccess
assets/
build/
uploads/
laravel_app/
```

## Puntos importantes ya resueltos

- `index.php` define `LARAVEL_PUBLIC_PATH` apuntando a `public_html`.
- `laravel_app/bootstrap/app.php` respeta `LARAVEL_PUBLIC_PATH`.
- Esto evita el error de Vite manifest buscado en `laravel_app/public/build/manifest.json`.
- El manifest correcto queda en `public_html/build/manifest.json`.
- `.htaccess` bloquea acceso web a `laravel_app`.
- El bundle excluye `public/hot`, logs y backups reales.

## Despues de reemplazar archivos

Si aparece una vista vieja o error de manifest, vaciar:

```text
public_html/laravel_app/storage/framework/views/
```

Dejar `.gitignore` si existe.

## Credenciales

El modo `-IncludeServerEnv` genera `laravel_app/.env` con las credenciales de servidor acordadas para `sudokumerlo.com`.

No compartir publicamente los ZIP generados con `-IncludeServerEnv`.
