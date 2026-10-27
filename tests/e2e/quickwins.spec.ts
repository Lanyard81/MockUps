import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.use({ viewport: { width: 1700, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

test('the empty state offers sample projects', async ({ page }) => {
  const welcome = page.getByTestId('welcome');
  await expect(welcome).toContainText('Welcome to PageWright');
  await welcome.getByRole('button').first().click();
  await expect(page.getByTestId('welcome')).toHaveCount(0);
});

test('adds a frame at a paper or slide size', async ({ page }) => {
  await page.getByRole('button', { name: 'Add frame' }).click();
  await page.getByRole('menuitem', { name: /A4 page/ }).click();
  await expect(page.getByTestId('frame-A4 page 2').locator('.frame__size')).toHaveText('794px');
});

test('duplicates a frame at another width', async ({ page }) => {
  await page.getByTestId('frame-Home').locator('.frame__label').click({ button: 'right' });
  await page.getByRole('menuitem', { name: /Duplicate as desktop/ }).click();
  await expect(page.getByTestId('frame-Home (Desktop)').locator('.frame__size')).toHaveText(
    '1440px',
  );
});

test('exports every frame as one PDF', async ({ page }) => {
  await page.getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: /Export/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Export' });
  await dialog.getByLabel('PDF document').check();
  const [d] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: 'Export', exact: true }).click(),
  ]);
  expect(d.suggestedFilename()).toMatch(/\.pdf$/);
  const bytes = readFileSync(await d.path());
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  expect(bytes.toString('latin1')).toContain('/Subtype /Image');
});

test('the toolbar toggle sets the default layout for new frames, and is remembered', async ({
  page,
}) => {
  const toggle = page.getByRole('group', { name: 'Default layout' });
  await toggle.getByRole('button', { name: 'Freeform' }).click();
  await page.reload();
  await expect(
    page.getByRole('group', { name: 'Default layout' }).getByRole('button', { name: 'Freeform' }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('on a narrow window the toolbar and tabs tuck extras into a More menu', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
  await page.setViewportSize({ width: 800, height: 700 });
  await expect(page.getByRole('button', { name: 'Zoom in' })).toHaveCount(0);
  const more = page.locator('.toolbar').getByRole('button', { name: /More/ });
  await more.click();
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
  await page.setViewportSize({ width: 1700, height: 1000 });
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
});

test('the hand button (and H) toggles panning', async ({ page }) => {
  const hand = page.getByRole('button', { name: 'Hand tool' });
  await hand.click();
  await expect(hand).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('viewport')).toHaveClass(/viewport--panning/);
  await page.keyboard.press('Space');
  await page.keyboard.up('Space');
  await expect(page.getByTestId('viewport')).toHaveClass(/viewport--panning/); // Space doesn't switch it off
  await page.keyboard.press('h');
  await expect(hand).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByTestId('viewport')).not.toHaveClass(/viewport--panning/);
});

test('the canvas refits when the window is resized, until you zoom yourself', async ({ page }) => {
  const world = page.getByTestId('world');
  const scale = () => world.evaluate((el) => (el as HTMLElement).style.transform);
  const before = await scale();
  await page.setViewportSize({ width: 1100, height: 450 });
  await expect.poll(scale).not.toBe(before);
  await page.keyboard.press('Control+=');
  const manual = await scale();
  await expect.poll(scale).toBe(manual);
  await page.setViewportSize({ width: 1500, height: 900 });
  await page.waitForTimeout(300);
  expect(await scale()).toBe(manual);
});

test('the click-through scales a wide page to fill a large window', async ({ page }) => {
  await page.getByRole('button', { name: 'Add frame' }).click();
  await page.getByRole('menuitem', { name: /Desktop/ }).click();
  await page.getByLabel('Start frame').check();
  await page.getByRole('button', { name: 'Play' }).click();
  const box = await page.locator('.prototype__page').boundingBox();
  expect(box!.width).toBeGreaterThan(1650); // the window is 1700 wide; a desktop page is 1440
});
