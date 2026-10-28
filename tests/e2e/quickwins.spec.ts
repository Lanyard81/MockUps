import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { addFromLibrary, openSection } from './helpers';

test.use({ viewport: { width: 1700, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

test('the empty state offers sample projects', async ({ page }) => {
  const frame = page.locator('.frame__empty');
  await expect(frame).toContainText('Start your page');
  await frame.getByRole('button', { name: 'Try a sample' }).click();
  const dialog = page.getByRole('dialog', { name: 'Try a sample' });
  await dialog.getByRole('button', { name: /Open/ }).first().click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.frame__empty')).toHaveCount(0);
});

test('adds a frame at a paper or slide size', async ({ page }) => {
  await page.getByRole('button', { name: 'Add page' }).click();
  await page.getByRole('menuitem', { name: /A4 page/ }).click();
  await expect(page.getByTestId('frame-A4 page 2').locator('.frame__size')).toHaveText('794px');
});

test('duplicates a frame at another width', async ({ page }) => {
  await page.getByTestId('frame-Home').locator('.frame__label').click({ button: 'right' });
  await page.getByRole('menuitem', { name: /Copy to a desktop-sized page/ }).click();
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

test('Settings sets the layout new pages start with, and it is remembered', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page
    .getByRole('group', { name: 'New pages start as' })
    .getByRole('button', { name: 'Free' })
    .click();
  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(
    page.getByRole('group', { name: 'New pages start as' }).getByRole('button', { name: 'Free' }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('on a narrow window the least-used buttons tuck into More; zoom, Add page and the mode switch stay', async ({
  page,
}) => {
  const bar = page.locator('.toolbar');
  await expect(bar.getByRole('button', { name: 'Hand tool' })).toBeVisible();
  await page.setViewportSize({ width: 900, height: 700 });
  await expect(bar.getByRole('button', { name: 'Hand tool' })).toHaveCount(0);
  await expect(bar.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible();
  await bar.getByRole('button', { name: /More/ }).click();
  await expect(page.getByRole('button', { name: 'Hand tool' })).toBeVisible();
});

test('the hand button (and H) toggles panning', async ({ page }) => {
  const hand = page.getByRole('button', { name: 'Hand tool' });
  await hand.click();
  await expect(hand).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('viewport')).toHaveClass(/viewport--panning/);
  await page.locator('#canvas').focus(); // Space on the focused button would press it
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
  await page.getByRole('button', { name: 'Add page' }).click();
  await page.getByRole('menuitem', { name: /Desktop/ }).click();
  await openSection(page, 'Prototype links');
  await page.getByLabel('Start page').check();
  await addFromLibrary(page, 'heading', 'Heading 1');
  await page.getByRole('button', { name: 'Present' }).click();
  const box = await page.locator('.prototype__page').boundingBox();
  expect(box!.width).toBeGreaterThan(1650); // the window is 1700 wide; a desktop page is 1440
});

test('the top bar does not move while autosave runs', async ({ page }) => {
  const x = async () =>
    Math.round((await page.getByRole('button', { name: 'Undo' }).boundingBox())!.x);
  const before = await x();
  await addFromLibrary(page, 'heading', 'Heading 1');
  const seen = new Set<number>();
  for (let i = 0; i < 20; i++) {
    seen.add(await x());
    await page.waitForTimeout(60);
  }
  expect(Math.max(...seen) - Math.min(...seen, before)).toBeLessThanOrEqual(1);
});

for (const width of [1024, 1280, 1440, 1700]) {
  test(`at ${width}px the mode switch, Present, Share and zoom are always on screen`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    const bar = page.locator('.toolbar');
    await expect(bar.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
    await expect(bar.getByRole('button', { name: 'Present' })).toBeVisible();
    await expect(bar.getByRole('button', { name: 'Share and export' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Zoom to fit' })).toBeVisible();
    // No control is hidden without a More button to find it in.
    const hidden = await bar.getByRole('button', { name: /^More/ }).count();
    const settings = await bar.getByRole('button', { name: 'Settings' }).count();
    expect(settings + hidden).toBeGreaterThan(0);
  });
}

test('first run: the empty page offers three ways in, Present explains an empty mockup, Help replays the tour', async ({
  page,
}) => {
  const empty = page.locator('.frame__empty');
  await expect(empty.getByRole('button', { name: 'Choose a template' })).toBeVisible();
  await expect(empty.getByRole('button', { name: 'Import a page description' })).toBeVisible();

  await page.getByRole('button', { name: 'Present' }).click();
  await expect(page.getByText(/nothing to present yet/)).toBeVisible();

  await page.getByRole('button', { name: 'Help' }).click();
  await page.getByRole('menuitem', { name: 'Replay the tour' }).click();
  await expect(page.locator('.tour')).toBeVisible();
});
