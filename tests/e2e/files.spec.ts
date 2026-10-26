import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { addFromLibrary } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const home = (page: Page, name = 'Home') => page.frameLocator(`iframe[title="${name}"]`);
const status = (page: Page) => page.getByTestId('save-status');
const fileMenu = async (page: Page, item: string | RegExp) => {
  await page.getByRole('button', { name: 'File' }).click();
  await page.getByRole('menuitem', { name: item }).click();
};
const download = async (page: Page, action: () => Promise<void>) => {
  const [d] = await Promise.all([page.waitForEvent('download'), action()]);
  return { name: d.suggestedFilename(), bytes: readFileSync(await d.path()) };
};
const pngSize = (b: Buffer) => ({ width: b.readUInt32BE(16), height: b.readUInt32BE(20) });

test.describe('autosave', () => {
  test('work is saved by itself and comes back after a reload', async ({ page }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    await expect(status(page)).toHaveText('Saving…');
    await expect(status(page)).toHaveText('Saved');
    await page.getByRole('button', { name: 'Untitled mockup' }).click();
    await page.getByLabel('Mockup name').fill('Licence renewal');
    await page.keyboard.press('Enter');
    await expect(status(page)).toHaveText('Saved');

    await page.reload();
    await expect(page.getByRole('button', { name: 'Licence renewal' })).toBeVisible();
    await expect(home(page).locator('h1')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled(); // a fresh history, not a half-restored one
  });

  test('the camera position is restored too', async ({ page }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    await page.getByLabel('Zoom level').selectOption('50');
    await expect(status(page)).toHaveText('Saved');
    await page.reload();
    await expect(page.getByLabel('Zoom level')).toHaveValue('50');
  });
});

test.describe('files', () => {
  test('Save to file gives a .mockup.json with images embedded; Open file brings it back as a new mockup', async ({
    page,
  }) => {
    await addFromLibrary(page, 'card', 'Default');
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
      'base64',
    );
    await page
      .getByLabel('Upload image for Image')
      .setInputFiles({ name: 'dot.png', mimeType: 'image/png', buffer: png });
    await expect(home(page).locator('.nsw-card__image img')).toHaveAttribute(
      'src',
      /^data:image\/png/,
    );

    const saved = await download(page, () => fileMenu(page, /Save to file/));
    expect(saved.name).toBe('untitled-mockup.mockup.json');
    const json = JSON.parse(saved.bytes.toString('utf8'));
    expect(json.app).toBe('pagewright');
    expect(Object.values(json.doc.images)[0]).toMatchObject({
      dataUrl: expect.stringMatching(/^data:image\/png/),
    });

    // Start something else, then open the file.
    await fileMenu(page, 'New mockup');
    await expect(home(page).locator('.nsw-card')).toHaveCount(0);
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      fileMenu(page, /Open file/),
    ]);
    await chooser.setFiles({ name: saved.name, mimeType: 'application/json', buffer: saved.bytes });
    await expect(home(page).locator('.nsw-card')).toHaveCount(1);
    await expect(home(page).locator('.nsw-card__image img')).toHaveAttribute(
      'src',
      /^data:image\/png/,
    );
    await expect(page.getByRole('status').filter({ hasText: 'Opened' })).toBeVisible();
  });

  test('a file that is not a mockup is refused, in words', async ({ page }) => {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      fileMenu(page, /Open file/),
    ]);
    await chooser.setFiles({
      name: 'notes.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"hello":"world"}'),
    });
    await expect(page.getByRole('status').filter({ hasText: 'isn’t a mockup file' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Untitled mockup' })).toBeVisible();
  });

  test('a damaged or hostile mockup file is refused without opening anything', async ({ page }) => {
    const bad = JSON.stringify({
      version: 1,
      name: 'Evil',
      frames: [{ id: 'f', name: 'F', device: 'iphone', width: 393, x: 0, y: 0, root: ['x'] }],
      nodes: { x: { id: 'x', type: 'component', componentId: 'button' } },
      images: {},
    });
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      fileMenu(page, /Open file/),
    ]);
    await chooser.setFiles({
      name: 'evil.mockup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(bad),
    });
    await expect(page.getByRole('status').filter({ hasText: 'breaks the rules' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Evil' })).toHaveCount(0);
  });

  test('scripts hidden in a file’s text or links never run', async ({ page }) => {
    const id = 'n1';
    const file = JSON.stringify({
      version: 1,
      name: 'Sneaky',
      frames: [{ id: 'f', name: 'Home', device: 'iphone', width: 393, x: 0, y: 0, root: ['s'] }],
      nodes: {
        s: { id: 's', type: 'section', children: ['c'] },
        c: { id: 'c', type: 'container', children: ['g'] },
        g: { id: 'g', type: 'grid', children: ['k'] },
        k: { id: 'k', type: 'column', props: { spans: { base: 12 } }, children: [id] },
        [id]: {
          id,
          type: 'component',
          componentId: 'button',
          variant: 'dark',
          text: { label: '<img src=x onerror="window.top.__pwned=1">' },
          props: { href: 'javascript:window.top.__pwned=1' },
        },
      },
      images: {},
    });
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      fileMenu(page, /Open file/),
    ]);
    await chooser.setFiles({
      name: 'sneaky.mockup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(file),
    });
    await expect(page.getByRole('button', { name: 'Sneaky' })).toBeVisible();
    await expect(home(page).locator('.nsw-button')).toHaveCount(1);
    await expect(home(page).locator('img')).toHaveCount(0);
    // The unsafe link is removed entirely (so there is no href at all).
    expect((await home(page).locator('a.nsw-button').getAttribute('href')) ?? '').not.toMatch(
      /javascript:/i,
    );
    await page.getByRole('button', { name: 'Preview' }).click();
    await home(page).locator('.nsw-button').click();
    expect(
      await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned),
    ).toBeUndefined();
  });
});

