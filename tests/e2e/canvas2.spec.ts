import { expect, test, type Page } from '@playwright/test';
import { addFromLibrary, centre, dragBetween } from './helpers';

test.use({ viewport: { width: 1700, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const view = (page: Page) =>
  page.getByTestId('world').evaluate((el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return { x: m.e, y: m.f, zoom: m.a };
  });

const setZoom = async (page: Page, pct: number) =>
  page.getByLabel('Zoom level').selectOption(String(pct));

test('a new page is brought into view, and no two page labels overlap', async ({ page }) => {
  await setZoom(page, 100);
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Add page' }).click();
    await page.getByRole('menuitem', { name: /Desktop/ }).click();
    const frame = page.locator('.frame').last();
    const vp = (await page.getByTestId('viewport').boundingBox())!;
    await expect
      .poll(async () => {
        const b = (await frame.boundingBox())!;
        return b.x >= vp.x && b.x < vp.x + vp.width && b.y >= vp.y && b.y < vp.y + vp.height;
      })
      .toBe(true);
  }
  // Zoomed far out the labels are shortened, never stacked on each other.
  await setZoom(page, 25);
  const boxes = await page.locator('.frame__label').evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right };
    }),
  );
  boxes.sort((a, b) => a.left - b.left);
  for (let i = 1; i < boxes.length; i++)
    expect(boxes[i]!.left).toBeGreaterThanOrEqual(boxes[i - 1]!.right - 0.5);
});

test('holding a dragged item near the canvas edge scrolls the canvas', async ({ page }) => {
  await setZoom(page, 100);
  const before = await view(page);
  const tile = page.getByTestId('component-heading').getByRole('button', { name: 'Heading 1' });
  await tile.scrollIntoViewIfNeeded();
  const from = await centre(tile);
  const vp = (await page.getByTestId('viewport').boundingBox())!;
  await dragBetween(page, from, { x: vp.x + vp.width / 2, y: vp.y + vp.height - 12 }, async () => {
    await page.waitForTimeout(500);
  });
  expect((await view(page)).y).toBeLessThan(before.y - 40);
});

test('zoom shortcuts zoom around the pointer, like the scroll wheel', async ({ page }) => {
  const vp = (await page.getByTestId('viewport').boundingBox())!;
  const p = { x: vp.x + 200, y: vp.y + 150 };
  await page.mouse.move(p.x, p.y);
  const a = await view(page);
  const world = { x: (p.x - vp.x - a.x) / a.zoom, y: (p.y - vp.y - a.y) / a.zoom };
  await page.keyboard.press('Control+=');
  await page.keyboard.press('Control+=');
  const b = await view(page);
  expect(b.zoom).toBeGreaterThan(a.zoom);
  expect((p.x - vp.x - b.x) / b.zoom).toBeCloseTo(world.x, 0);
  expect((p.y - vp.y - b.y) / b.zoom).toBeCloseTo(world.y, 0);
});

test('Esc closes Present even when focus is inside the page', async ({ page }) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  await page.getByRole('button', { name: 'Present' }).click();
  const viewer = page.locator('.prototype');
  await expect(viewer).toBeVisible();
  await viewer.frameLocator('iframe').locator('h1').click();
  await page.keyboard.press('Escape');
  await expect(viewer).toHaveCount(0);
});

test('the selection tag sits above the item', async ({ page }) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  await addFromLibrary(page, 'paragraph', 'Body text');
  await page.frameLocator('iframe[title="Home"]').locator('p').first().click();
  const chip = page.locator('.ov-select .ov-chip');
  const sel = page.locator('.ov-select');
  const [c, s] = [(await chip.boundingBox())!, (await sel.boundingBox())!];
  expect(c.y + c.height).toBeLessThanOrEqual(s.y + 1);
});
