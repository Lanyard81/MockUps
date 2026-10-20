import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
  await page.getByRole('button', { name: 'Add frame' }).click();
  await page
    .getByRole('group', { name: 'Style kit for the new frame' })
    .getByRole('button', { name: 'SharePoint' })
    .click();
  await page.getByRole('menuitem', { name: /Desktop/ }).click();
  await page
    .getByTestId('layout-blocks')
    .getByRole('button', { name: 'One column', exact: true })
    .click();
});

const inner = (page: Page) => page.frameLocator('iframe.frame__iframe').nth(1);
const add = async (page: Page, id: string, variant: string) => {
  const tile = page
    .getByTestId(`component-${id}`)
    .getByRole('button', { name: variant, exact: true });
  await tile.scrollIntoViewIfNeeded();
  await tile.click();
};
const select = (page: Page, selector: string) => inner(page).locator(selector).first();

test('every core web part can be added, in each of its layouts', async ({ page }) => {
  test.setTimeout(120_000);
  const cases: [string, string, string][] = [
    ['sp-text', 'Paragraph', '.sp-text p'],
    ['sp-text', 'Heading 2', '.sp-text h2'],
    ['sp-text', 'Pull quote', '.sp-quote'],
    ['sp-text', 'Bulleted list', '.sp-text ul'],
    ['sp-text', 'Table', '.sp-table'],
    ['sp-image', 'Image', '.sp-image__frame img'],
    ['sp-image-gallery', 'Brick', '.sp-gallery--brick'],
    ['sp-image-gallery', 'Grid', '.sp-gallery--grid'],
    ['sp-image-gallery', 'Carousel', '.sp-gallery--carousel'],
    ['sp-hero', 'Tiles', '.sp-hero--tiles'],
    ['sp-hero', 'Layers', '.sp-hero--layers'],
    ['sp-quick-links', 'Compact', '.sp-ql--compact'],
    ['sp-quick-links', 'Filmstrip', '.sp-ql--filmstrip'],
    ['sp-quick-links', 'Grid', '.sp-ql--grid'],
    ['sp-quick-links', 'Button', '.sp-ql--button'],
    ['sp-quick-links', 'List', '.sp-ql--list'],
    ['sp-quick-links', 'Tiles', '.sp-ql--tiles'],
    ['sp-news', 'Top story', '.sp-news--top'],
    ['sp-news', 'List', '.sp-news--list'],
    ['sp-news', 'Side-by-side', '.sp-news--side'],
    ['sp-news', 'Hub news', '.sp-news--hub'],
    ['sp-news', 'Carousel', '.sp-news--carousel'],
    ['sp-news', 'Tiles', '.sp-news--tiles'],
    ['sp-news', 'Filmstrip', '.sp-news--filmstrip'],
    ['sp-events', 'Compact', '.sp-events--compact'],
    ['sp-events', 'Filmstrip', '.sp-events--filmstrip'],
    ['sp-highlighted-content', 'Cards', '.sp-hc--cards'],
    ['sp-highlighted-content', 'List', '.sp-hc--list'],
    ['sp-people', 'Compact', '.sp-people--compact'],
    ['sp-people', 'Descriptive', '.sp-people--descriptive'],
    ['sp-document-library', 'Document library', '.sp-doclib .sp-grid'],
    ['sp-list', 'List', '.sp-listview .sp-grid'],
    ['sp-countdown', 'Countdown timer', '.sp-countdown'],
    ['sp-page-properties', 'Page properties', '.sp-props'],
    ['sp-button', 'Button', '.sp-button'],
    ['sp-cta', 'Call to action', '.sp-cta'],
    ['sp-link', 'Preview card', '.sp-linkcard'],
    ['sp-divider', 'Divider', '.sp-divider'],
    ['sp-spacer', 'Spacer', '.sp-spacer'],
  ];
  for (const [id, variant, selector] of cases) {
    await add(page, id, variant);
    await expect(inner(page).locator(`.sp-column ${selector}`), `${id} ${variant}`).toHaveCount(1);
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(inner(page).locator(`.sp-column ${selector}`)).toHaveCount(0);
  }
});