test.describe('my mockups', () => {
  test('list, open, rename, duplicate and delete (with confirmation)', async ({ page }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    await page.getByRole('button', { name: 'Untitled mockup' }).click();
    await page.getByLabel('Mockup name').fill('First');
    await page.keyboard.press('Enter');
    await expect(status(page)).toHaveText('Saved');

    await fileMenu(page, 'New mockup');
    await addFromLibrary(page, 'button', 'Danger');
    await page.getByRole('button', { name: 'Untitled mockup' }).click();
    await page.getByLabel('Mockup name').fill('Second');
    await page.keyboard.press('Enter');
    await expect(status(page)).toHaveText('Saved');

    await fileMenu(page, /My mockups/);
    const dialog = page.getByRole('dialog', { name: 'My mockups' });
    // Match the name itself: "Rename" and "Duplicate" buttons next to each other spell "renamed" too.
    const cardNamed = (name: string) =>
      dialog.getByTestId('mockup-card').filter({ has: page.getByText(name, { exact: true }) });
    await expect(dialog.getByTestId('mockup-card')).toHaveCount(2);
    await expect(dialog.getByTestId('mockup-card').first()).toContainText('Second');
    await expect(dialog.getByTestId('mockup-card').first()).toContainText('Open now');

    // Open the other one.
    await dialog.getByRole('button', { name: 'Open First' }).click();
    await expect(page.getByRole('button', { name: 'First' })).toBeVisible();
    await expect(home(page).locator('h1')).toHaveCount(1);
    await expect(status(page)).toHaveText('Saved');

    // Rename and duplicate.
    await fileMenu(page, /My mockups/);
    const card = cardNamed('Second');
    await card.getByRole('button', { name: 'Rename' }).click();
    await dialog.getByLabel('Mockup name').fill('Renamed');
    await page.keyboard.press('Enter');
    await expect(cardNamed('Renamed')).toHaveCount(1);
    await cardNamed('Renamed').getByRole('button', { name: 'Duplicate' }).click();
    await expect(cardNamed('Renamed copy')).toHaveCount(1);

    // Delete asks first, and Cancel keeps it.
    const copy = cardNamed('Renamed copy');
    await copy.getByRole('button', { name: 'Delete' }).click();
    const confirm = page.getByRole('dialog', { name: 'Delete this mockup?' });
    await expect(confirm).toContainText('can’t be undone');
    await confirm.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog.getByTestId('mockup-card')).toHaveCount(3);
    await copy.getByRole('button', { name: 'Delete' }).click();
    await confirm.getByRole('button', { name: 'Delete mockup' }).click();
    await expect(dialog.getByTestId('mockup-card')).toHaveCount(2);
  });

  test('New mockup starts empty and the old one stays saved', async ({ page }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    await expect(status(page)).toHaveText('Saved');
    await fileMenu(page, 'New mockup');
    await expect(home(page).locator('h1')).toHaveCount(0);
    await fileMenu(page, /My mockups/);
    await expect(page.getByTestId('mockup-card')).toHaveCount(2);
  });
});

