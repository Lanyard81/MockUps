import { expect, test, type Page } from '@playwright/test';
import { runAxe } from './axe';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const home = (page: Page) => page.frameLocator('iframe[title="Home"]');
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el
      ? `${el.getAttribute('role') ?? el.tagName}:${el.getAttribute('aria-label') ?? el.textContent?.trim().slice(0, 30)}`
      : '';
  });

test('skip links jump to the main areas', async ({ page }) => {
  await page.getByRole('link', { name: 'Skip to Properties' }).focus();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('properties-panel');
  await page.getByRole('link', { name: 'Skip to the canvas' }).focus();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('canvas');
});

test('the left tabs are a real tab list with arrow keys', async ({ page }) => {
  await expect(page.getByRole('tablist', { name: '' }).first()).toBeVisible();
  const library = page.getByRole('tab', { name: 'Library' });
  await library.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Templates' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('tab', { name: 'Templates' })).toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.press('Home');
  await expect(library).toHaveAttribute('aria-selected', 'true');
});

test('menus open with the arrow keys, move with them and give focus back on Esc', async ({
  page,
}) => {
  const file = page.getByRole('button', { name: 'File' });
  await file.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem').nth(1)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(file).toBeFocused();
});

test('Space presses a focused button instead of starting a pan', async ({ page }) => {
  await page.getByRole('button', { name: 'Search', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible();
});

test('a page can be built, selected, edited, reordered and deleted with no mouse', async ({
  page,
}) => {
  // Add two components from the command palette.
  for (const name of ['Heading 1', 'Paragraph']) {
    await page.keyboard.press('Control+k');
    await page.getByLabel('Search commands').fill(name);
    await page.keyboard.press('Enter');
  }
  await expect(home(page).locator('h1')).toHaveCount(1);

  // Step to the heading with ] and [ (nothing is selected by the mouse).
  await page.locator('#canvas').focus();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  for (let i = 0; i < 12; i++) {
    const title = await page
      .getByRole('complementary', { name: 'Properties' })
      .locator('h2')
      .textContent();
    if (/Heading/.test(title ?? '')) break;
    await page.keyboard.press(']');
  }
  await expect(page.getByRole('complementary', { name: 'Properties' }).locator('h2')).toContainText(
    'Heading',
  );

  // Edit its text, then finish.
  await page.keyboard.press('Enter');
  await page.keyboard.press('Control+a');
  await page.keyboard.type('Keyboard only');
  await page.keyboard.press('Enter');
  await expect(home(page).locator('h1')).toHaveText('Keyboard only');

  // Move through the Layers list: arrows, Enter to select, Alt+arrow to reorder, Delete.
  await page.getByRole('tab', { name: 'Library' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Layers' })).toHaveAttribute('aria-selected', 'true');
  const rows = page.getByRole('treeitem');
  await rows.first().focus();
  for (let i = 0; i < 12; i++) {
    if ((await focused(page)).includes('Heading')) break;
    await page.keyboard.press('ArrowDown');
  }
  expect(await focused(page)).toContain('Heading');
  await page.keyboard.press('Enter');
  await expect(
    rows.filter({ has: page.locator('.is-selected') }).or(page.locator('.layer-row.is-selected')),
  ).toContainText('Heading');
  await page.keyboard.press('Alt+ArrowDown');
  await expect(home(page).locator('h1')).toHaveCount(1);
  await page.keyboard.press('Delete');
  await expect(home(page).locator('h1')).toHaveCount(0);
  await page.keyboard.press('Control+z');
  await expect(home(page).locator('h1')).toHaveCount(1);
});

test('a page name can be selected and renamed from the keyboard', async ({ page }) => {
  const label = page.locator('.frame__label').first();
  await label.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('complementary', { name: 'Properties' }).locator('h2')).toHaveText(
    'Page',
  );
  await page.keyboard.press('F2');
  await page.keyboard.type('Landing');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('frame-Landing')).toBeVisible();
});

const SCREENS: [string, (p: Page) => Promise<void>][] = [
  ['the empty app', async () => undefined],
  [
    'a built page with a component selected',
    async (p) => {
      await p
        .getByTestId('component-heading')
        .getByRole('button', { name: 'Heading 1', exact: true })
        .click();
      await home(p).locator('h1').click();
    },
  ],
  [
    'the Templates tab',
    async (p) => {
      await p.getByRole('tab', { name: 'Templates' }).click();
    },
  ],
  [
    'the Layers tab',
    async (p) => {
      await p.getByRole('tab', { name: 'Layers' }).click();
    },
  ],
  [
    'the Comments tab',
    async (p) => {
      await p.getByRole('tab', { name: 'Comments' }).click();
    },
  ],
  [
    'the File menu',
    async (p) => {
      await p.getByRole('button', { name: 'File' }).click();
    },
  ],
  [
    'the Add page menu',
    async (p) => {
      await p.getByRole('button', { name: 'Add page' }).click();
    },
  ],
  [
    'the command palette',
    async (p) => {
      await p.keyboard.press('Control+k');
    },
  ],
  [
    'the shortcuts sheet',
    async (p) => {
      await p.keyboard.press('Shift+?');
    },
  ],
  [
    'the export dialog',
    async (p) => {
      await p.getByRole('button', { name: 'File' }).click();
      await p.getByRole('menuitem', { name: /Export/ }).click();
    },
  ],
  [
    'My mockups',
    async (p) => {
      await p.getByRole('button', { name: 'File' }).click();
      await p.getByRole('menuitem', { name: /My mockups/ }).click();
    },
  ],
  [
    'Version history',
    async (p) => {
      await p.getByRole('button', { name: 'File' }).click();
      await p.getByRole('menuitem', { name: /Version history/ }).click();
    },
  ],
  [
    'the import dialog',
    async (p) => {
      await p.getByRole('button', { name: 'File' }).click();
      await p.getByRole('menuitem', { name: /Import a page description/ }).click();
    },
  ],
  [
    'the accessibility check',
    async (p) => {
      await p.locator('.frame__label').first().click({ button: 'right' });
      await p.getByRole('menuitem', { name: /accessibility/i }).click();
    },
  ],
  [
    'the responsive check',
    async (p) => {
      await p.locator('.frame__label').first().click({ button: 'right' });
      await p.getByRole('menuitem', { name: /responsive/i }).click();
    },
  ],
];

for (const [name, setup] of SCREENS) {
  test(`axe finds no critical or serious problems on ${name}`, async ({ page }) => {
    await setup(page);
    await page.waitForTimeout(400);
    const violations = (await runAxe(page)).filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(
      violations.map(
        (v) =>
          `${v.id} (${v.impact}): ${v.nodes
            .map((n) => JSON.stringify(n.target))
            .join(', ')
            .slice(0, 300)}`,
      ),
    ).toEqual([]);
  });
}
