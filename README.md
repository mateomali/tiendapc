# Tienda Nuevo Stack

## Desarrollo local

- `powershell -ExecutionPolicy Bypass -File tools\start-local-server.ps1`: levanta la pagina local en `http://127.0.0.1:8090`.
- `powershell -ExecutionPolicy Bypass -File tools\start-local-server.ps1 -Restart`: reinicia Laravel y Vite si quedaron procesos viejos.
- `composer dev`: levanta el entorno solo para la PC local.
- `composer run dev:lan`: expone Laravel y Vite para acceder desde otra PC de la misma red.

## Acceso desde otra PC

1. En la PC servidor, ejecuta `composer run dev:lan`.
2. Averigua la IP local del servidor, por ejemplo con `ipconfig`.
3. Desde otra PC abre `http://IP_DEL_SERVIDOR:8090`.

Si la pantalla queda en blanco, normalmente es porque el navegador remoto no puede cargar Vite/HMR. En ese caso define estas variables en `.env` y vuelve a iniciar:

```env
APP_URL=http://IP_DEL_SERVIDOR:8090
VITE_HOST=0.0.0.0
VITE_PORT=5173
VITE_HMR_HOST=IP_DEL_SERVIDOR
```

Ejemplo:

```env
APP_URL=http://192.168.1.48:8090
VITE_HMR_HOST=192.168.1.48
```

Tambien verifica que Windows Defender Firewall permita conexiones entrantes a los puertos `8090` y `5173`.

## Sudoku Admin para Windows

La app de escritorio esta preparada con Tauri en `src-tauri/` y carga el panel online:

```text
https://www.sudokumerlo.com/admin
```

Comandos:

```bash
npm run desktop:dev
npm run desktop:build
```

Atajos de la app:

- `Ctrl+R`: recargar el panel.
- `Ctrl+L`: volver a `/admin`.
- `F11`: alternar pantalla completa.

Requisitos para compilar el instalador en Windows:

- Microsoft Edge WebView2 Runtime.
- Rust instalado con rustup.
- Visual Studio Build Tools 2022 con MSVC y Windows SDK.

El comando `npx tauri info` revisa esos requisitos. El instalador queda en `src-tauri/target/release/bundle/` cuando `npm run desktop:build` termina correctamente.
