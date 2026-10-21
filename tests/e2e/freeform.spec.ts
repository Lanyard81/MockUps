import { expect, test, type Page } from '@playwright/test';
import { addFromLibrary, centre, dragBetween, dragTile, frameBox } from './helpers';

// Wide enough that a desktop frame next to the first one is fully on screen.
test.use({ viewport: { width: 1700, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

/** A freeform desktop frame (named "Desktop 2"), selected. */
async function addFreeFrame(page: Page) {
  await page.getByRole('button', { name: 'Add frame' }).click();
  await page.getByRole('button', { name: 'Freeform', exact: true }).click();
  await page.getByRole('menuitem', { name: /Desktop/ }).click();
  await expect(page.getByTestId('frame-Desktop 2').getByTestId('frame-free')).toBeVisible();
  await page.getByRole('button', { name: 'Zoom to fit' }).click(); // so the whole new frame is on screen
  await page.waitForTimeout(300);
}

const frame = (page: Page) => page.frameLocator('iframe[title="Desktop 2"]');
const item = (page: Page, n = 0) => frame(page).locator('[data-free]').nth(n);
const box = async (page: Page, n = 0) =>
  item(page, n).evaluate((el) => {
    const e = el as HTMLElement;
    return { x: e.offsetLeft, y: e.offsetTop, width: e.offsetWidth };
  });
/** Screen pixels per frame pixel. */
const scale = async (page: Page) => (await frameBox(page, 'Desktop 2')).width / 1440;

test('a component dropped on a freeform frame lands where it is dropped, with no section around it', async ({
  page,
}) => {
  await addFreeFrame(page);
  const fb = await frameBox(page, 'Desktop 2');
  await dragTile(page, 'card', 'Default', { x: fb.x + fb.width * 0.5, y: fb.y + 120 });
  await expect(frame(page).locator('[data-free]')).toHaveCount(1);
  await expect(frame(page).locator('.nsw-section')).toHaveCount(0);
  const b = await box(page);
  const k = await scale(page);
  // Centred on the pointer horizontally, a little above it.
  expect(Math.abs(b.x + b.width / 2 - 720)).toBeLessThan(8 / k);
  expect(Math.abs(b.y - (120 / k - 16))).toBeLessThan(12 / k);
});

test('pressing an item and dragging moves it freely; Undo puts it back in one step', async ({
  page,
}) => {
  await addFreeFrame(page);
  await addFromLibrary(page, 'card', 'Default');
  await expect(frame(page).locator('[data-free]')).toHaveCount(1);
  const before = await box(page);
  const k = await scale(page);
  const from = await centre(item(page));
  await dragBetween(page, from, { x: from.x + 150, y: from.y + 90 });
  const after = await box(page);
  expect(Math.abs(after.x - before.x - 150 / k)).toBeLessThan(3);
  expect(Math.abs(after.y - before.y - 90 / k)).toBeLessThan(3);
  expect(after.width).toBe(before.width);
  await page.getByRole('button', { name: 'Undo' }).click();
  expect(await box(page)).toEqual(before);
});

test('Shift locks a drag to one direction', async ({ page }) => {
  await addFreeFrame(page);
  await addFromLibrary(page, 'card', 'Default');
  const before = await box(page);
  const from = await centre(item(page));
  await page.keyboard.down('Shift');
  await dragBetween(page, from, { x: from.x + 120, y: from.y + 30 });
  await page.keyboard.up('Shift');
  const after = await box(page);
  expect(after.y).toBe(before.y);
  expect(after.x).toBeGreaterThan(before.x);
});

test('the side handles resize the width', async ({ page }) => {
  await addFreeFrame(page);
  await addFromLibrary(page, 'card', 'Default');
  const before = await box(page);
  const k = await scale(page);
  const handle = page.getByTestId('resize-handle-e');
  await expect(handle).toBeVisible();
  const from = await centre(handle);
  await dragBetween(page, from, { x: from.x + 100, y: from.y });
  const after = await box(page);
  expect(Math.abs(after.width - before.width - 100 / k)).toBeLessThan(3);
  expect(after.x).toBe(before.x);
  // The west handle moves the left edge and keeps the right edge.
  const west = page.getByTestId('resize-handle-w');
  const w0 = await centre(west);
  await dragBetween(page, w0, { x: w0.x - 60, y: w0.y });
  const grown = await box(page);
  expect(grown.x + grown.width).toBe(after.x + after.width);
  expect(grown.width).toBeGreaterThan(after.width);
});

test('arrow keys nudge, and Alt+arrows change what is in front', async ({ page }) => {
  await addFreeFrame(page);
  await addFromLibrary(page, 'card', 'Default');
  const start = await box(page);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Shift+ArrowDown');
  const nudged = await box(page);
  expect(nudged.x).toBe(start.x + 1);
  expect(nudged.y).toBe(start.y + 10);

  // Two items: the second is in front; Alt+ArrowDown on it sends it behind the first.
  await addFromLibrary(page, 'button', 'Brand Dark');
  await expect(frame(page).locator('[data-free]')).toHaveCount(2);
  const idsBefore = await frame(page)
    .locator('[data-free]')
    .evaluateAll((els) =>
      els.map((e) =>
        e.querySelector('button, .nsw-card') && e.querySelector('button') ? 'button' : 'card',
      ),
    );
  expect(idsBefore).toEqual(['card', 'button']);
  await page.keyboard.press('Alt+ArrowUp'); // already in front: nothing changes
  await page.keyboard.press('Alt+ArrowDown');
  const idsAfter = await frame(page)
    .locator('[data-free]')
    .evaluateAll((els) => els.map((e) => (e.querySelector('button') ? 'button' : 'card')));
  expect(idsAfter).toEqual(['button', 'card']);
});

test('the right-click menu brings to front and sends to back', async ({ page }) => {
  await addFreeFrame(page);
  await addFromLibrary(page, 'card', 'Default');
  await addFromLibrary(page, 'button', 'Brand Dark');
  await frame(page).locator('.nsw-card__title').first().click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Bring to front' }).click();
  const order = await frame(page)
    .locator('[data-free]')
    .evaluateAll((els) => els.map((e) => (e.querySelector('button') ? 'button' : 'card')));
  expect(order).toEqual(['button', 'card']);
});

test('Properties switches a frame between Flow and Freeform without losing the content', async ({
  page,
}) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  await addFromLibrary(page, 'paragraph', 'Body text');
  const home = page.frameLocator('iframe[title="Home"]');
  await expect(home.locator('.nsw-section')).toHaveCount(1);
  await page.getByTestId('frame-Home').locator('.frame__label').click();
  await page.getByRole('button', { name: 'Freeform', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Switch to Freeform?' })
    .getByRole('button', { name: 'Switch to Freeform' })
    .click();
  await expect(home.locator('[data-free]')).toHaveCount(2);
  await expect(home.locator('.nsw-section')).toHaveCount(0);
  await expect(home.locator('h1')).toBeVisible();
  const [h, p] = await home
    .locator('[data-free]')
    .evaluateAll((els) => els.map((e) => (e as HTMLElement).offsetTop));
  expect(h).toBeLessThan(p!);

  await page.getByRole('button', { name: 'Flow', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Switch to Flow?' })
    .getByRole('button', { name: 'Switch to Flow' })
    .click();
  await expect(home.locator('.nsw-section')).toHaveCount(2);
  await expect(home.locator('[data-free]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(home.locator('[data-free]')).toHaveCount(2);
});

test('sections and page parts are refused on a freeform frame, with a reason', async ({ page }) => {
  await addFreeFrame(page);
  await page.getByTestId('component-section').count(); // library is on the Layout tab for blocks
  await page.getByRole('button', { name: 'Add masthead + header' }).click();
  await expect(page.getByText(/Page parts need a Flow frame/)).toBeVisible();
});

test('Preview shows a freeform frame as it is arranged, and positions survive a reload', async ({
  page,
}) => {
  await addFreeFrame(page);
  await addFromLibrary(page, 'card', 'Default');
  await page.keyboard.press('Shift+ArrowRight');
  const edit = await box(page);
  await page.getByRole('button', { name: 'Preview' }).click();
  expect(await box(page)).toEqual(edit);
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByTestId('save-status')).toHaveText('Saved');
  await page.reload();
  await expect(page.getByTestId('frame-Desktop 2').getByTestId('frame-free')).toBeVisible();
  expect(await box(page)).toEqual(edit);
});
