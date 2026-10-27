import { expect, test } from '@playwright/test';
import { addFromLibrary } from './helpers';

test.use({ viewport: { width: 1700, height: 1000 } });

test('Play starts on the start frame, follows a link with its transition, and Back returns', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.getByTestId('viewport')).toHaveAttribute('data-fitted', 'true');
  // Frame one has a heading and a button that goes to frame two (which has its own heading).
  await addFromLibrary(page, 'heading', 'Heading 1');
  await addFromLibrary(page, 'button', 'Brand Dark');
  await page.getByRole('button', { name: 'Add page' }).click();
  await page.getByRole('menuitem', { name: /iPhone/ }).click();
  await page.getByRole('button', { name: 'Zoom to fit' }).click();
  await page.waitForTimeout(300);
  await addFromLibrary(page, 'heading', 'Heading 2');
  await page.frameLocator('iframe[title="Home"]').locator('button.nsw-button').click();
  await page.getByLabel('Go to page').selectOption({ label: 'iPhone 2' });
  await page.getByLabel('Transition').selectOption('slide');

  // The first frame is the start by default, and the badge only shows once there are two frames.
  await expect(page.getByTestId('frame-Home').getByTestId('frame-start')).toBeVisible();
  await page.getByRole('button', { name: '▶ Present' }).click();
  const viewer = page.getByRole('dialog', { name: 'Preview: Home' });
  await expect(viewer).toBeVisible();
  await viewer.frameLocator('iframe').locator('a.nsw-button').click();
  const second = page.getByRole('dialog', { name: 'Preview: iPhone 2' });
  await expect(second.locator('.prototype__stage')).toHaveAttribute('data-motion', 'slide');
  await second.getByRole('button', { name: /Back/ }).click();
  await expect(page.getByRole('dialog', { name: 'Preview: Home' })).toBeVisible();
  await expect(
    page.getByRole('dialog', { name: 'Preview: Home' }).locator('.prototype__stage'),
  ).toHaveAttribute('data-motion', 'back');
  await page.keyboard.press('Escape');

  // Make the second frame the start: Play opens on it.
  await page.getByTestId('frame-iPhone 2').locator('.frame__label').click({ button: 'right' });
  await page.getByRole('menuitem', { name: 'Set as start page' }).click();
  await expect(page.getByTestId('frame-iPhone 2').getByTestId('frame-start')).toBeVisible();
  await expect(page.getByTestId('frame-Home').getByTestId('frame-start')).toHaveCount(0);
  await page.getByRole('button', { name: '▶ Present' }).click();
  await expect(page.getByRole('dialog', { name: 'Preview: iPhone 2' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByTestId('frame-Home').getByTestId('frame-start')).toBeVisible();
});
