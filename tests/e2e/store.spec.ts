import { expect, test } from '@playwright/test';

test('catalog storefront shows legacy search shell and sellable products', async ({ page }) => {
    await page.goto('/productos');

    await expect(page.getByText('BUSCAR PRODUCTOS:')).toBeVisible();
    await expect(page.getByRole('link', { name: 'REPARACIONES' })).toBeVisible();
    await expect(page.getByText(/PRODUCTOS DISPONIBLES/i)).toBeVisible();
    await expect(page.getByTestId('catalog-product-card').first()).toBeVisible();
});

test('catalog category and subcategory filters follow legacy visibility rules', async ({ page }) => {
    await page.goto('/productos');

    const categorySelect = page.getByTestId('catalog-group-select');

    await expect(categorySelect).toHaveValue('');
    await expect(page.getByTestId('catalog-subcategory-select')).toHaveCount(0);

    const nextGroupValue = await categorySelect.evaluate((select) => {
        const options = Array.from(select.querySelectorAll('option'));
        const selectableOption = options.find((option) => option.value !== '');

        return selectableOption?.value ?? '';
    });

    expect(nextGroupValue).not.toBe('');

    await categorySelect.selectOption(nextGroupValue);

    const subcategorySelect = page.getByTestId('catalog-subcategory-select');

    await expect(page).toHaveURL(new RegExp(`[?&]grupo=${nextGroupValue}(?:[&]|$)`));
    await expect(subcategorySelect).toBeVisible();
    await expect(subcategorySelect).toHaveValue('');

    const nextCategoryValue = await subcategorySelect.evaluate((select) => {
        const options = Array.from(select.querySelectorAll('option'));
        const selectableOption = options.find((option) => option.value !== '');

        return selectableOption?.value ?? '';
    });

    expect(nextCategoryValue).not.toBe('');

    await subcategorySelect.selectOption(nextCategoryValue);

    await expect(page).toHaveURL(new RegExp(`[?&]grupo=${nextGroupValue}(?:[&]|$)`));
    await expect(page).toHaveURL(new RegExp(`[?&]categoria=${nextCategoryValue}(?:[&]|$)`));

    await categorySelect.selectOption('');

    await expect(categorySelect).toHaveValue('');
    await expect(page.getByTestId('catalog-subcategory-select')).toHaveCount(0);
    await expect(page).not.toHaveURL(/([?&]grupo=|[?&]categoria=)/);
});
