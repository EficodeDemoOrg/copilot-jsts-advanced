import { test, expect } from '@playwright/test';

test.describe('Weather Dashboard', () => {
  test('loads the dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.header__title')).toContainText('Weather App');
    await expect(page.locator('#search-form')).toBeVisible();
  });

  test('shows search form with all fields', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#search-lat')).toBeVisible();
    await expect(page.locator('#search-lon')).toBeVisible();
    await expect(page.locator('#search-units')).toBeVisible();
    await expect(page.locator('#search-button')).toBeVisible();
  });

  test('shows saved locations sidebar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.sidebar__title')).toContainText('Saved Locations');
    await expect(page.locator('#location-form')).toBeVisible();
  });

  test('can save and delete a location', async ({ page }) => {
    await page.goto('/');

    // Add a location
    await page.fill('#location-name', 'Test Location');
    await page.fill('#location-lat', '51.51');
    await page.fill('#location-lon', '-0.13');
    await page.click('.sidebar__button');

    // Verify it appears in the list
    await expect(page.locator('.location-item__name')).toContainText('Test Location');

    // Delete it
    await page.click('.location-item__delete');
    await expect(page.locator('.location-item')).toHaveCount(0);
  });

  test('current weather card is hidden initially', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#current-weather')).toBeHidden();
  });

  test('forecast section is hidden initially', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#forecast-section')).toBeHidden();
  });

  test('alerts section is hidden initially', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#alerts-section')).toBeHidden();
  });
});
