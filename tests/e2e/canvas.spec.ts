import { expect, test, type Page } from '@playwright/test';
import { addFromLibrary } from './helpers';

const frameDoc = (page: Page, name: string) => page.frameLocator(`iframe[title="${name}"]`);

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

test('frames render real NSW markup, styles and fonts', async ({ page }) => {
  await addFromLibrary(page, 'button', 'Brand Dark');
  const button = frameDoc(page, 'Home').locator('.nsw-button--dark').first();
  await expect(button).toHaveCSS('background-color', 'rgb(0, 38, 100)');
  const font = await page.locator('iframe[title="Home"]').evaluate((f) => {
    const doc = (f as HTMLIFrameElement).contentDocument!;
    return doc.fonts.check('16px "Public Sans"');
  });
  expect(font).toBe(true);
});

test('frame width drives the NSW responsive layout', async ({ page }) => {
  await page.getByRole('button', { name: 'Add page' }).click();
  await page.getByRole('menuitem', { name: /Desktop/ }).click();
  const width = await page.locator('iframe[title="Desktop 2"]').evaluate((f) => f.clientWidth);
  expect(width).toBe(1440);
  const mobile = await page.locator('iframe[title="Home"]').evaluate((f) => f.clientWidth);
  expect(mobile).toBe(393);
});

test('edit mode blocks interaction, preview mode runs NSW scripts', async ({ page }) => {
  await addFromLibrary(page, 'accordion', 'Default');
  const details = frameDoc(page, 'Home').locator('details.nsw-accordion__item').nth(1);
  const summary = details.locator('summary');
  await summary.click();
  await expect(details).not.toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'Preview' }).click();
  await summary.click();
  await expect(details).toHaveAttribute('open', '');
});

test('add, duplicate, delete and undo frames', async ({ page }) => {
  await page.getByRole('button', { name: 'Add page' }).click();
  await page.getByRole('menuitem', { name: /Tablet/ }).click();
  await expect(page.locator('.frame')).toHaveCount(2);
  await page.getByRole('button', { name: 'Duplicate' }).click();
  await expect(page.locator('.frame')).toHaveCount(3);
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('.frame')).toHaveCount(2);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.frame')).toHaveCount(3);
  await page.getByRole('button', { name: 'Undo' }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.frame')).toHaveCount(1);
});

test('rename a frame by double-clicking its label', async ({ page }) => {
  await page.locator('.frame__name').first().dblclick();
  await page.getByLabel('Page name').fill('Landing');
  await page.keyboard.press('Enter');
  await expect(page.locator('.frame__name').first()).toHaveText('Landing');
});

test('zoom control and zoom to fit', async ({ page }) => {
  await page.getByLabel('Zoom level').selectOption('50');
  const transform = () =>
    page.getByTestId('world').evaluate((el) => (el as HTMLElement).style.transform);
  expect(await transform()).toContain('scale(0.5)');
  await page.getByRole('button', { name: 'Zoom in' }).click();
  expect(await transform()).not.toContain('scale(0.5)');
  await page.getByRole('button', { name: 'Zoom to fit' }).click();
  expect(await transform()).toContain('scale(');
});

test('ctrl+scroll zooms, plain scroll pans, including over a frame', async ({ page }) => {
  const world = page.getByTestId('world');
  const read = () => world.evaluate((el) => (el as HTMLElement).style.transform);
  const before = await read();
  const box = (await page.locator('iframe[title="Home"]').boundingBox())!;
  await page.mouse.move(box.x + 100, box.y + 100);
  await page.mouse.wheel(0, 120);
  await expect.poll(read).not.toBe(before);
  const panned = await read();
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, -100);
  await page.keyboard.up('Control');
  await expect.poll(read).not.toBe(panned);
  expect(await read()).not.toMatch(/scale\(1\)/);
});

test('space + drag pans the canvas, dragging a label moves a frame as one undo step', async ({
  page,
}) => {
  const world = page.getByTestId('world');
  const read = () => world.evaluate((el) => (el as HTMLElement).style.transform);
  const vp = (await page.getByTestId('viewport').boundingBox())!;
  const before = await read();
  await page.keyboard.down('Space');
  await page.mouse.move(vp.x + 300, vp.y + 300);
  await page.mouse.down();
  await page.mouse.move(vp.x + 400, vp.y + 350, { steps: 4 });
  await page.mouse.up();
  await page.keyboard.up('Space');
  await expect.poll(read).not.toBe(before);

  const label = (await page.locator('.frame__name').first().boundingBox())!;
  const left = () =>
    page
      .locator('.frame')
      .first()
      .evaluate((el) => (el as HTMLElement).style.left);
  await page.mouse.move(label.x + 5, label.y + 5);
  await page.mouse.down();
  await page.mouse.move(label.x + 205, label.y + 5, { steps: 6 });
  await page.mouse.up();
  expect(await left()).not.toBe('0px');
  await page.getByRole('button', { name: 'Undo' }).click();
  expect(await left()).toBe('0px');
});

test('fold line appears when content is taller than the screen', async ({ page }) => {
  await expect(page.locator('.frame__fold')).toHaveCount(0);
  for (const [id, v] of [
    ['card', 'Default'],
    ['card', 'Headline'],
    ['steps', 'Default'],
  ])
    await addFromLibrary(page, id!, v!);
  await page.locator('.frame__name').first().click();
  await page.getByLabel('Width').fill('240');
  await page.getByLabel('Width').blur();
  await expect(page.locator('.frame__fold').first()).toBeVisible();
});
