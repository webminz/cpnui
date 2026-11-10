import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const SAMPLE_DIR = path.resolve(__dirname, '../../samples');

test.describe('Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.canvas-svg');
  });

  test('import PetriNet.cpn and verify elements appear', async ({ page }) => {
    const filePath = path.join(SAMPLE_DIR, 'PetriNet.cpn');

    // Use the hidden file input to upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Verify places (circles) appear — PetriNet.cpn has 2 places
    await expect(page.locator('.place-shape')).toHaveCount(2);
    // Verify transition (rect) — 1 transition
    await expect(page.locator('.transition-shape')).toHaveCount(1);
    // Verify arcs — 2 arcs
    await expect(page.locator('.arc-line')).toHaveCount(2);
  });

  test('import ResourceAllocation.cpn and verify complex model', async ({ page }) => {
    const filePath = path.join(SAMPLE_DIR, 'ResourceAllocation.cpn');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Wait for places to appear (ResourceAllocation has many places)
    await expect(page.locator('.place-shape').first()).toBeVisible();

    const placeCount = await page.locator('.place-shape').count();
    expect(placeCount).toBeGreaterThanOrEqual(7);

    const transCount = await page.locator('.transition-shape').count();
    expect(transCount).toBeGreaterThanOrEqual(5);

    const arcCount = await page.locator('.arc-line').count();
    expect(arcCount).toBeGreaterThanOrEqual(15);
  });

  test('export and re-import preserves structure', async ({ page }) => {
    const filePath = path.join(SAMPLE_DIR, 'PetriNet.cpn');

    // Import
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await expect(page.locator('.place-shape')).toHaveCount(2);

    // Export by clicking Save (triggers download)
    const downloadPromise = page.waitForEvent('download');
    await page.click('.toolbar-btn:has-text("Save")');
    const download = await downloadPromise;

    // Save the downloaded file to a temp location
    const downloadPath = path.join(SAMPLE_DIR, '..', 'cpn-editor', 'e2e', 'test-export.cpn');
    await download.saveAs(downloadPath);

    // Click New to clear
    await page.click('.toolbar-btn:has-text("New")');
    await expect(page.locator('.place-shape')).toHaveCount(0);

    // Re-import the exported file
    await fileInput.setInputFiles(downloadPath);
    await expect(page.locator('.place-shape')).toHaveCount(2);
    await expect(page.locator('.transition-shape')).toHaveCount(1);
    await expect(page.locator('.arc-line')).toHaveCount(2);

    // Cleanup
    fs.unlinkSync(downloadPath);
  });

  test('New button resets the canvas', async ({ page }) => {
    // Import a file first
    const filePath = path.join(SAMPLE_DIR, 'PetriNet.cpn');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await expect(page.locator('.place-shape')).toHaveCount(2);

    // Click New
    await page.click('.toolbar-btn:has-text("New")');

    // Canvas should be empty
    await expect(page.locator('.place-shape')).toHaveCount(0);
    await expect(page.locator('.transition-shape')).toHaveCount(0);
    await expect(page.locator('.arc-line')).toHaveCount(0);
  });
});
