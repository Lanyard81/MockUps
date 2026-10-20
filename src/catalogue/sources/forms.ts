import type { ComponentSource } from '../types';
import { icon } from './helpers';

const field = (id: string, label: string, control: string, extra = '') =>
  `<div class="nsw-form__group"><label class="nsw-form__label" for="${id}"><span data-edit="label">${label}</span>${extra}</label>` +
  `<span class="nsw-form__helper" data-optional="helper" data-edit="helper">Helper text</span>${control}</div>`;

export const forms: ComponentSource[] = [
  {
    id: 'form',
    slug: 'form',
    name: 'Forms',
    category: 'Forms',
    variants: [
      {
        id: 'text',
        label: 'Text input',
        html: field(
          'f-text',
          'Text input',
          `<input class="nsw-form__input" type="text" id="f-text">`,
        ),
      },
      {
        id: 'textarea',
        label: 'Text area',
        html: field(
          'f-area',
          'Text area',
          `<textarea class="nsw-form__input" id="f-area" rows="4"></textarea>`,
        ),
      },
      {
        id: 'checkbox',
        label: 'Checkboxes',
        html:
          `<fieldset class="nsw-form__fieldset"><legend class="nsw-form__legend" data-edit="legend">Checkbox group</legend>` +
          [1, 2, 3]
            .map(
              (n) =>
                `<div class="nsw-form__group"><input class="nsw-form__checkbox-input" type="checkbox" id="f-cb-${n}"><label class="nsw-form__checkbox-label" for="f-cb-${n}" data-edit="option${n}">Option ${n}</label></div>`,
            )
            .join('') +
          `</fieldset>`,
      },
      {
        id: 'radio',
        label: 'Radio buttons',
        html:
          `<fieldset class="nsw-form__fieldset"><legend class="nsw-form__legend" data-edit="legend">Radio group</legend>` +
          [1, 2, 3]
            .map(
              (n) =>
                `<div class="nsw-form__group"><input class="nsw-form__radio-input" type="radio" name="f-radio" id="f-rd-${n}"><label class="nsw-form__radio-label" for="f-rd-${n}" data-edit="option${n}">Option ${n}</label></div>`,
            )
            .join('') +
          `</fieldset>`,
      },
      {
        id: 'search',
        label: 'Search field',
        html:
          `<div class="nsw-form__group"><label class="nsw-form__label" for="f-search" data-edit="label">Search</label>` +
          `<div class="nsw-form__input-group"><input class="nsw-form__input" type="text" id="f-search" placeholder="Search"><button class="nsw-button nsw-button--dark" type="button">${icon('search')}<span>Search</span></button></div></div>`,
      },
    ],
  },
  {
    id: 'select',
    slug: 'select',
    name: 'Select',
    category: 'Forms',
    variants: [
      {
        id: 'default',
        label: 'Single select',
        html: field(
          'f-select',
          'Select',
          `<select class="nsw-form__select" id="f-select"><option>Option 1</option><option>Option 2</option><option>Option 3</option></select>`,
        ),
      },
    ],
  },
  {
    id: 'date-input',
    slug: 'date-input',
    name: 'Date input',
    category: 'Forms',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<fieldset class="nsw-form__fieldset"><legend class="nsw-form__legend" data-edit="legend">Date of birth</legend><span class="nsw-form__helper">For example, 20 10 1990</span>` +
          `<div class="nsw-form__date-wrapper">` +
          [
            ['Day', 'f-day', 2],
            ['Month', 'f-month', 2],
            ['Year', 'f-year', 4],
          ]
            .map(
              ([l, id, n]) =>
                `<div class="nsw-form__date"><label class="nsw-form__label nsw-form__label--small" for="${id}">${l}</label><input class="nsw-form__input nsw-form__date-input" type="text" inputmode="numeric" id="${id}" maxlength="${n}"></div>`,
            )
            .join('') +
          `</div></fieldset>`,
      },
    ],
  },
  {
    id: 'date-picker',
    slug: 'date-picker',
    name: 'Date picker',
    category: 'Forms',
    fidelity: 'static',
    note: 'Shows the date field only. The calendar pop-up needs the full page script and is not shown on the canvas.',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html: field(
          'f-date',
          'Date',
          `<div class="nsw-form__input-group"><input class="nsw-form__input" type="text" id="f-date" placeholder="dd/mm/yyyy"><button class="nsw-button nsw-button--dark-outline-solid" type="button" aria-label="Choose date">${icon('calendar_today')}</button></div>`,
        ),
      },
    ],
  },
  {
    id: 'file-upload',
    slug: 'file-upload',
    name: 'File upload',
    category: 'Forms',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<div class="nsw-form__group"><span class="nsw-form__label" data-edit="label">Upload a file</span><div class="nsw-file-upload">` +
          `<input class="nsw-file-upload__input" type="file" id="f-file"><label class="nsw-file-upload__label" for="f-file">${icon('upload_file')}<span data-edit="prompt">Choose a file</span></label></div></div>`,
      },
    ],
  },
  {
    id: 'filters',
    slug: 'filters',
    name: 'Filters',
    category: 'Forms',
    fidelity: 'static',
    note: 'Shown as the filter heading and groups. The slide-in panel behaviour is not wired up.',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<div class="nsw-filters"><div class="nsw-filters__title" data-edit="title">Filter results</div><div class="nsw-filters__wrapper">` +
          [1, 2, 3]
            .map(
              (n) =>
                `<div class="nsw-filters__item"><button class="nsw-filters__item-button" type="button"><span data-edit="group${n}">Filter group ${n}</span>${icon('keyboard_arrow_down')}</button></div>`,
            )
            .join('') +
          `</div></div>`,
      },
    ],
  },
];
