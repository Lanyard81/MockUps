import { expect, test, type Page } from '@playwright/test';
import { addFromLibrary, centre, dragBetween } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
});

const frames = (page: Page) => page.locator('iframe.frame__iframe');
const addFrame = async (page: Page, kit: 'NSW' | 'SharePoint', device = 'Desktop') => {
  await page.getByRole('button', { name: 'Add frame' }).click();
  await page
    .getByRole('group', { name: 'Style kit for the new frame' })
    .getByRole('button', { name: kit })
    .click();
  await page.getByRole('menuitem', { name: new RegExp(device) }).click();
};
const libraryKit = (page: Page) => page.getByRole('group', { name: 'Style kit' });

test('Add frame asks for the kit, remembers it, and the frame shows a kit badge', async ({
  page,
}) => {
  await expect(page.getByTestId('frame-kit')).toHaveText(['NSW']);
  await addFrame(page, 'SharePoint');
  await expect(frames(page)).toHaveCount(2);
  await expect(page.getByTestId('frame-kit')).toHaveText(['NSW', 'SharePoint']);

  // The next time, the SharePoint choice is already selected.
  await page.getByRole('button', { name: 'Add frame' }).click();
  await expect(
    page
      .getByRole('group', { name: 'Style kit for the new frame' })
      .getByRole('button', { name: 'SharePoint' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(frames(page)).toHaveCount(1);
});

test('the library follows the selected frame; the properties panel names the kit', async ({
  page,
}) => {
  await addFrame(page, 'SharePoint');
  // The new frame is selected, so the library shows SharePoint.
  await expect(libraryKit(page).getByRole('button', { name: 'SharePoint' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByTestId('component-sp-text')).toBeVisible();
  await expect(page.getByTestId('frame-kit-info')).toContainText('SharePoint');

  await page.getByTestId('frame-Home').locator('.frame__name').click();
  await expect(libraryKit(page).getByRole('button', { name: 'NSW' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByTestId('component-heading')).toBeVisible();
  await expect(page.getByTestId('component-sp-text')).toHaveCount(0);
});

test('a SharePoint web part goes into a SharePoint frame, and undo removes it', async ({
  page,
}) => {
  await addFrame(page, 'SharePoint');
  await addFromLibrary(page, 'sp-text', 'Paragraph');
  const inner = page.frameLocator('iframe.frame__iframe').nth(1);
  await expect(inner.locator('.sp-site .sp-section .sp-column .sp-text')).toHaveCount(1);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(inner.locator('.sp-text')).toHaveCount(0);
});

test('browsing the other kit’s library is allowed, adding from it to the wrong frame is not', async ({
  page,
}) => {
  await addFrame(page, 'SharePoint');
  await libraryKit(page).getByRole('button', { name: 'NSW' }).click();
  await expect(page.getByTestId('component-heading')).toBeVisible();
  await expect(
    page
      .getByText(
        'This is a SharePoint frame — switch the library to SharePoint, or convert the frame.',
      )
      .first(),
  ).toBeVisible();
  // Tiles can't add into the SharePoint frame.
  await expect(
    page.getByTestId('component-heading').getByRole('button', { name: 'Heading 1' }),
  ).toBeDisabled();

  // Dragging one onto the frame is refused, with the same message.
  const tile = page.getByTestId('component-paragraph').getByRole('button', { name: 'Body text' });
  await tile.scrollIntoViewIfNeeded();
  const box = (await frames(page).nth(1).boundingBox())!;
  await dragBetween(page, await centre(tile), { x: box.x + box.width / 2, y: box.y + 120 });
  await expect(
    page.getByRole('status').filter({ hasText: 'This is a SharePoint frame' }).first(),
  ).toBeVisible();
  await expect(page.frameLocator('iframe.frame__iframe').nth(1).locator('p')).toHaveCount(0);
});

test('the other way round: an NSW frame refuses a SharePoint web part', async ({ page }) => {
  await addFrame(page, 'SharePoint');
  await page.getByTestId('frame-Home').locator('.frame__name').click();
  await libraryKit(page).getByRole('button', { name: 'SharePoint' }).click();
  await expect(
    page
      .getByText('This is an NSW frame — switch the library to NSW, or convert the frame.')
      .first(),
  ).toBeVisible();
});
