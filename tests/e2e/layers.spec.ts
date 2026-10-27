import { expect, test, type Page } from '@playwright/test';
import { addFromLibrary, centre, dragBetween } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const home = (page: Page) => page.frameLocator('iframe[title="Home"]');
const layersTab = (page: Page) => page.getByRole('tab', { name: 'Layers' });
const layers = (page: Page) => page.getByTestId('layers');
const texts = (page: Page, selector: string) =>
  page
    .locator('iframe[title="Home"]')
    .evaluate(
      (f, sel) =>
        [...(f as HTMLIFrameElement).contentDocument!.querySelectorAll(sel)].map(
          (e) => e.textContent!.trim().split(' ')[0]!,
        ),
      selector,
    );

test.describe('layers panel', () => {
  test('shows every frame as a tree, and selecting a layer selects it on the canvas', async ({
    page,
  }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    await addFromLibrary(page, 'button', 'Danger');
    await layersTab(page).click();
    await expect(layers(page).getByTestId('layer-frame')).toContainText('Home');
    for (const type of ['section', 'container', 'grid', 'column'])
      await expect(layers(page).getByTestId(`layer-${type}`)).toHaveCount(1);
    await expect(layers(page).getByTestId('layer-component')).toHaveCount(2);

    await layers(page).getByTestId('layer-component').first().click();
    await expect(
      page.getByRole('navigation', { name: 'Selection' }).locator('.is-current'),
    ).toContainText('Heading');
    await expect(page.locator('.ov-select')).toBeVisible();
    await layers(page).getByTestId('layer-section').click();
    await expect(
      page.getByRole('navigation', { name: 'Selection' }).locator('.is-current'),
    ).toHaveText('Section');
  });

  test('clicking something on the canvas highlights its layer', async ({ page }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    await addFromLibrary(page, 'button', 'Danger');
    await layersTab(page).click();
    await home(page).locator('h1').click();
    await expect(layers(page).locator('[aria-selected="true"]')).toContainText('Heading 1');
  });

  test('hide and show a layer', async ({ page }) => {
    await addFromLibrary(page, 'button', 'Danger');
    await layersTab(page).click();
    const row = layers(page).getByTestId('layer-component');
    await row.getByRole('button', { name: /^Hide/ }).click();
    await expect(home(page).locator('.nsw-button--danger')).toHaveCount(0);
    await expect(row).toHaveClass(/is-hidden/);
    await row.getByRole('button', { name: /^Show/ }).click();
    await expect(home(page).locator('.nsw-button--danger')).toHaveCount(1);
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(home(page).locator('.nsw-button--danger')).toHaveCount(0);
  });

  test('rename a layer by double-clicking its name; the new name is used everywhere', async ({
    page,
  }) => {
    await addFromLibrary(page, 'button', 'Danger');
    await layersTab(page).click();
    await layers(page).getByTestId('layer-component').locator('.layer-row__name').dblclick();
    await page.getByLabel('Layer name').fill('Delete account');
    await page.keyboard.press('Enter');
    await expect(layers(page).getByTestId('layer-component')).toContainText('Delete account');
    await expect(
      page.getByRole('navigation', { name: 'Selection' }).locator('.is-current'),
    ).toHaveText('Delete account');
    // Renaming back to the original label clears the custom name.
    await layers(page).getByTestId('layer-component').locator('.layer-row__name').dblclick();
    await page.getByLabel('Layer name').fill('');
    await page.keyboard.press('Enter');
    await expect(layers(page).getByTestId('layer-component')).toContainText('Buttons');
  });

  test('collapse and expand', async ({ page }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape'); // frame level, so nothing forces the tree open
    await layersTab(page).click();
    await expect(layers(page).getByTestId('layer-component')).toHaveCount(1);
    await layers(page)
      .getByTestId('layer-section')
      .getByRole('button', { name: 'Collapse' })
      .click();
    await expect(layers(page).getByTestId('layer-container')).toHaveCount(0);
    await layers(page).getByTestId('layer-section').getByRole('button', { name: 'Expand' }).click();
    await expect(layers(page).getByTestId('layer-container')).toHaveCount(1);
  });

  test('drag a layer to reorder, as one undo step', async ({ page }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    await addFromLibrary(page, 'paragraph', 'Body text');
    await layersTab(page).click();
    expect(await texts(page, 'h1, p')).toEqual(['Heading', 'Body']);
    const rows = layers(page).getByTestId('layer-component');
    const first = (await rows.first().boundingBox())!;
    await dragBetween(
      page,
      await centre(rows.nth(1)),
      { x: first.x + 80, y: first.y + 3 },
      async () => {
        await expect(layers(page).locator('.is-drop-before')).toHaveCount(1);
      },
    );
    await expect.poll(() => texts(page, 'h1, p')).toEqual(['Body', 'Heading']);
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect.poll(() => texts(page, 'h1, p')).toEqual(['Heading', 'Body']);
  });

  test('drops that break the tree rules are refused', async ({ page }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    await layersTab(page).click();
    const comp = layers(page).getByTestId('layer-component');
    const section = (await layers(page).getByTestId('layer-section').boundingBox())!;
    await dragBetween(
      page,
      await centre(comp),
      { x: section.x + 80, y: section.y + section.height / 2 },
      async () => {
        await expect(layers(page).locator('.is-drop-invalid')).toHaveCount(1);
      },
    );
    await expect(layers(page).getByTestId('layer-component')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Undo' })).toBeEnabled(); // only the add
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
  });

  test('drag a layer into another frame', async ({ page }) => {
    await addFromLibrary(page, 'masthead', 'Dark');
    await page.getByRole('button', { name: 'Add page' }).click();
    await page.getByRole('menuitem', { name: /Tablet/ }).click();
    await layersTab(page).click();
    const frameRow = layers(page).getByTestId('layer-frame').nth(1);
    await dragBetween(
      page,
      await centre(layers(page).getByTestId('layer-component')),
      await centre(frameRow),
    );
    await expect(
      page.frameLocator('iframe[title="Tablet 2"]').locator('.nsw-masthead'),
    ).toHaveCount(1);
    await expect(home(page).locator('.nsw-masthead')).toHaveCount(0);
  });
});

test.describe('quick page parts', () => {
  test('one click adds the masthead and header at the top, and a footer at the bottom', async ({
    page,
  }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    await page
      .getByTestId('page-parts')
      .getByRole('button', { name: 'Add masthead + header' })
      .click();
    await page.getByTestId('page-parts').getByRole('button', { name: 'Add footer' }).click();
    const order = await page
      .locator('iframe[title="Home"]')
      .evaluate((f) =>
        [...(f as HTMLIFrameElement).contentDocument!.getElementById('root')!.children].map((e) =>
          e.querySelector('.nsw-masthead')
            ? 'masthead'
            : e.querySelector('.nsw-header')
              ? 'header'
              : e.querySelector('.nsw-footer')
                ? 'footer'
                : 'section',
        ),
      );
    expect(order).toEqual(['masthead', 'header', 'section', 'footer']);
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(home(page).locator('.nsw-footer')).toHaveCount(0);
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(home(page).locator('.nsw-masthead, .nsw-header')).toHaveCount(0);
  });

  test('the frame panel has the same buttons', async ({ page }) => {
    await page.locator('.frame__name').first().click();
    await page
      .getByRole('complementary', { name: 'Properties' })
      .getByRole('button', { name: 'Add footer' })
      .click();
    await expect(home(page).locator('.nsw-footer')).toHaveCount(1);
  });
});

test.describe('right-click menu', () => {
  test('actions on a component', async ({ page }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    const menu = page.getByRole('menu', { name: 'Actions' });
    await home(page).locator('h1').click({ button: 'right' });
    await expect(menu).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: /^Paste/ })).toBeDisabled();
    await menu.getByRole('menuitem', { name: /^Copy(?! HTML)/ }).click();
    await expect(menu).toHaveCount(0);

    await home(page).locator('h1').click({ button: 'right' });
    await expect(menu.getByRole('menuitem', { name: /^Paste/ })).toBeEnabled();
    await menu.getByRole('menuitem', { name: /^Duplicate/ }).click();
    await expect(home(page).locator('h1')).toHaveCount(2);

    await home(page).locator('h1').first().click({ button: 'right' });
    await menu.getByRole('menuitem', { name: /^Move down/ }).click();
    await home(page).locator('h1').first().click({ button: 'right' });
    await menu.getByRole('menuitem', { name: /^Delete/ }).click();
    await expect(home(page).locator('h1')).toHaveCount(1);
  });

  test('Edit text edits the text that was right-clicked; Esc closes the menu', async ({ page }) => {
    await addFromLibrary(page, 'card', 'Default');
    const menu = page.getByRole('menu', { name: 'Actions' });
    await home(page).locator('[data-edit="title"]').click({ button: 'right' });
    await menu.getByRole('menuitem', { name: /^Edit text/ }).click();
    await expect(home(page).locator('[data-edit="title"]')).toHaveAttribute(
      'contenteditable',
      /.+/,
    );
    await page.keyboard.press('Escape');

    await home(page).locator('[data-edit="copy"]').click({ button: 'right' });
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
  });

  test('clicking elsewhere closes it, and frames have their own menu', async ({ page }) => {
    await addFromLibrary(page, 'heading', 'Heading 1');
    const menu = page.getByRole('menu', { name: 'Actions' });
    await home(page).locator('h1').click({ button: 'right' });
    await expect(menu).toBeVisible();
    await home(page).locator('h1').click(); // a press inside the frame closes it
    await expect(menu).toHaveCount(0);

    await page.locator('.frame__name').first().click({ button: 'right' });
    await menu.getByRole('menuitem', { name: 'Add footer' }).click();
    await expect(home(page).locator('.nsw-footer')).toHaveCount(1);
  });

  test('a layer row has the same menu', async ({ page }) => {
    await addFromLibrary(page, 'button', 'Danger');
    await layersTab(page).click();
    await layers(page).getByTestId('layer-component').click({ button: 'right' });
    await page.getByRole('menuitem', { name: /^Duplicate/ }).click();
    await expect(home(page).locator('.nsw-button--danger')).toHaveCount(2);
  });
});

