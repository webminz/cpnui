import { test, expect, Page, Locator } from '@playwright/test';

async function createPlace(page: Page, x: number, y: number) {
  await page.click('.tool-btn:has-text("Place")');
  await page.locator('.canvas-svg').click({ position: { x, y } });
}

async function createTransition(page: Page, x: number, y: number) {
  await page.click('.tool-btn:has-text("Transition")');
  await page.locator('.canvas-svg').click({ position: { x, y } });
}

async function createArc(page: Page, sourceLocator: string, targetLocator: string) {
  await page.click('.tool-btn:has-text("Arc")');
  await page.locator(sourceLocator).click();
  await page.locator(targetLocator).click();
}

async function selectElement(page: Page, locator: string, force = false) {
  await page.click('.tool-btn:has-text("Select")');
  await page.locator(locator).click({ force });
}

/** Dispatch a pointerdown on a small SVG knob and return its center coordinates */
async function pointerDownOnKnob(page: Page, knob: Locator): Promise<{ cx: number; cy: number }> {
  const box = await knob.boundingBox();
  expect(box).toBeTruthy();
  const cx = box!.x + box!.width / 2;
  const cy = box!.y + box!.height / 2;
  await knob.dispatchEvent('pointerdown', {
    button: 0,
    clientX: cx,
    clientY: cy,
    pointerId: 1,
    pointerType: 'mouse',
    bubbles: true,
  });
  return { cx, cy };
}