test.describe('export', () => {
  const open = async (page: Page) => {
    await fileMenu(page, /Export/);
    return page.getByRole('dialog', { name: 'Export' });
  };

  test('PNG of the whole page, at 1× and 2×', async ({ page }) => {
    await addFromLibrary(page, 'card', 'Default');
    const dialog = await open(page);
    await dialog.getByLabel('1× (normal)').check();
    const one = await download(page, () =>
      dialog.getByRole('button', { name: 'Export', exact: true }).click(),
    );
    expect(one.bytes.subarray(1, 4).toString()).toBe('PNG');
    expect(one.name).toBe('untitled-mockup-home.png');
    const size1 = pngSize(one.bytes);
    expect(size1.width).toBe(393);
    expect(size1.height).toBeGreaterThanOrEqual(852);

    const dialog2 = await open(page);
    const two = await download(page, () =>
      dialog2.getByRole('button', { name: 'Export', exact: true }).click(),
    );
    expect(two.name).toBe('untitled-mockup-home@2x.png');
    expect(pngSize(two.bytes)).toEqual({ width: 786, height: size1.height * 2 });
  });

  test('a tall page is captured at full height, not cut off at the screen', async ({ page }) => {
    for (let i = 0; i < 6; i++) await addFromLibrary(page, 'card', 'Default');
    const dialog = await open(page);
    await dialog.getByLabel('1× (normal)').check();
    const png = await download(page, () =>
      dialog.getByRole('button', { name: 'Export', exact: true }).click(),
    );
    expect(pngSize(png.bytes).height).toBeGreaterThan(2000);
  });

  test('all frames at once come as a zip', async ({ page }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    await page.getByRole('button', { name: 'Add frame' }).click();
    await page.getByRole('menuitem', { name: /Tablet/ }).click();
    const dialog = await open(page);
    await dialog.getByLabel(/All frames \(2\)/).check();
    await dialog.getByLabel('1× (normal)').check();
    const zip = await download(page, () =>
      dialog.getByRole('button', { name: 'Export', exact: true }).click(),
    );
    expect(zip.name).toBe('untitled-mockup-png.zip');
    expect(zip.bytes.readUInt32LE(0)).toBe(0x04034b50);
    const text = zip.bytes.toString('latin1');
    expect(text).toContain('home.png');
    expect(text).toContain('tablet-2.png');
  });

  test('a self-contained HTML page works on its own, from disk, with NSW styles', async ({
    page,
    context,
  }) => {
    await addFromLibrary(page, 'button', 'Brand Dark');
    await addFromLibrary(page, 'accordion', 'Default');
    const dialog = await open(page);
    await dialog.getByLabel('HTML page').check();
    await dialog.getByLabel('Fully self-contained').check();
    const d = await Promise.all([
      page.waitForEvent('download'),
      dialog.getByRole('button', { name: 'Export', exact: true }).click(),
    ]);
    expect(d[0].suggestedFilename()).toBe('home.html');
    // Playwright stores downloads without an extension, and a browser shows such a file as plain text.
    const path = join(tmpdir(), `nsw-export-${Date.now()}.html`);
    await d[0].saveAs(path);
    const html = readFileSync(path, 'utf8');
    expect(html).not.toContain('data-node');
    expect(html).not.toMatch(/<link[^>]+href=|<script[^>]+src=/);

    await context.setOffline(true);
    const viewer = await context.newPage();
    await viewer.goto(`file://${path}`);
    await expect(viewer.locator('.nsw-button--dark')).toHaveCSS(
      'background-color',
      'rgb(0, 38, 100)',
    );
    const details = viewer.locator('details.nsw-accordion__item').nth(1);
    await details.locator('summary').click(); // the NSW script and markup are live
    await expect(details).toHaveAttribute('open', '');
    await context.setOffline(false);
  });

  test('the small version links to NSW instead of carrying it', async ({ page }) => {
    await addFromLibrary(page, 'button', 'Brand Dark');
    const dialog = await open(page);
    await dialog.getByLabel('HTML page').check();
    await dialog.getByLabel('Link to NSW from the internet').check();
    const file = await download(page, () =>
      dialog.getByRole('button', { name: 'Export', exact: true }).click(),
    );
    const html = file.bytes.toString('utf8');
    expect(html).toContain('cdn.jsdelivr.net/npm/nsw-design-system@3');
    expect(file.bytes.length).toBeLessThan(10_000);
  });

  test('several frames as HTML give pages, an index that links them and shared assets', async ({
    page,
  }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    await page.getByRole('button', { name: 'Add frame' }).click();
    await page.getByRole('menuitem', { name: /Desktop/ }).click();
    const dialog = await open(page);
    await dialog.getByLabel(/All frames/).check();
    await dialog.getByLabel('HTML page').check();
    const zip = await download(page, () =>
      dialog.getByRole('button', { name: 'Export', exact: true }).click(),
    );
    expect(zip.name).toBe('untitled-mockup-html.zip');
    const names = zip.bytes.toString('latin1');
    for (const n of [
      'index.html',
      'home.html',
      'desktop-2.html',
      'assets/nsw.css',
      'assets/nsw.js',
    ])
      expect(names).toContain(n);
  });
});

