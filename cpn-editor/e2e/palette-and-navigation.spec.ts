import { test, expect } from '@playwright/test';

test.describe('Palette and navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.canvas-svg');
  });

  test('palette floats over canvas', async ({ page }) => {
    const palette = page.locator('.palette');
    await expect(palette).toBeVisible();

    // Canvas SVG should occupy the full width (no sidebar column)
    const svg = page.locator('.canvas-svg');
    const svgBox = await svg.boundingBox();
    // SVG should be close to full viewport width (1280 - minor padding)
    expect(svgBox!.width).toBeGreaterThan(1200);
  });

  test('zoom +/- buttons change toolbar zoom percentage', async ({ page }) => {
    const zoomDisplay = page.locator('.zoom-display');
    await expect(zoomDisplay).toHaveText('100%');

    // Click zoom in
    await page.click('button[title="Zoom in"]');
    await expect(zoomDisplay).not.toHaveText('100%');
    const zoomAfterIn = await zoomDisplay.textContent();
    expect(parseInt(zoomAfterIn!)).toBeGreaterThan(100);

    // Click zoom out three times to go below 100
    await page.click('button[title="Zoom out"]');
    await page.click('button[title="Zoom out"]');
    await page.click('button[title="Zoom out"]');
    await expect(zoomDisplay).not.toHaveText('100%');
    const zoomAfterOut = await zoomDisplay.textContent();
    expect(parseInt(zoomAfterOut!)).toBeLessThan(100);
  });

  test('theme toggle applies dark mode class', async ({ page }) => {
    const shell = page.locator('.app-shell');
    // Initially light mode
    await expect(shell).not.toHaveClass(/theme-dark/);

    // Click the theme toggle button
    await page.click('button:has-text("Dark")');
    await expect(shell).toHaveClass(/theme-dark/);

    // Toggle back
    await page.click('button:has-text("Light")');
    await expect(shell).not.toHaveClass(/theme-dark/);
  });
});
