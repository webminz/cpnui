import { test, expect } from '@playwright/test';

test.describe('Multi-select', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.canvas-svg');
  });

  test('rubber band selects enclosed elements', async ({ page }) => {
    // Create two places
    await page.click('.tool-btn:has-text("Place")');
    const svg = page.locator('.canvas-svg');
    await svg.click({ position: { x: 300, y: 300 } });
    await svg.click({ position: { x: 400, y: 300 } });
    await expect(page.locator('.place-shape')).toHaveCount(2);

    // Switch to select mode
    await page.click('.tool-btn:has-text("Select")');

    // Rubber-band drag from top-left to bottom-right to enclose both
    const svgBox = await svg.boundingBox();
    const startX = svgBox!.x + 250;
    const startY = svgBox!.y + 250;
    const endX = svgBox!.x + 450;
    const endY = svgBox!.y + 350;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 5 });

    // Rubber band rect should be visible during drag
    await expect(page.locator('.rubber-band')).toHaveCount(1);

    await page.mouse.up();

    // Both elements should be selected (2 selection rings)
    await expect(page.locator('.selection-ring')).toHaveCount(2);
  });

  test('multi-drag moves all selected elements', async ({ page }) => {
    // Create a place and a transition
    await page.click('.tool-btn:has-text("Place")');
    const svg = page.locator('.canvas-svg');
    await svg.click({ position: { x: 300, y: 300 } });

    await page.click('.tool-btn:has-text("Transition")');
    await svg.click({ position: { x: 500, y: 300 } });

    // Switch to select, rubber-band both
    await page.click('.tool-btn:has-text("Select")');
    const svgBox = await svg.boundingBox();
    await page.mouse.move(svgBox!.x + 250, svgBox!.y + 250);
    await page.mouse.down();
    await page.mouse.move(svgBox!.x + 550, svgBox!.y + 350, { steps: 5 });
    await page.mouse.up();
    await expect(page.locator('.selection-ring')).toHaveCount(2);

    // Record initial positions
    const placeCx = await page.locator('.place-shape').getAttribute('cx');
    const transX = await page.locator('.transition-shape').getAttribute('x');

    // Drag the place (both should move)
    const placeShape = page.locator('.place-shape');
    const placeBox = await placeShape.boundingBox();
    await page.mouse.move(placeBox!.x + placeBox!.width / 2, placeBox!.y + placeBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      placeBox!.x + placeBox!.width / 2 + 40,
      placeBox!.y + placeBox!.height / 2 + 40,
      { steps: 5 },
    );
    await page.mouse.up();

    // Both elements should have moved (positions changed)
    const newPlaceCx = await page.locator('.place-shape').getAttribute('cx');
    const newTransX = await page.locator('.transition-shape').getAttribute('x');
    expect(newPlaceCx).not.toBe(placeCx);
    expect(newTransX).not.toBe(transX);
  });
});
