import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
const password = execFileSync('.tools/php-8.3.31/php.exe', ['-r', "require 'vendor/autoload.php'; $app = require 'bootstrap/app.php'; $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); echo config('tienda.repair_tech_password');"], {encoding:'utf8'}).trim();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('http://127.0.0.1:8090/consulta');
await page.locator('input[type=password]').fill(password);
await page.locator('button[type=submit]').click();
await page.waitForTimeout(1000);
await page.goto('http://127.0.0.1:8090/ingreso');
await page.locator('.intake-form').waitFor();
await page.locator('.intake-equipment select').first().selectOption({label: 'Celulares'});
await page.locator('.intake-client > label').nth(1).locator('input').fill('Prueba visual');
console.log(page.url(), (await page.locator('body').innerText()).slice(0,1800));
for (const width of [320,375,430,768,1024,1366,1920]) {
    await page.setViewportSize({width,height:900});
    await page.waitForTimeout(150);
    const next = page.getByRole('button', {name: 'Siguiente', exact: true});
    if (await next.isVisible() && await next.isEnabled()) {
        await next.click();
    }
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
    await page.waitForTimeout(150);
    await page.screenshot({path:`tmp/intake-review-${width}.png`,fullPage:true});
    console.log(width,await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,form:!!document.querySelector('.intake-form'),overflow:[...document.querySelectorAll('.intake-form *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>e.tagName).slice(0,12)})));
}
await browser.close();
