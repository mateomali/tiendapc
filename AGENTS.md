charset = utf-8

# Local server

When the user asks to start the local page/server, use:

```powershell
powershell -ExecutionPolicy Bypass -File tools\start-local-server.ps1
```

Default local mode must serve Laravel at `http://127.0.0.1:8090` with compiled assets from `public/build`.

Do not start Vite by default. Remove `public/hot` or use the script above so Laravel does not try to load `http://192.168.1.48:5173` or any Vite HMR WebSocket. The previous symptom was:

```text
Error de frontend
Error: WebSocket closed without opened.
```

Only use Vite/HMR when explicitly requested, via:

```powershell
powershell -ExecutionPolicy Bypass -File tools\start-local-server.ps1 -WithVite
```

Use the bundled PHP first, preferably `C:\tiendapc\.tools\php-8.3.31\php.exe`, because the global PATH PHP may be `8.0.30` while this Laravel project requires PHP `^8.3`.
