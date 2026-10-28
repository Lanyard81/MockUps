import { expect, test, type Page } from '@playwright/test';
import { centre, dragBetween, dragTile, frameBox } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const doc = (page: Page, name = 'Home') => page.frameLocator(`iframe[title="${name}"]`);

/** A point inside a frame, as a fraction of its box. */
async function inFrame(page: Page, name: string, fx: number, fy: number) {
  const b = await frameBox(page, name);
  return { x: b.x + b.width * fx, y: b.y + b.height * fy };
}

const texts = (page: Page, selector: string, name = 'Home') =>
  page
    .locator(`iframe[title="${name}"]`)
    .evaluate(
      (f, sel) =>
        [...(f as HTMLIFrameElement).contentDocument!.querySelectorAll(sel)].map((e) =>
          e.textContent!.trim(),
        ),
      selector,
    );

test('drag a component from the library onto an empty frame, with a visible drop indicator', async ({
  page,
}) => {
  await dragTile(page, 'button', 'Brand Dark', await inFrame(page, 'Home', 0.5, 0.3), async () => {
    await expect(page.getByTestId('drop-indicator')).toBeVisible();
    await expect(page.locator('.drag-ghost')).toContainText('Buttons');
  });
  await expect(doc(page).locator('.nsw-button--dark')).toHaveCount(1);
  await expect(doc(page).locator('section.nsw-section')).toHaveCount(1);
  await expect(page.getByTestId('drop-indicator')).toHaveCount(0);
  // One drag is one undo step.
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(doc(page).locator('.nsw-button--dark')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
});

test('Esc cancels a drag and changes nothing', async ({ page }) => {
  await dragTile(page, 'button', 'Brand Dark', await inFrame(page, 'Home', 0.5, 0.3), async () => {
    await page.keyboard.press('Escape');
  });
  await expect(doc(page).locator('.nsw-button--dark')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
});

test('drop position follows the pointer: above or below an existing item', async ({ page }) => {
  await page
    .getByTestId('component-heading')
    .getByRole('button', { name: 'Heading 1', exact: true })
    .click();
  await page
    .getByTestId('component-paragraph')
    .getByRole('button', { name: 'Body text', exact: true })
    .click();
  expect(await texts(page, 'h1, h2, p')).toEqual([
    'Heading 1',
    expect.stringContaining('Body text'),
  ]);

  // Drop Heading 2 on the upper half of the heading: it lands first.
  const h1 = await centre(doc(page).locator('h1'));
  const h1Box = (await doc(page).locator('h1').boundingBox())!;
  await dragTile(page, 'heading', 'Heading 2', { x: h1.x, y: h1Box.y + 2 });
  expect((await texts(page, 'h1, h2, p'))[0]).toBe('Heading 2');

  // Drop Heading 3 on the lower half of the paragraph: it lands last.
  const pBox = (await doc(page).locator('p').first().boundingBox())!;
  await dragTile(page, 'heading', 'Heading 3', { x: pBox.x + 20, y: pBox.y + pBox.height - 2 });
  const all = await texts(page, 'h1, h2, h3, p');
  expect(all[0]).toBe('Heading 2');
  expect(all[all.length - 1]).toBe('Heading 3');
});

test('dropping on empty space below the content starts a new section', async ({ page }) => {
  await page
    .getByTestId('component-heading')
    .getByRole('button', { name: 'Heading 1', exact: true })
    .click();
  await expect(doc(page).locator('section.nsw-section')).toHaveCount(1);
  await dragTile(page, 'button', 'Brand Dark', await inFrame(page, 'Home', 0.5, 0.9));
  await expect(doc(page).locator('section.nsw-section')).toHaveCount(2);
  expect(await texts(page, 'h1, button.nsw-button')).toEqual(['Heading 1', 'Button']);
});

test('drop into a specific grid column', async ({ page }) => {
  await page.getByTestId('layout-blocks').getByRole('button', { name: '2 columns' }).click();
  const second = doc(page).locator('.nsw-col-md-6').nth(1);
  await dragTile(page, 'button', 'Danger', await centre(second), async () => {
    await expect(page.locator('.ov-drop-parent')).toBeVisible();
  });
  await expect(
    doc(page).locator('.nsw-col-md-6').nth(1).locator('.nsw-button--danger'),
  ).toHaveCount(1);
  await expect(
    doc(page).locator('.nsw-col-md-6').nth(0).locator('.nsw-button--danger'),
  ).toHaveCount(0);
});

test('drag a layout block onto the frame', async ({ page }) => {
  const tile = page.getByTestId('layout-blocks').getByRole('button', { name: '3 columns' });
  await tile.scrollIntoViewIfNeeded();
  await dragBetween(page, await centre(tile), await inFrame(page, 'Home', 0.5, 0.4));
  await expect(doc(page).locator('.nsw-col-md-4')).toHaveCount(3);
});

test('a full-width component dropped inside content lands in the frame root, in order', async ({
  page,
}) => {
  await page
    .getByTestId('component-heading')
    .getByRole('button', { name: 'Heading 1', exact: true })
    .click();
  const box = (await doc(page).locator('h1').boundingBox())!;
  await dragTile(page, 'masthead', 'Dark', { x: box.x + 10, y: box.y + 2 });
  const order = await page
    .locator('iframe[title="Home"]')
    .evaluate((f) =>
      [...(f as HTMLIFrameElement).contentDocument!.getElementById('root')!.children].map((e) =>
        e.querySelector('.nsw-masthead') ? 'masthead' : 'section',
      ),
    );
  expect(order).toEqual(['masthead', 'section']);
});

test('drag an existing component to reorder it', async ({ page }) => {
  for (const [id, v] of [
    ['heading', 'Heading 1'],
    ['paragraph', 'Body text'],
    ['heading', 'Heading 2'],
  ] as const) {
    await page.getByTestId(`component-${id}`).getByRole('button', { name: v, exact: true }).click();
  }
  expect((await texts(page, 'h1, h2, p')).map((t) => t.slice(0, 9))).toEqual([
    'Heading 1',
    'Body text',
    'Heading 2',
  ]);
  const h2 = await centre(doc(page).locator('h2'));
  const h1Box = (await doc(page).locator('h1').boundingBox())!;
  await dragBetween(page, h2, { x: h1Box.x + 20, y: h1Box.y + 2 });
  expect((await texts(page, 'h1, h2, p')).map((t) => t.slice(0, 9))).toEqual([
    'Heading 2',
    'Heading 1',
    'Body text',
  ]);
  await page.getByRole('button', { name: 'Undo' }).click();
  expect((await texts(page, 'h1, h2, p')).map((t) => t.slice(0, 9))).toEqual([
    'Heading 1',
    'Body text',
    'Heading 2',
  ]);
});

test('drag an existing component into another frame, as one undo step', async ({ page }) => {
  await page
    .getByTestId('component-button')
    .getByRole('button', { name: 'Brand Dark', exact: true })
    .click();
  await page.getByRole('button', { name: 'Add page' }).click();
  await page.getByRole('menuitem', { name: /Tablet/ }).click();
  const button = await centre(doc(page).locator('.nsw-button--dark'));
  await dragBetween(page, button, await inFrame(page, 'Tablet 2', 0.5, 0.2));
  await expect(doc(page).locator('.nsw-button--dark')).toHaveCount(0);
  await expect(doc(page, 'Tablet 2').locator('.nsw-button--dark')).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(doc(page).locator('.nsw-button--dark')).toHaveCount(1);
  await expect(doc(page, 'Tablet 2').locator('.nsw-button--dark')).toHaveCount(0);
});

test('click selects, the breadcrumb shows the path, crumbs and Esc move up a level', async ({
  page,
}) => {
  await page
    .getByTestId('component-card')
    .getByRole('button', { name: 'Default', exact: true })
    .click();
  await doc(page).locator('.nsw-card').click();
  const crumbs = page.getByRole('navigation', { name: 'Selection' });
  await expect(crumbs).toContainText('Home');
  await expect(crumbs).toContainText('Section');
  // Containers, grids and columns are left out of the path unless layout details are on.
  await expect(crumbs).not.toContainText('Container');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel(/Show layout details/).check();
  await page.keyboard.press('Escape');
  await expect(crumbs).toContainText('Container');
  await expect(crumbs).toContainText('Grid');
  await expect(crumbs).toContainText('Column');
  await expect(crumbs.locator('.is-current')).toHaveText(/^Cards/);
  await expect(page.locator('.ov-chip')).toHaveText(/Cards/);

  await crumbs.getByRole('button', { name: 'Section' }).click();
  await expect(crumbs.locator('.is-current')).toHaveText('Section');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel(/Show layout details/).uncheck();
  await page.keyboard.press('Escape');
  await crumbs.getByRole('button', { name: 'Section' }).click();
  await page.keyboard.press('Escape');
  await expect(crumbs.locator('.is-current')).toHaveText('Home'); // frame level
  await page.keyboard.press('Escape');
  await expect(crumbs).toHaveCount(0);
});

test('hover outlines show what a click will select', async ({ page }) => {
  await page
    .getByTestId('component-button')
    .getByRole('button', { name: 'Brand Dark', exact: true })
    .click();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await doc(page).locator('.nsw-button--dark').hover();
  await expect(page.locator('.ov-hover')).toBeVisible();
});

test('delete, duplicate, copy and paste into another frame, and Alt+arrow reordering', async ({
  page,
}) => {
  await page
    .getByTestId('component-heading')
    .getByRole('button', { name: 'Heading 1', exact: true })
    .click();
  await page
    .getByTestId('component-heading')
    .getByRole('button', { name: 'Heading 2', exact: true })
    .click();
  await doc(page).locator('h1').click();
  await page.keyboard.press('Alt+ArrowDown');
  await expect.poll(() => texts(page, 'h1, h2')).toEqual(['Heading 2', 'Heading 1']);
  await page.keyboard.press('Alt+ArrowUp');
  await expect.poll(() => texts(page, 'h1, h2')).toEqual(['Heading 1', 'Heading 2']);

  await page.keyboard.press('Control+d');
  await expect(doc(page).locator('h1')).toHaveCount(2);
  await page.keyboard.press('Delete');
  await expect(doc(page).locator('h1')).toHaveCount(1);

  await doc(page).locator('h1').click();
  await page.keyboard.press('Control+c');
  await page.getByRole('button', { name: 'Add page' }).click();
  await page.getByRole('menuitem', { name: /Android/ }).click();
  await page.keyboard.press('Control+v');
  await expect(doc(page, 'Android 2').locator('h1')).toHaveText('Heading 1');
  await expect(doc(page).locator('h1')).toHaveCount(1);
});

test('every tree change is undoable and redoable in order', async ({ page }) => {
  await page
    .getByTestId('component-heading')
    .getByRole('button', { name: 'Heading 1', exact: true })
    .click();
  await doc(page).locator('h1').click();
  await page.keyboard.press('Control+d');
  await page.keyboard.press('Delete');
  await expect(doc(page).locator('h1')).toHaveCount(1);
  await page.keyboard.press('Control+z');
  await expect(doc(page).locator('h1')).toHaveCount(2);
  await page.keyboard.press('Control+z');
  await expect(doc(page).locator('h1')).toHaveCount(1);
  await page.keyboard.press('Control+Shift+z');
  await expect(doc(page).locator('h1')).toHaveCount(2);
});

test('Edit mode never navigates or opens things; selection survives switching to Preview and back', async ({
  page,
}) => {
  await page
    .getByTestId('component-link')
    .getByRole('button', { name: 'Default', exact: true })
    .click();
  await doc(page).locator('a').click();
  await expect(page.locator('iframe[title="Home"]')).toBeVisible();
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.locator('.ov-select')).toBeHidden();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.locator('.ov-select')).toBeVisible();
});

