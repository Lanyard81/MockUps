import { expect, test, type Page } from '@playwright/test';
import { addFromLibrary, centre, dragTile, frameBox } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const home = (page: Page) => page.frameLocator('iframe[title="Home"]');
const panel = (page: Page) => page.getByRole('complementary', { name: 'Properties' });
const label = (page: Page) => home(page).locator('[data-edit="label"]').first();

/** 1×1 red PNG. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
  'base64',
);

test('drag a button in, edit its label on the canvas, switch its variant, undo each step', async ({
  page,
}) => {
  const b = await frameBox(page, 'Home');
  await dragTile(page, 'button', 'Brand Dark', { x: b.x + b.width / 2, y: b.y + 120 });
  await expect(home(page).locator('.nsw-button--dark')).toHaveCount(1);

  // Edit the label in place.
  await label(page).dblclick();
  await expect(label(page)).toHaveAttribute('contenteditable', /.+/);
  await page.keyboard.press('Control+a');
  await page.keyboard.type('Get started');
  await page.keyboard.press('Enter');
  await expect(label(page)).toHaveText('Get started');
  await expect(label(page)).not.toHaveAttribute('contenteditable', /.+/);

  // Switch variant from the panel. The text stays.
  await panel(page).getByRole('button', { name: 'Danger', exact: true }).click();
  await expect(home(page).locator('.nsw-button--danger')).toHaveCount(1);
  await expect(label(page)).toHaveText('Get started');

  // Undo: variant, then text, then the button itself.
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(home(page).locator('.nsw-button--dark')).toHaveCount(1);
  await expect(label(page)).toHaveText('Get started');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(label(page)).toHaveText('Button');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(home(page).locator('.nsw-button')).toHaveCount(0);
});

test('a whole typing session is one undo step, and Esc cancels', async ({ page }) => {
  await addFromLibrary(page, 'button', 'Brand Dark');
  await label(page).dblclick();
  await page.keyboard.type('Hello there, this is long');
  await page.keyboard.press('Enter');
  await expect(label(page)).toHaveText('Hello there, this is long');
  await page.keyboard.press('Control+z');
  await expect(label(page)).toHaveText('Button');

  await label(page).dblclick();
  await page.keyboard.type('Discard me');
  await page.keyboard.press('Escape');
  await expect(label(page)).toHaveText('Button');
  await page.keyboard.press('Control+z'); // undoes the add, so nothing was recorded by the cancelled edit
  await expect(home(page).locator('.nsw-button')).toHaveCount(0);
});

test('Enter commits single-line text, Shift+Enter adds a line break where allowed', async ({
  page,
}) => {
  await addFromLibrary(page, 'paragraph', 'Body text');
  const p = home(page).locator('p[data-edit="text"]');
  await p.dblclick();
  await page.keyboard.type('First');
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('Second');
  await page.keyboard.press('Enter');
  await expect(p.locator('br')).toHaveCount(1);
  await expect(p).toHaveText('FirstSecond');

  // Single-line: Shift+Enter does nothing, and the text is not split.
  await page.getByRole('button', { name: 'Undo' }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await addFromLibrary(page, 'heading', 'Heading 2');
  const h = home(page).locator('h2[data-edit="text"]');
  await h.dblclick();
  await page.keyboard.type('One');
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('Line');
  await page.keyboard.press('Enter');
  await expect(h.locator('br')).toHaveCount(0);
  await expect(h).toHaveText('OneLine');
});

test('paste is plain text only', async ({ page }) => {
  await addFromLibrary(page, 'heading', 'Heading 2');
  const h = home(page).locator('h2[data-edit="text"]');
  await h.dblclick();
  await h.evaluate((el) => {
    const dt = new DataTransfer();
    dt.setData('text/plain', 'line one\nline two');
    dt.setData('text/html', '<b>bold</b>');
    el.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
    );
  });
  await page.keyboard.press('Enter');
  await expect(h.locator('b')).toHaveCount(0);
  await expect(h).toHaveText('line one line two');
});

test('Tab moves to the next text in the same component, and Enter on a selection starts editing', async ({
  page,
}) => {
  await addFromLibrary(page, 'card', 'Default');
  await home(page)
    .locator('.nsw-card__tag [data-edit="tag"], [data-edit="tag"]')
    .first()
    .dblclick();
  await page.keyboard.type('News');
  await page.keyboard.press('Tab');
  await expect(home(page).locator('[data-edit="tag"]')).toHaveText('News');
  await expect(home(page).locator('[data-edit="title"]')).toHaveAttribute('contenteditable', /.+/);
  await page.keyboard.type('Big story');
  await page.keyboard.press('Enter');
  await expect(home(page).locator('[data-edit="title"]')).toHaveText('Big story');

  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape'); // up to the card's column, then the grid
  await home(page)
    .locator('.nsw-card')
    .click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Enter');
  await expect(home(page).locator('[contenteditable]')).toHaveCount(1);
});

test('the properties panel edits the same text, and options change the real NSW markup', async ({
  page,
}) => {
  await addFromLibrary(page, 'button', 'Brand Dark');
  await panel(page).getByLabel('Label', { exact: true }).fill('Apply now');
  await panel(page).getByLabel('Label', { exact: true }).press('Enter');
  await expect(label(page)).toHaveText('Apply now');

  await panel(page).getByLabel('Full width').check();
  await expect(home(page).locator('.nsw-button--full-width')).toHaveCount(1);
  await panel(page).getByLabel('Small').check();
  await expect(home(page).locator('.nsw-button--small')).toHaveCount(1);

  await panel(page).getByLabel('Link address').fill('https://example.com');
  await panel(page).getByLabel('Link address').press('Enter');
  await expect(home(page).locator('a.nsw-button[href="https://example.com"]')).toHaveCount(1);
  await expect(home(page).locator('button.nsw-button')).toHaveCount(0);
  await expect(label(page)).toHaveText('Apply now');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(home(page).locator('button.nsw-button')).toHaveCount(1);
});

test('choose an icon from the searchable picker, before or after the text', async ({ page }) => {
  await addFromLibrary(page, 'button', 'Brand Dark');
  await panel(page).getByRole('button', { name: 'Choose icon…' }).click();
  await page.getByLabel('Search icons').fill('arrow forward');
  await page.getByRole('option', { name: 'arrow forward', exact: true }).first().click();
  const icon = home(page).locator('.nsw-button .material-icons');
  await expect(icon).toHaveText('arrow_forward');
  // Before the label by default.
  expect(
    await home(page)
      .locator('.nsw-button')
      .evaluate((b) => (b.firstElementChild as HTMLElement).className),
  ).toContain('material-icons');
  await panel(page).getByRole('button', { name: 'After text' }).click();
  expect(
    await home(page)
      .locator('.nsw-button')
      .evaluate((b) => (b.lastElementChild as HTMLElement).className),
  ).toContain('material-icons');
  await panel(page).getByRole('button', { name: 'Remove icon' }).click();
  await expect(icon).toHaveCount(0);
});

test('optional parts and heading levels', async ({ page }) => {
  await addFromLibrary(page, 'card', 'Default');
  await expect(home(page).locator('.nsw-card__tag')).toHaveCount(1);
  await panel(page).getByRole('checkbox', { name: 'Tag' }).uncheck();
  await expect(home(page).locator('.nsw-card__tag')).toHaveCount(0);
  await panel(page).getByRole('checkbox', { name: 'Image' }).uncheck();
  await expect(home(page).locator('.nsw-card__image')).toHaveCount(0);
  await panel(page).getByLabel('Heading level').selectOption('2');
  await expect(home(page).locator('h2.nsw-card__title')).toHaveCount(1);
  await expect(home(page).locator('h3')).toHaveCount(0);
});

test('shrink text to fit reduces the font size, then truncates with a warning', async ({
  page,
}) => {
  await addFromLibrary(page, 'button', 'Brand Dark');
  const size = () => label(page).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const original = await size();
  await panel(page).getByLabel('Shrink text to fit').check();

  await panel(page).getByLabel('Label', { exact: true }).fill('Buttons');
  await panel(page).getByLabel('Label', { exact: true }).press('Enter');
  await expect.poll(size).toBeLessThan(original);
  expect(await size()).toBeGreaterThanOrEqual(original * 0.75 - 0.5);
  expect(await size()).toBeGreaterThanOrEqual(12);
  await expect(panel(page).getByText('Text is cut off')).toHaveCount(0);

  await panel(page)
    .getByLabel('Label', { exact: true })
    .fill('A far, far longer label that cannot possibly fit in this button');
  await panel(page).getByLabel('Label', { exact: true }).press('Enter');
  await expect(label(page)).toHaveAttribute('data-fit', 'truncated');
  await expect(panel(page).getByText('Text is cut off')).toBeVisible();
  expect(await size()).toBeGreaterThanOrEqual(12);
  expect(await label(page).evaluate((el) => getComputedStyle(el).textOverflow)).toBe('ellipsis');

  // Back to short text: the original size returns.
  await panel(page).getByLabel('Label', { exact: true }).fill('OK');
  await panel(page).getByLabel('Label', { exact: true }).press('Enter');
  await expect.poll(size).toBe(original);
  await expect(panel(page).getByText('Text is cut off')).toHaveCount(0);
});

test('replace an image by uploading, edit its alt text, and go back to the placeholder', async ({
  page,
}) => {
  await addFromLibrary(page, 'card', 'Default');
  const img = home(page).locator('.nsw-card__image img');
  await expect(img).toHaveAttribute('src', /svg\+xml/);
  await panel(page)
    .getByLabel('Upload image for Image')
    .setInputFiles({ name: 'dot.png', mimeType: 'image/png', buffer: PNG });
  await expect(img).toHaveAttribute('src', /^data:image\/png/);
  await panel(page).getByLabel('Alt text for Image').fill('A red dot');
  await panel(page).getByLabel('Alt text for Image').press('Enter');
  await expect(img).toHaveAttribute('alt', 'A red dot');
  await panel(page).getByRole('button', { name: 'Use placeholder' }).click();
  await expect(img).toHaveAttribute('src', /svg\+xml/);
  await expect(img).toHaveAttribute('alt', 'A red dot');
});

test('rejects files that are not images', async ({ page }) => {
  await addFromLibrary(page, 'card', 'Default');
  await panel(page)
    .getByLabel('Upload image for Image')
    .setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await expect(page.getByRole('status').filter({ hasText: 'Choose an image file' })).toBeVisible();
  await expect(home(page).locator('.nsw-card__image img')).toHaveAttribute('src', /svg\+xml/);
});

test('dropping an image file onto a picture in the mockup replaces it', async ({ page }) => {
  await addFromLibrary(page, 'card', 'Default');
  await home(page)
    .locator('.nsw-card__image img')
    .evaluate(async (img, b64) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const dt = new DataTransfer();
      dt.items.add(new File([bytes], 'dropped.png', { type: 'image/png' }));
      img.dispatchEvent(
        new DragEvent('dragover', { dataTransfer: dt, bubbles: true, cancelable: true }),
      );
      img.dispatchEvent(
        new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }),
      );
    }, PNG.toString('base64'));
  await expect(home(page).locator('.nsw-card__image img')).toHaveAttribute(
    'src',
    /^data:image\/png/,
  );
});

test('section background and padding', async ({ page }) => {
  await addFromLibrary(page, 'heading', 'Heading 1');
  await page
    .getByRole('navigation', { name: 'Selection' })
    .getByRole('button', { name: 'Section' })
    .click();
  await panel(page).getByRole('button', { name: 'Brand dark', exact: true }).click();
  const section = home(page).locator('section.nsw-section');
  await expect(section).toHaveClass(/nsw-section--brand-dark/);
  await expect(section).toHaveClass(/nsw-section--invert/);
  await panel(page).getByRole('button', { name: 'Compact' }).click();
  await expect(section).toHaveClass(/nsw-section--half-padding/);
  await panel(page).getByRole('button', { name: 'None' }).click();
  await expect(section).toHaveClass(/nsw-section--no-padding/);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(section).toHaveClass(/nsw-section--half-padding/);
});

test('grid columns and per-breakpoint widths', async ({ page }) => {
  await page.getByTestId('layout-blocks').getByRole('button', { name: '2 columns' }).click();
  await expect(panel(page).getByLabel('Number of columns')).toHaveText('2');
  await panel(page).getByRole('button', { name: 'More columns' }).click();
  await expect(home(page).locator('.nsw-col-md-4')).toHaveCount(3);
  await panel(page).getByLabel('Column 1 width at Medium').selectOption('8');
  await expect(home(page).locator('.nsw-col-md-8')).toHaveCount(1);
  await panel(page).getByLabel('Column 1 width at Large').selectOption('3');
  await expect(home(page).locator('.nsw-col-lg-3')).toHaveCount(1);
  await expect(panel(page).getByText('Medium widths add up to 16')).toBeVisible();
  await panel(page).getByRole('button', { name: 'Equal widths' }).click();
  await expect(home(page).locator('.nsw-col-md-4')).toHaveCount(3);
  await expect(home(page).locator('.nsw-col-lg-3')).toHaveCount(0);
  await panel(page).getByRole('button', { name: 'Fewer columns' }).click();
  await expect(home(page).locator('.nsw-col-md-6')).toHaveCount(2);
});

test('frame properties live in the panel', async ({ page }) => {
  await page.locator('.frame__name').first().click();
  await expect(panel(page).getByRole('heading', { name: 'Page', level: 2 })).toBeVisible();
  await panel(page).getByLabel('Name').fill('Landing');
  await panel(page).getByLabel('Name').press('Enter');
  await expect(page.locator('.frame__name').first()).toHaveText('Landing');
  await panel(page).getByLabel('Device').selectOption('desktop');
  await expect(panel(page).getByLabel('Width')).toHaveValue('1440');
  await panel(page).getByLabel('Width').fill('600');
  await panel(page).getByLabel('Width').press('Enter');
  expect(await page.locator('iframe[title="Landing"]').evaluate((f) => f.clientWidth)).toBe(600);
});

test('the panel says what to do when nothing is selected', async ({ page }) => {
  await expect(panel(page).getByText('Nothing selected')).toBeVisible();
  const c = await centre(page.locator('.frame__name').first());
  await page.mouse.click(c.x, c.y);
  await expect(panel(page).getByRole('heading', { name: 'Page', level: 2 })).toBeVisible();
});
