import type { ComponentSource } from '../../../../catalogue/types';

/** Inputs, choices and ready-made forms. */
export const forms: ComponentSource[] = [
  {
    id: 'sk-field',
    slug: 'field',
    name: 'Text field',
    category: 'Forms',
    variants: [
      {
        id: 'text',
        label: 'Single line',
        html: `<label class="sk-c sk-field"><span class="sk-field__label" data-edit="label">Full name</span><input class="sk-input" type="text" placeholder="Jane Citizen"><span class="sk-field__hint" data-optional="hint" data-edit="hint">As it appears on your documents.</span></label>`,
      },
      {
        id: 'email',
        label: 'Email',
        html: `<label class="sk-c sk-field"><span class="sk-field__label" data-edit="label">Email address</span><input class="sk-input" type="email" placeholder="name@example.com"><span class="sk-field__hint" data-optional="hint" data-edit="hint">We only use this to reply to you.</span></label>`,
      },
      {
        id: 'area',
        label: 'Multi-line',
        html: `<label class="sk-c sk-field"><span class="sk-field__label" data-edit="label">Message</span><textarea class="sk-input sk-input--area" placeholder="Write here"></textarea><span class="sk-field__hint" data-optional="hint" data-edit="hint">A few sentences is plenty.</span></label>`,
      },
      {
        id: 'select',
        label: 'Drop-down',
        html: `<label class="sk-c sk-field"><span class="sk-field__label" data-edit="label">Topic</span><select class="sk-input"><option>Choose one</option><option>General question</option><option>Support</option></select></label>`,
      },
      {
        id: 'search',
        label: 'Search',
        html: `<label class="sk-c sk-field"><span class="sk-field__label" data-optional="label" data-edit="label">Search</span><input class="sk-input sk-input--search" type="search" placeholder="Search"></label>`,
      },
    ],
  },
  {
    id: 'sk-check',
    slug: 'choice',
    name: 'Checkbox and switch',
    category: 'Forms',
    variants: [
      {
        id: 'checkbox',
        label: 'Checkbox',
        html: `<label class="sk-c sk-check"><input type="checkbox"><span data-edit="label">Remember me</span></label>`,
      },
      {
        id: 'radio',
        label: 'Radio',
        html: `<label class="sk-c sk-check"><input type="radio" name="sk-choice"><span data-edit="label">Option one</span></label>`,
      },
      {
        id: 'switch',
        label: 'Switch',
        html: `<label class="sk-c sk-switch"><input type="checkbox" checked><span class="sk-switch__track"></span><span data-edit="label">Email notifications</span></label>`,
      },
    ],
  },
  {
    id: 'sk-form',
    slug: 'form',
    name: 'Form',
    category: 'Forms',
    variants: [
      {
        id: 'login',
        label: 'Sign in',
        html: `<form class="sk-c sk-form"><h3 class="sk-form__title" data-edit="title">Sign in</h3><label class="sk-field"><span class="sk-field__label" data-edit="label1">Email address</span><input class="sk-input" type="email" placeholder="name@example.com"></label><label class="sk-field"><span class="sk-field__label" data-edit="label2">Password</span><input class="sk-input" type="password" placeholder="••••••••"></label><button class="sk-button sk-button--full" data-edit="submit">Sign in</button></form>`,
      },
      {
        id: 'contact',
        label: 'Contact',
        html: `<form class="sk-c sk-form"><h3 class="sk-form__title" data-edit="title">Get in touch</h3><label class="sk-field"><span class="sk-field__label" data-edit="label1">Your name</span><input class="sk-input" type="text" placeholder="Jane Citizen"></label><label class="sk-field"><span class="sk-field__label" data-edit="label2">Message</span><textarea class="sk-input sk-input--area" placeholder="Write here"></textarea></label><button class="sk-button sk-button--full" data-edit="submit">Send message</button></form>`,
      },
    ],
  },
];