test('select a section from the breadcrumb and drag it by its handle to reorder sections', async ({
  page,
}) => {
  await page
    .getByTestId('component-heading')
    .getByRole('button', { name: 'Heading 1', exact: true })
    .click();
  await page
    .getByTestId('layout-blocks')
    .getByRole('button', { name: 'Section', exact: true })
    .click();
  await page
    .getByTestId('component-button')
    .getByRole('button', { name: 'Danger', exact: true })
    .click();
  await expect(doc(page).locator('section.nsw-section')).toHaveCount(2);
  const order = () =>
    page
      .locator('iframe[title="Home"]')
      .evaluate((f) =>
        [...(f as HTMLIFrameElement).contentDocument!.querySelectorAll('section.nsw-section')].map(
          (s) => (s.querySelector('h1') ? 'heading' : 'button'),
        ),
      );
  expect(await order()).toEqual(['heading', 'button']);

  await page
    .getByRole('navigation', { name: 'Selection' })
    .getByRole('button', { name: 'Section' })
    .click();
  const handle = page.getByTestId('drag-handle');
  await expect(handle).toBeVisible();
  const first = (await doc(page).locator('section.nsw-section').first().boundingBox())!;
  await dragBetween(page, await centre(handle), { x: first.x + first.width / 2, y: first.y + 3 });
  await expect.poll(order).toEqual(['button', 'heading']);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect.poll(order).toEqual(['heading', 'button']);
});

test('dragging stays smooth on a long page: no long tasks while moving over 40 components', async ({
  page,
}) => {
  for (let i = 0; i < 40; i++) {
    await page
      .getByTestId('component-heading')
      .getByRole('button', { name: 'Heading 3', exact: true })
      .click();
  }
  await expect(doc(page).locator('h3')).toHaveCount(40);
  await page.evaluate(() => {
    (window as unknown as { __long: number[] }).__long = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        (window as unknown as { __long: number[] }).__long.push(e.duration);
    }).observe({ entryTypes: ['longtask'] });
  });
  const box = await frameBox(page, 'Home');
  const tile = page
    .getByTestId('component-button')
    .getByRole('button', { name: 'Brand Dark', exact: true });
  await tile.scrollIntoViewIfNeeded();
  const from = await centre(tile);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 0; i < 40; i++) await page.mouse.move(box.x + 40 + i * 3, box.y + 20 + i * 10);
  await page.mouse.up();
  const long = await page.evaluate(() => (window as unknown as { __long: number[] }).__long);
  expect(Math.max(0, ...long)).toBeLessThan(200);
});
