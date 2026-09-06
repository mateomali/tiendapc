charset = utf-8

# Encoding rules (mandatory)

- All source files in this repo MUST stay **UTF-8 without BOM** with **LF** line endings (`* text=auto eol=lf` in `.gitattributes`).
- Never rewrite an existing file with Windows PowerShell `Get-Content` / `Set-Content` / `WriteAllLines` **without explicitly passing `-Encoding UTF8`**: on this machine the default is ANSI/Windows-1252 and it silently corrupts every accented character (mojibake like `Ã¡`, `Ã±`, `Ã©`). This already happened once on `WorkbenchPage.tsx`.
- Preferred file writes: the `write` / `edit` tools, or Node.js scripts using `fs.writeFileSync(file, text, 'utf8')`. When PowerShell is unavoidable, always use `[System.IO.File]::WriteAllText($f, $text, (New-Object System.Text.UTF8Encoding($false)))` (no BOM) and read with `Get-Content -Raw -Encoding UTF8`.
- After touching any file with accents, verify with a strict UTF-8 scan (e.g. Node `new TextDecoder('utf-8', { fatal: true })`) that there are no invalid sequences and no mojibake artifacts (`Ã`, `Â`, `â€`, `ï¿½`, replacement char).

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

# Hostinger bundle

When the user asks to create a safe Hostinger bundle, use:

```powershell
powershell -ExecutionPolicy Bypass -File tools\create-safe-hostinger-bundle.ps1
```

This must generate a ZIP ready to extract directly inside Hostinger `public_html`, with `laravel_app` also inside `public_html` and protected by `.htaccess`. Do not use the split `public_html` + sibling `laravel_app` mode unless the user explicitly asks for that structure.
