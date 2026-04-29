#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .on_page_load(|webview, payload| {
      if payload.event() == tauri::webview::PageLoadEvent::Finished {
        let _ = webview.eval(DESKTOP_STATUS_SCRIPT);
      }
    })
    .setup(|app| {
      use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
      use tauri::Manager;

      let handle = app.handle();
      let app_menu = SubmenuBuilder::new(handle, "Aplicacion")
        .item(
          &MenuItemBuilder::with_id("reload", "Recargar panel")
            .accelerator("Ctrl+R")
            .build(handle)?,
        )
        .item(
          &MenuItemBuilder::with_id("home", "Volver al panel")
            .accelerator("Ctrl+L")
            .build(handle)?,
        )
        .separator()
        .item(
          &MenuItemBuilder::with_id("fullscreen", "Pantalla completa")
            .accelerator("F11")
            .build(handle)?,
        )
        .separator()
        .quit_with_text("Salir")
        .build()?;
      let menu = MenuBuilder::new(handle).item(&app_menu).build()?;
      app.set_menu(menu)?;

      handle.on_menu_event(|app, event| {
        let Some(window) = app.get_webview_window("main") else {
          return;
        };

        match event.id().as_ref() {
          "reload" => {
            let _ = window.reload();
          }
          "home" => {
            if let Ok(url) = "https://www.sudokumerlo.com/admin".parse() {
              let _ = window.navigate(url);
            }
          }
          "fullscreen" => {
            if let Ok(is_fullscreen) = window.is_fullscreen() {
              let _ = window.set_fullscreen(!is_fullscreen);
            }
          }
          _ => {}
        }
      });

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

const DESKTOP_STATUS_SCRIPT: &str = r#"
(() => {
  if (window.__sudokuDesktopStatusInstalled) return;
  window.__sudokuDesktopStatusInstalled = true;

  const overlayId = 'sudoku-desktop-status-overlay';
  const styles = `
    #${overlayId} {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: none;
      place-items: center;
      padding: 24px;
      background: linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%);
      color: #0f172a;
      font-family: Inter, Segoe UI, Arial, sans-serif;
    }
    #${overlayId}.is-visible { display: grid; }
    #${overlayId} .panel {
      width: min(440px, 100%);
      border: 1px solid #bfdbfe;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
      padding: 22px;
      text-align: center;
    }
    #${overlayId} h1 {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 900;
    }
    #${overlayId} p {
      margin: 0 0 16px;
      color: #334155;
      font-size: 14px;
      font-weight: 650;
      line-height: 1.5;
    }
    #${overlayId} button {
      min-height: 40px;
      border: 0;
      border-radius: 12px;
      background: #0d6efd;
      color: white;
      padding: 0 16px;
      font: inherit;
      font-size: 14px;
      font-weight: 850;
      cursor: pointer;
    }
  `;

  const style = document.createElement('style');
  style.textContent = styles;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = overlayId;
  overlay.innerHTML = `
    <div class="panel" role="status" aria-live="polite">
      <h1>No se pudo conectar con Sudoku Admin</h1>
      <p>Revisa la conexion a internet. Si el sitio esta tardando, proba recargar el panel.</p>
      <button type="button">Recargar</button>
    </div>
  `;
  overlay.querySelector('button').addEventListener('click', () => window.location.reload());
  document.body.appendChild(overlay);

  const show = () => overlay.classList.add('is-visible');
  const hide = () => overlay.classList.remove('is-visible');

  if (!navigator.onLine) show();
  window.addEventListener('offline', show);
  window.addEventListener('online', hide);
})();
"#;
