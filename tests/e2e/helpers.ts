import type { Page } from '@playwright/test';

/** Click a variant tile in the library, e.g. addFromLibrary(page, 'button', 'Brand Dark'). */
export const addFromLibrary = (page: Page, componentId: string, variant: string) =>
  page
    .getByTestId(`component-${componentId}`)
    .getByRole('button', { name: variant, exact: true })
    .click();
