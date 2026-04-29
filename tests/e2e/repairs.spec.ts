import { expect, test } from '@playwright/test';

test('public repairs tracking renders the legacy-like public shell', async ({ page }) => {
    await page.goto('/reparacion');

    await expect(page.getByRole('heading', { name: /Estado de su repar/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Consultar' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Consultas:/ })).toBeVisible();
    await expect(page.getByText('SUDOKU -')).toBeVisible();
});

test('public repairs tracking renders found and not found states', async ({ page }) => {
    await page.goto('/reparacion?id_buscado=1&dni_buscado=22333444');

    await expect(page.getByText('ORDEN #1 - PlayStation 4')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Imagen/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Consultar otra orden' })).toBeVisible();

    await page.goto('/reparacion?id_buscado=999&dni_buscado=22333444');

    await expect(page.getByText(/No se encontr/i)).toBeVisible();
});

test('repair tech login screen is reachable', async ({ page }) => {
    await page.goto('/consulta');

    await expect(page.getByText('Mesa de reparaciones')).toBeVisible();
    await expect(page.getByPlaceholder('Clave tecnica')).toBeVisible();
});
