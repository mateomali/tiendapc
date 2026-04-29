import { expect, test } from '@playwright/test';

async function loginAsAdmin(page: import('@playwright/test').Page): Promise<void> {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@tienda.local');
    await page.getByLabel(/password/i).fill('admin12345');
    await page.getByRole('button', { name: /ingresar|entrar|login/i }).click();
    await expect(page).toHaveURL(/\/admin$/);
}

test('admin login and dashboard shortcuts render', async ({ page }) => {
    await loginAsAdmin(page);

    await expect(page.getByText(/panel de control/i)).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Navegacion administrativa' }).getByRole('link', { name: 'Productos' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Navegacion administrativa' }).getByRole('link', { name: 'Backups' })).toBeVisible();
});

test('admin products table and inline save affordances are visible', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/productos');
    await expect(page).toHaveURL(/\/admin\/productos$/);
    await expect(page.getByText(/guardado inline/i)).toBeVisible();
    await expect(page.locator('[data-admin-product-row]').first()).toBeVisible();
});