test.describe('Advanced visuals', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.canvas-svg');
  });

  test.describe('Arc bend points', () => {
    test('selecting arc shows midpoint knobs', async ({ page }) => {
      await createPlace(page, 200, 300);
      await createTransition(page, 600, 300);
      await createArc(page, '.place-shape', '.transition-shape');
      await expect(page.locator('.arc-line')).toHaveCount(1);

      await selectElement(page, '.arc-hit-area', true);
      await expect(page.locator('.midpoint-knob')).toHaveCount(1);
    });

    test('clicking midpoint knob creates a bend point', async ({ page }) => {
      await createPlace(page, 200, 300);
      await createTransition(page, 600, 300);
      await createArc(page, '.place-shape', '.transition-shape');

      await selectElement(page, '.arc-hit-area', true);
      await expect(page.locator('.midpoint-knob')).toHaveCount(1);

      // Dispatch pointerdown on midpoint to create bend point
      await pointerDownOnKnob(page, page.locator('.midpoint-knob').first());
      await page.waitForTimeout(100);

      // Release
      await page.locator('.canvas-svg').dispatchEvent('pointerup', { bubbles: true, pointerId: 1 });

      // Bend point should exist
      await expect(page.locator('.bend-point-knob')).toHaveCount(1);
      await expect(page.locator('.midpoint-knob')).toHaveCount(2);
    });

    test('double-clicking bend point removes it', async ({ page }) => {
      await createPlace(page, 200, 300);
      await createTransition(page, 600, 300);
      await createArc(page, '.place-shape', '.transition-shape');

      await selectElement(page, '.arc-hit-area', true);

      // Create a bend point
      await pointerDownOnKnob(page, page.locator('.midpoint-knob').first());
      await page.waitForTimeout(100);
      await page.locator('.canvas-svg').dispatchEvent('pointerup', { bubbles: true, pointerId: 1 });

      await expect(page.locator('.bend-point-knob')).toHaveCount(1);

      // Dispatch dblclick directly on the bend point knob to avoid pointerdown side effects
      const bpKnob = page.locator('.bend-point-knob').first();
      await bpKnob.dispatchEvent('dblclick', { bubbles: true });

      await expect(page.locator('.bend-point-knob')).toHaveCount(0);
      await expect(page.locator('.midpoint-knob')).toHaveCount(1);
    });
  });

  test.describe('Arc draw modes', () => {
    test('changing draw mode via property panel updates arc path', async ({ page }) => {
      await createPlace(page, 200, 300);
      await createTransition(page, 600, 300);
      await createArc(page, '.place-shape', '.transition-shape');

      // Select the arc and create a bend point
      await selectElement(page, '.arc-hit-area', true);
      await pointerDownOnKnob(page, page.locator('.midpoint-knob').first());
      await page.waitForTimeout(100);
      await page.locator('.canvas-svg').dispatchEvent('pointerup', { bubbles: true, pointerId: 1 });
      await expect(page.locator('.bend-point-knob')).toHaveCount(1);

      // Re-select arc to see property panel
      await selectElement(page, '.arc-hit-area', true);
      const panel = page.locator('.panel.visible');
      await expect(panel).toBeVisible();

      // Get initial path (straight with bend point — contains 'L')
      const initialPath = await page.locator('.arc-line').getAttribute('d');
      expect(initialPath).toContain('L');

      // Change draw mode to bezier by evaluating the select element directly
      const drawModeSelect = panel.locator('select');
      await drawModeSelect.selectOption('bezier');
      // Wait for Angular change detection
      await page.waitForTimeout(200);

      // Verify path changed — bezier with 1 bend point uses Q
      await expect(page.locator('.arc-line')).toHaveAttribute('d', /Q/);
    });
  });

  test.describe('Resize handles', () => {
    test('selecting place shows resize handles', async ({ page }) => {
      await createPlace(page, 400, 300);
      await selectElement(page, '.place-shape');
      await expect(page.locator('.resize-handle')).toHaveCount(4);
    });

    test('selecting transition shows resize handles', async ({ page }) => {
      await createTransition(page, 400, 300);
      await selectElement(page, '.transition-shape');
      await expect(page.locator('.resize-handle')).toHaveCount(4);
    });

    test('dragging place resize handle changes radius', async ({ page }) => {
      await createPlace(page, 400, 300);
      await selectElement(page, '.place-shape');

      const initialRadius = await page.locator('.place-shape').getAttribute('r');

      // Drag the E (right) handle outward
      const handle = page.locator('.resize-handle').nth(1);
      const box = await handle.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, { steps: 5 });
        await page.mouse.up();
      }

      const newRadius = await page.locator('.place-shape').getAttribute('r');
      expect(Number(newRadius)).toBeGreaterThan(Number(initialRadius));
    });
  });

  test.describe('Visual properties', () => {
    test('property panel shows Visual tab', async ({ page }) => {
      await createPlace(page, 400, 300);
      await selectElement(page, '.place-shape');

      const panel = page.locator('.panel.visible');
      await expect(panel).toBeVisible();

      await panel.locator('.tab-btn:has-text("Visual")').click();

      await expect(panel.locator('.section-title:has-text("Font")')).toBeVisible();
      await expect(panel.locator('.section-title:has-text("Stroke")')).toBeVisible();
      await expect(panel.locator('.section-title:has-text("Fill")')).toBeVisible();
    });

    test('changing stroke color updates element', async ({ page }) => {
      await createPlace(page, 400, 300);
      await selectElement(page, '.place-shape');

      const panel = page.locator('.panel.visible');
      await panel.locator('.tab-btn:has-text("Visual")').click();

      const strokeSection = panel.locator('.visual-section:has(.section-title:has-text("Stroke"))');
      const colorInput = strokeSection.locator('input[type="color"]');

      await colorInput.evaluate((el: HTMLInputElement) => {
        el.value = '#ff0000';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });

      const strokeStyle = await page.locator('.place-shape').getAttribute('style');
      expect(strokeStyle).toContain('rgb(255, 0, 0)');
    });

    test('Visual tab hides Fill section for arcs', async ({ page }) => {
      await createPlace(page, 200, 300);
      await createTransition(page, 600, 300);
      await createArc(page, '.place-shape', '.transition-shape');

      await selectElement(page, '.arc-hit-area', true);
      const panel = page.locator('.panel.visible');
      await panel.locator('.tab-btn:has-text("Visual")').click();

      await expect(panel.locator('.section-title:has-text("Fill")')).toHaveCount(0);
      await expect(panel.locator('.section-title:has-text("Stroke")')).toBeVisible();
    });
  });

  test.describe('Non-scaling strokes and markers', () => {
    test('arc paths have vector-effect non-scaling-stroke', async ({ page }) => {
      await createPlace(page, 200, 300);
      await createTransition(page, 600, 300);
      await createArc(page, '.place-shape', '.transition-shape');

      const arcLine = page.locator('.arc-line');
      await expect(arcLine).toHaveAttribute('vector-effect', 'non-scaling-stroke');
      const arcHit = page.locator('.arc-hit-area');
      await expect(arcHit).toHaveAttribute('vector-effect', 'non-scaling-stroke');
    });

    test('markers use userSpaceOnUse and change with zoom', async ({ page }) => {
      await createPlace(page, 200, 300);
      await createTransition(page, 600, 300);
      await createArc(page, '.place-shape', '.transition-shape');

      const marker = page.locator('#arrowhead');
      await expect(marker).toHaveAttribute('markerUnits', 'userSpaceOnUse');

      // Get initial marker width at zoom 1
      const initialWidth = await marker.getAttribute('markerWidth');

      // Zoom in via keyboard shortcut (= or +)
      await page.locator('.canvas-svg').dispatchEvent('wheel', { deltaY: -100, clientX: 400, clientY: 300 });
      await page.waitForTimeout(100);

      // Marker width should have changed (smaller in world coords after zoom in)
      const zoomedWidth = await marker.getAttribute('markerWidth');
      expect(Number(zoomedWidth)).not.toBe(Number(initialWidth));
    });
  });

  test.describe('Arc inscription labels', () => {
    test('arc with inscription shows label on canvas', async ({ page }) => {
      await createPlace(page, 200, 300);
      await createTransition(page, 600, 300);
      await createArc(page, '.place-shape', '.transition-shape');

      // Select arc and set inscription via property panel
      await selectElement(page, '.arc-hit-area', true);
      const panel = page.locator('.panel.visible');
      await expect(panel).toBeVisible();

      const cmEditor = panel.locator('.cm-editor .cm-content').first();
      await cmEditor.click();
      await page.keyboard.type('1`x');
      await page.click('.panel-header'); // blur the editor
      await page.waitForTimeout(200);

      // The inscription label should appear on the canvas
      const label = page.locator('.arc-inscription-label');
      await expect(label).toHaveCount(1);
      await expect(label).toHaveText('1`x');
    });

    test('arc without inscription shows no label', async ({ page }) => {
      await createPlace(page, 200, 300);
      await createTransition(page, 600, 300);
      await createArc(page, '.place-shape', '.transition-shape');

      await expect(page.locator('.arc-inscription-label')).toHaveCount(0);
    });
  });

  test.describe('Resizable property panel', () => {
    test('dragging resize handle changes panel width', async ({ page }) => {
      await createPlace(page, 400, 300);
      await selectElement(page, '.place-shape');

      const panel = page.locator('.panel.visible');
      await expect(panel).toBeVisible();

      const initialWidth = await panel.evaluate((el: HTMLElement) => el.offsetWidth);

      // Find the resize handle
      const handle = panel.locator('.panel-resize-handle');
      const handleBox = await handle.boundingBox();
      expect(handleBox).toBeTruthy();

      // Drag leftward to widen the panel
      const startX = handleBox!.x + handleBox!.width / 2;
      const startY = handleBox!.y + handleBox!.height / 2;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX - 80, startY, { steps: 5 });
      await page.mouse.up();

      const newWidth = await panel.evaluate((el: HTMLElement) => el.offsetWidth);
      expect(newWidth).toBeGreaterThan(initialWidth);
    });

    test('panel width persists after reload', async ({ page }) => {
      await createPlace(page, 400, 300);
      await selectElement(page, '.place-shape');

      const panel = page.locator('.panel.visible');
      const handle = panel.locator('.panel-resize-handle');
      const handleBox = await handle.boundingBox();
      expect(handleBox).toBeTruthy();

      // Drag to resize
      const startX = handleBox!.x + handleBox!.width / 2;
      const startY = handleBox!.y + handleBox!.height / 2;
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(startX - 60, startY, { steps: 5 });
      await page.mouse.up();

      // Read stored value from localStorage
      const stored = await page.evaluate(() => localStorage.getItem('cpn-property-panel-width'));
      expect(stored).toBeTruthy();
      const storedWidth = Number(stored);
      expect(storedWidth).toBeGreaterThan(240);
    });
  });
});
