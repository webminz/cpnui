import { test, expect } from '@playwright/test';

test.describe('Basic workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.canvas-svg');
  });

  test('create place via palette click + canvas click', async ({ page }) => {
    // Click the Place tool button
    await page.click('.tool-btn:has-text("Place")');
    // Click on the SVG canvas to create a place
    const svg = page.locator('.canvas-svg');
    await svg.click({ position: { x: 400, y: 300 } });
    // A circle (place shape) should appear
    const places = page.locator('.place-shape');
    await expect(places).toHaveCount(1);
  });

  test('create transition via palette', async ({ page }) => {
    await page.click('.tool-btn:has-text("Transition")');
    const svg = page.locator('.canvas-svg');
    await svg.click({ position: { x: 500, y: 300 } });
    const transitions = page.locator('.transition-shape');
    await expect(transitions).toHaveCount(1);
  });

  test('create arc between place and transition', async ({ page }) => {
    // Create a place
    await page.click('.tool-btn:has-text("Place")');
    const svg = page.locator('.canvas-svg');
    await svg.click({ position: { x: 300, y: 300 } });
    await expect(page.locator('.place-shape')).toHaveCount(1);

    // Create a transition
    await page.click('.tool-btn:has-text("Transition")');
    await svg.click({ position: { x: 600, y: 300 } });
    await expect(page.locator('.transition-shape')).toHaveCount(1);

    // Switch to Arc mode and click place then transition
    await page.click('.tool-btn:has-text("Arc")');
    // Click on the place (near center)
    await page.locator('.place-shape').click();
    // Click on the transition (near center)
    await page.locator('.transition-shape').click();

    // Arc path should appear
    const arcs = page.locator('.arc-line');
    await expect(arcs).toHaveCount(1);
  });

  test('select element shows orange selection ring', async ({ page }) => {
    // Create a place
    await page.click('.tool-btn:has-text("Place")');
    const svg = page.locator('.canvas-svg');
    await svg.click({ position: { x: 400, y: 300 } });

    // Switch to Select mode
    await page.click('.tool-btn:has-text("Select")');
    // Click on the place
    await page.locator('.place-shape').click();
    // Selection ring should appear
    await expect(page.locator('.selection-ring')).toHaveCount(1);
  });

  test('delete selected element', async ({ page }) => {
    // Create a place
    await page.click('.tool-btn:has-text("Place")');
    const svg = page.locator('.canvas-svg');
    await svg.click({ position: { x: 400, y: 300 } });
    await expect(page.locator('.place-shape')).toHaveCount(1);

    // Select it
    await page.click('.tool-btn:has-text("Select")');
    await page.locator('.place-shape').click();
    // Delete it
    await page.keyboard.press('Delete');
    await expect(page.locator('.place-shape')).toHaveCount(0);
  });

  test('undo restores deleted element, redo removes it again', async ({ page }) => {
    // Create a place
    await page.click('.tool-btn:has-text("Place")');
    const svg = page.locator('.canvas-svg');
    await svg.click({ position: { x: 400, y: 300 } });
    await expect(page.locator('.place-shape')).toHaveCount(1);

    // Select and delete
    await page.click('.tool-btn:has-text("Select")');
    await page.locator('.place-shape').click();
    await page.keyboard.press('Delete');
    await expect(page.locator('.place-shape')).toHaveCount(0);

    // Undo → element restored
    await page.keyboard.press('Meta+z');
    await expect(page.locator('.place-shape')).toHaveCount(1);

    // Redo → removed again
    await page.keyboard.press('Meta+Shift+z');
    await expect(page.locator('.place-shape')).toHaveCount(0);
  });

  test('property panel shows when place is selected', async ({ page }) => {
    // Create a place
    await page.click('.tool-btn:has-text("Place")');
    const svg = page.locator('.canvas-svg');
    await svg.click({ position: { x: 400, y: 300 } });

    // Select it
    await page.click('.tool-btn:has-text("Select")');
    await page.locator('.place-shape').click();

    // Property panel should be visible with the place name field
    const panel = page.locator('.panel.visible');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.panel-kind')).toHaveText('Place');

    // Change name
    const nameInput = panel.locator('.field-input').first();
    await nameInput.fill('MyPlace');
    await nameInput.blur();

    // Label on canvas should update
    await expect(page.locator('.element-label').first()).toHaveText('MyPlace');
  });

  test('keyboard shortcut P activates Place mode', async ({ page }) => {
    // Press P
    await page.keyboard.press('p');
    // The Place button should be active
    await expect(page.locator('.tool-btn:has-text("Place")')).toHaveClass(/active/);
    // SVG cursor should be crosshair
    const svg = page.locator('.canvas-svg');
    await expect(svg).toHaveCSS('cursor', 'crosshair');
  });

  test('keyboard shortcut V activates Select mode', async ({ page }) => {
    // First switch to Place mode
    await page.keyboard.press('p');
    // Then switch back to Select
    await page.keyboard.press('v');
    await expect(page.locator('.tool-btn:has-text("Select")')).toHaveClass(/active/);
  });

  test('Escape returns to select mode', async ({ page }) => {
    await page.keyboard.press('p');
    await expect(page.locator('.tool-btn:has-text("Place")')).toHaveClass(/active/);
    await page.keyboard.press('Escape');
    await expect(page.locator('.tool-btn:has-text("Select")')).toHaveClass(/active/);
  });
});
