import { defineConfig } from 'playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    use: {
        baseURL: process.env.APP_URL ?? 'http://127.0.0.1:8787',
        trace: 'on-first-retry',
    },
    webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
        ? undefined
        : {
              command:
                  "powershell -NoProfile -Command \"Set-Location 'C:\\tienda-nuevo-stack'; & 'C:\\tienda-nuevo-stack\\tools\\php-8.5.1\\php.exe' artisan migrate:fresh --seed --force; & 'C:\\tienda-nuevo-stack\\tools\\php-8.5.1\\php.exe' -S 127.0.0.1:8787 router.php\"",
              port: 8787,
              reuseExistingServer: true,
              timeout: 120000,
              env: {
                  APP_ENV: 'local',
                  APP_URL: 'http://127.0.0.1:8787',
                  DB_CONNECTION: 'sqlite',
                  DB_DATABASE: 'database/database.sqlite',
              },
          },
});