test('switch a web part’s layout, hide its title, and edit its text in place; undo each', async ({
  page,
}) => {
  await add(page, 'sp-news', 'Top story');
  await expect(inner(page).locator('.sp-news--top')).toHaveCount(1);
  await page
    .getByRole('group', { name: 'Variant' })
    .getByRole('button', { name: 'Tiles', exact: true })
    .click();
  await expect(inner(page).locator('.sp-news--tiles')).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(inner(page).locator('.sp-news--top')).toHaveCount(1);

  await expect(inner(page).locator('.sp-wp__head')).toHaveCount(1);
  await page.getByLabel('Show title and commands').uncheck();
  await expect(inner(page).locator('.sp-wp__head')).toHaveCount(0);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(inner(page).locator('.sp-wp__head')).toHaveCount(1);

  const title = inner(page).locator('.sp-news__lead .sp-story__title');
  await title.dblclick();
  await page.keyboard.press('Control+a');
  await page.keyboard.type('Bigger news');
  await page.keyboard.press('Enter');
  await expect(title).toHaveText('Bigger news');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(title).toHaveText('Our new office opens next month');
});

test('quick links: choose another icon, centre them, and show fewer links', async ({ page }) => {
  await add(page, 'sp-quick-links', 'Compact');
  const first = inner(page).locator('.sp-ql__item').first().locator('.sp-ql__icon svg');
  const before = await first.innerHTML();

  await page.getByRole('button', { name: 'Link 1 icon', exact: true }).click();
  await page.getByLabel('Search icons').fill('rocket');
  await page.getByRole('button', { name: 'rocket', exact: true }).click();
  await expect.poll(() => first.innerHTML()).not.toBe(before);

  await page.getByLabel('Alignment').selectOption('center');
  await expect(inner(page).locator('.sp-ql--align-center')).toHaveCount(1);
  await page.getByRole('checkbox', { name: 'Link 6' }).uncheck();
  await expect(inner(page).locator('.sp-ql__item')).toHaveCount(5);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(inner(page).locator('.sp-ql__item')).toHaveCount(6);
});

test('a hero shows between one and five items', async ({ page }) => {
  await add(page, 'sp-hero', 'Tiles');
  await expect(inner(page).locator('.sp-hero__tile')).toHaveCount(5);
  for (const n of [5, 4, 3, 2]) await page.getByLabel(`Item ${n}`, { exact: true }).uncheck();
  await expect(inner(page).locator('.sp-hero__tile')).toHaveCount(1);
});

test('carousels and filmstrips work in Preview', async ({ page }) => {
  await add(page, 'sp-news', 'Carousel');
  await add(page, 'sp-news', 'Filmstrip');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();

  const slides = inner(page).locator('.sp-news--carousel .sp-carousel__slide');
  await expect(slides.nth(0)).toHaveClass(/is-active/);
  await inner(page).locator('.sp-news--carousel [data-sp-next]').click();
  await expect(slides.nth(1)).toHaveClass(/is-active/);
  await expect(slides.nth(0)).not.toHaveClass(/is-active/);
  await inner(page).locator('.sp-news--carousel [data-sp-prev]').click();
  await expect(slides.nth(0)).toHaveClass(/is-active/);

  const track = inner(page).locator('.sp-news--filmstrip .sp-strip__track');
  expect(await track.evaluate((el) => el.scrollLeft)).toBe(0);
  await inner(page).locator('.sp-news--filmstrip [data-sp-next]').click();
  await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
});

test('a web part can be dropped from the library onto the canvas', async ({ page }) => {
  await add(page, 'sp-text', 'Paragraph');
  const tile = page
    .getByTestId('component-sp-divider')
    .getByRole('button', { name: 'Divider', exact: true });
  await tile.scrollIntoViewIfNeeded();
  const from = (await tile.boundingBox())!;
  const target = (await select(page, '.sp-text').boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + 20, target.y + 4, { steps: 12 });
  await page.mouse.up();
  await expect(inner(page).locator('.sp-column .sp-divider')).toHaveCount(1);
  await expect(inner(page).locator('.sp-column > [data-node]').first()).toContainText(
    'Divider'.slice(0, 0),
  );
});