test.describe('copy HTML for developers', () => {
  test('copies clean, indented markup of the selection', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await addFromLibrary(page, 'button', 'Brand Dark');
    await fileMenu(page, /Copy HTML of selection/);
    await expect(page.getByRole('status').filter({ hasText: 'HTML copied' })).toBeVisible();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('<button class="nsw-button nsw-button--dark"');
    expect(text).toContain('Button');
    expect(text).not.toMatch(/data-node|data-edit/);
    expect(text).not.toContain('<div>'); // wrapper unwrapped
  });

  test('copying a section includes everything inside it', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await addFromLibrary(page, 'heading', 'Heading 1');
    await addFromLibrary(page, 'button', 'Danger');
    await page
      .getByRole('navigation', { name: 'Selection' })
      .getByRole('button', { name: 'Section' })
      .click();
    await fileMenu(page, /Copy HTML of selection/);
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toMatch(/<section class="nsw-section[^"]*">/);
    expect(text).toContain('<h1>');
    expect(text).toContain('nsw-button--danger');
    expect(text.split('\n').length).toBeGreaterThan(5);
  });

  test('says what to do when nothing is selected', async ({ page }) => {
    await page.getByRole('button', { name: 'File' }).click();
    await expect(page.getByRole('menuitem', { name: /Copy HTML of selection/ })).toBeDisabled();
  });
});

test.describe('when the browser will not keep data', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      indexedDB.open = () => {
        throw new Error('IndexedDB is blocked');
      };
    });
    await page.goto('./');
    await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
  });

  test('a clear banner says work is not being saved and offers Save to file', async ({ page }) => {
    const banner = page.getByRole('alert');
    await expect(banner).toContainText('isn’t being saved automatically');
    await expect(banner).toContainText('Save to file');
    await expect(status(page)).toHaveText('Not saved automatically');
    await addFromLibrary(page, 'heading', 'Heading 1');
    await expect(home(page).locator('h1')).toHaveCount(1); // the app still works
    const saved = await download(page, () =>
      banner.getByRole('button', { name: 'Save to file' }).click(),
    );
    expect(saved.name).toMatch(/\.mockup\.json$/);
    await banner.getByRole('button', { name: 'Dismiss' }).click();
    await expect(banner).toHaveCount(0);
  });
});
