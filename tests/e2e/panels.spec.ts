import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { addFromLibrary } from './helpers';

async function open(page: Page) {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
}

const canvasWidth = (page: Page) =>
  page.getByTestId('viewport').evaluate((el) => el.getBoundingClientRect().width);

const worldView = (page: Page) =>
  page.getByTestId('world').evaluate((el) => {
    const m = new DOMMatrix(getComputedStyle(el).transform);
    return { x: m.e, y: m.f, zoom: m.a };
  });

test.describe('side panels', () => {
  test.use({ viewport: { width: 1700, height: 900 } });

  test('Alt 1 and Alt 2 hide and show them, and the buttons agree', async ({ page }) => {
    await open(page);
    const before = await canvasWidth(page);
    await page.keyboard.press('Alt+Digit1');
    await expect(page.getByRole('complementary', { name: /Library, templates/ })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Library panel' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect.poll(() => canvasWidth(page)).toBeGreaterThan(before + 150);
    await page.keyboard.press('Alt+Digit2');
    await expect(page.getByRole('complementary', { name: 'Properties' })).toBeHidden();
    await page.getByRole('button', { name: 'Library panel' }).click();
    await page.getByRole('button', { name: 'Properties panel' }).click();
    await expect(page.getByRole('complementary', { name: 'Properties' })).toBeVisible();
    await expect.poll(() => canvasWidth(page)).toBeCloseTo(before, 0);
  });
});

test.describe('1024 wide', () => {
  test.use({ viewport: { width: 1024, height: 768 } });
  test('the canvas keeps at least 60% of the window', async ({ page }) => {
    await open(page);
    expect(await canvasWidth(page)).toBeGreaterThanOrEqual(1024 * 0.6 - 1);
  });
});

test.describe('narrow window', () => {
  test.use({ viewport: { width: 700, height: 800 } });
  test('panels start closed and open as drawers over the canvas', async ({ page }) => {
    await open(page);
    expect(await canvasWidth(page)).toBeGreaterThan(680);
    await expect(page.getByRole('complementary', { name: 'Properties' })).toBeHidden();
    await page.getByRole('button', { name: 'Library panel' }).click();
    const left = page.getByRole('complementary', { name: /Library, templates/ });
    await expect(left).toBeVisible();
    expect((await left.boundingBox())!.width).toBeLessThanOrEqual(340);
    expect(await canvasWidth(page)).toBeGreaterThan(680); // the canvas does not shrink
  });
});

test.describe('touch', () => {
  test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true });

  let cdp: CDPSession | undefined;
  test.beforeEach(() => {
    cdp = undefined;
  });
  async function touch(
    page: Page,
    type: 'touchStart' | 'touchMove' | 'touchEnd',
    points: { x: number; y: number; id: number }[],
  ) {
    cdp ??= await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: points.map((p) => ({ x: p.x, y: p.y, id: p.id })),
    });
  }

  test('the hint speaks of touch, one finger pans and two fingers pinch', async ({ page }) => {
    await open(page);
    await expect(page.locator('.canvas-hint__touch')).toBeVisible();
    await expect(page.locator('.canvas-hint__mouse')).toBeHidden();

    const box = (await page.getByTestId('viewport').boundingBox())!;
    const y = box.y + box.height - 60; // empty canvas below the page
    const x = box.x + 20; // beside the page
    const start = await worldView(page);

    // One finger on empty canvas pans.
    await touch(page, 'touchStart', [{ x, y, id: 1 }]);
    await touch(page, 'touchMove', [{ x: x + 60, y: y - 40, id: 1 }]);
    await touch(page, 'touchEnd', []);
    const panned = await worldView(page);
    expect(Math.round(panned.x - start.x)).toBeGreaterThan(30);
    expect(panned.zoom).toBeCloseTo(start.zoom, 3);

    // Two fingers spreading zoom in.
    const cx = box.x + 60;
    const cy = box.y + box.height - 60;
    await touch(page, 'touchStart', [
      { x: cx - 20, y: cy, id: 1 },
      { x: cx + 20, y: cy, id: 2 },
    ]);
    await touch(page, 'touchMove', [
      { x: cx - 80, y: cy, id: 1 },
      { x: cx + 80, y: cy, id: 2 },
    ]);
    await touch(page, 'touchEnd', []);
    expect((await worldView(page)).zoom).toBeGreaterThan(panned.zoom * 1.5);
  });

  test('press and hold on an item opens its menu', async ({ page }) => {
    await open(page);
    await addFromLibrary(page, 'heading', 'Heading 1');
    const h = page.frameLocator('iframe[title="Home"]').locator('h1').first();
    const b = (await h.boundingBox())!;
    const p = { x: b.x + b.width / 2, y: b.y + b.height / 2, id: 1 };
    await touch(page, 'touchStart', [p]);
    await page.waitForTimeout(700);
    await expect(page.getByRole('menu')).toBeVisible();
    await touch(page, 'touchEnd', []);
  });
});
