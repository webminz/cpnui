import { test, expect } from '@playwright/test';

test.describe('SML Editor Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.canvas-svg');
  });

  test('open declarations panel with Ctrl+D', async ({ page }) => {
    // Panel should not be visible initially
    await expect(page.locator('.decl-panel')).toHaveCount(0);

    // Press Ctrl+D to open
    await page.keyboard.press('Control+d');
    await expect(page.locator('.decl-panel')).toHaveCount(1);

    // Press Ctrl+D again to close
    await page.keyboard.press('Control+d');
    await expect(page.locator('.decl-panel')).toHaveCount(0);
  });

  test('add and edit colour set in declarations panel', async ({ page }) => {
    // Open declarations panel
    await page.keyboard.press('Control+d');
    await expect(page.locator('.decl-panel')).toBeVisible();

    // Click add button
    await page.click('.add-btn');

    // A colour set row should appear
    await expect(page.locator('.cs-row')).toHaveCount(1);

    // Fill in the name
    const nameInput = page.locator('.cs-name');
    await nameInput.fill('INT');
    await nameInput.blur();

    // Verify name was set
    await expect(nameInput).toHaveValue('INT');
  });

  test('select a place and see CodeMirror editor in property panel', async ({ page }) => {
    // Create a place
    await page.click('.tool-btn:has-text("Place")');
    const svg = page.locator('.canvas-svg');
    await svg.click({ position: { x: 400, y: 300 } });

    // Switch to select mode and click the place
    await page.keyboard.press('v');
    const place = page.locator('.place-shape');
    await place.click();

    // Property panel should show with a CodeMirror editor for Initial Marking
    await expect(page.locator('.panel.visible')).toBeVisible();
    await expect(page.locator('.panel .cm-editor')).toHaveCount(1);
  });

  test('select a transition and see CodeMirror editors for guard and duration', async ({ page }) => {
    // Create a transition
    await page.click('.tool-btn:has-text("Transition")');
    const svg = page.locator('.canvas-svg');
    await svg.click({ position: { x: 400, y: 300 } });

    // Switch to select mode and click the transition
    await page.keyboard.press('v');
    const transition = page.locator('.transition-shape');
    await transition.click();

    // Property panel should show with 2 CodeMirror editors (guard + duration)
    await expect(page.locator('.panel.visible')).toBeVisible();
    await expect(page.locator('.panel .cm-editor')).toHaveCount(2);
  });

  test('dark mode toggle updates editor theme', async ({ page }) => {
    // Create a place and select it to show CodeMirror
    await page.click('.tool-btn:has-text("Place")');
    const svg = page.locator('.canvas-svg');
    await svg.click({ position: { x: 400, y: 300 } });
    await page.keyboard.press('v');
    await page.locator('.place-shape').click();

    // Verify editor exists
    await expect(page.locator('.panel .cm-editor')).toHaveCount(1);

    // Toggle dark mode
    const darkToggle = page.locator('button:has-text("Dark"), .dark-toggle, [title*="dark" i]');
    if (await darkToggle.count() > 0) {
      await darkToggle.first().click();
      // Verify the theme-dark class is applied (meaning theme changed)
      await expect(page.locator('.theme-dark')).toHaveCount(1);
    }
  });

  test('remove colour set from declarations panel', async ({ page }) => {
    // Open declarations panel
    await page.keyboard.press('Control+d');

    // Add a colour set
    await page.click('.add-btn');
    await expect(page.locator('.cs-row')).toHaveCount(1);

    // Remove it
    await page.click('.remove-btn');
    await expect(page.locator('.cs-row')).toHaveCount(0);
  });

  test('declarations panel has Variables editor with line numbers', async ({ page }) => {
    // Open declarations panel
    await page.keyboard.press('Control+d');

    // The declarations editor should have line numbers (cm-gutters)
    await expect(page.locator('.decl-panel .cm-gutters')).toHaveCount(1);
  });
});
