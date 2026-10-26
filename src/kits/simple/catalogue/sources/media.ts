import type { ComponentSource } from '../../../../catalogue/types';
import { picture } from './helpers';

/** Pictures, video, logo strips and wireframe boxes. */
export const media: ComponentSource[] = [
  {
    id: 'sk-image',
    slug: 'image',
    name: 'Image',
    category: 'Media',
    variants: [
      ['wide', 'Wide', ''],
      ['square', 'Square', ' sk-image--square'],
      ['banner', 'Banner', ' sk-image--banner'],
    ].map(([id, label, cls], i) => ({
      id: id!,
      label: label!,
      html: `<figure class="sk-c sk-image${cls}">${picture('image', i + 3, 'Placeholder picture', 'sk-image__img', id === 'banner' ? 960 : 640, id === 'square' ? 640 : id === 'banner' ? 320 : 360)}<figcaption data-optional="caption" data-edit="caption">A short caption for the picture</figcaption></figure>`,
    })),
  },
  {
    id: 'sk-video',
    slug: 'video',
    name: 'Video',
    category: 'Media',
    variants: [
      {
        id: 'video',
        label: 'Video',
        html: `<div class="sk-c sk-video" role="img" aria-label="Video placeholder"><span class="sk-video__play" aria-hidden="true">▶</span></div>`,
      },
    ],
  },
  {
    id: 'sk-logos',
    slug: 'logos',
    name: 'Logo strip',
    category: 'Media',
    variants: [
      {
        id: 'logos',
        label: 'Logo strip',
        html: `<div class="sk-c sk-logos">${['Northwind', 'Contoso', 'Fabrikam', 'Litware', 'Adatum'].map((n, i) => `<span data-edit="name${i + 1}">${n}</span>`).join('')}</div>`,
      },
    ],
  },
  {
    id: 'sk-box',
    slug: 'box',
    name: 'Wireframe box',
    category: 'Media',
    variants: [
      {
        id: 'box',
        label: 'Box',
        html: `<div class="sk-c sk-box"><span data-edit="label">Content goes here</span></div>`,
      },
      {
        id: 'picture',
        label: 'Picture box',
        html: `<div class="sk-c sk-box sk-box--cross" role="img" aria-label="Picture placeholder"><span data-edit="label">Picture</span></div>`,
      },
    ],
  },
];
