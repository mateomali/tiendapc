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
  const overlay = document.createElement('div');
  overlay.id = overlayId;
  overlay.className = 'fixed inset-0 z-[2147483647] hidden place-items-center bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_100%)] p-6 font-sans text-slate-900';
  overlay.innerHTML = `
    <div class="w-[min(440px,100%)] rounded-[18px] border border-blue-200 bg-white/95 p-[22px] text-center shadow-[0_24px_60px_rgba(15,23,42,0.14)]" role="status" aria-live="polite">
      <h1 class="mb-2 text-xl font-black">No se pudo conectar con Sudoku Admin</h1>
      <p class="mb-4 text-sm font-bold leading-6 text-slate-700">Revisa la conexion a internet. Si el sitio esta tardando, proba recargar el panel.</p>
      <button class="min-h-10 cursor-pointer rounded-xl bg-blue-600 px-4 text-sm font-black text-white" type="button">Recargar</button>
    </div>
  `;
  overlay.querySelector('button').addEventListener('click', () => window.location.reload());
  document.body.appendChild(overlay);

  const show = () => {
    overlay.classList.remove('hidden');
    overlay.classList.add('grid');
  };
  const hide = () => {
    overlay.classList.add('hidden');
    overlay.classList.remove('grid');
  };

  if (!navigator.onLine) show();
  window.addEventListener('offline', show);
  window.addEventListener('online', hide);
})();
"#;