test.describe('shortcuts sheet', () => {
  test('? opens it, Esc closes it, and it is not triggered while typing', async ({ page }) => {
    const sheet = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
    await page.keyboard.press('Shift+?');
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText('Duplicate');
    await expect(sheet).toContainText('Zoom to fit');
    await page.keyboard.press('Escape');
    await expect(sheet).toHaveCount(0);

    await page.getByLabel('Search components').fill('a?');
    await expect(sheet).toHaveCount(0);

    await page.getByRole('button', { name: 'Keyboard shortcuts' }).click();
    await expect(sheet).toBeVisible();
    await sheet.getByRole('button', { name: 'Close' }).click();
    await expect(sheet).toHaveCount(0);
  });
});

test.describe('unique ids', () => {
  test('the same component twice never repeats an id, and each label belongs to its own input', async ({
    page,
  }) => {
    await addFromLibrary(page, 'form', 'Text input');
    await addFromLibrary(page, 'form', 'Text input');
    const ids = await page
      .locator('iframe[title="Home"]')
      .evaluate((f) =>
        [...(f as HTMLIFrameElement).contentDocument!.querySelectorAll('[id]')]
          .map((e) => e.id)
          .filter((id) => id !== 'root'),
      );
    expect(ids.length).toBeGreaterThanOrEqual(2);
    expect(new Set(ids).size).toBe(ids.length);

    // In Preview, clicking the second label focuses the second input.
    await page.getByRole('button', { name: 'Preview' }).click();
    await home(page).locator('label').nth(1).click();
    const focused = await page.locator('iframe[title="Home"]').evaluate((f) => {
      const d = (f as HTMLIFrameElement).contentDocument!;
      return [...d.querySelectorAll('input')].indexOf(d.activeElement as HTMLInputElement);
    });
    expect(focused).toBe(1);
  });

  test('tabs stay wired when used twice', async ({ page }) => {
    await addFromLibrary(page, 'tabs', 'Default');
    await addFromLibrary(page, 'tabs', 'Default');
    await page.getByRole('button', { name: 'Preview' }).click();
    await home(page).locator('.nsw-tabs').nth(1).getByRole('tab').nth(1).click();
    await expect(home(page).locator('.nsw-tabs').nth(1).getByRole('tab').nth(1)).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(home(page).locator('.nsw-tabs').nth(0).getByRole('tab').nth(0)).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
