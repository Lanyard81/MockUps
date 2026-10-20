import type { ComponentSource } from '../../../../catalogue/types';
import { carouselControls, picture } from './helpers';

const CAPTIONS = [
  'Summer picnic',
  'New office fit-out',
  'Awards night',
  'Team workshop',
  'Volunteer day',
  'Open day',
];

const HERO = [
  ['Welcome to our new intranet', 'Take the tour'],
  ['Wellbeing week starts Monday', 'See the program'],
  ['Find a policy', 'Search policies'],
  ['Book a meeting room', 'Open booking'],
  ['Get IT help', 'Raise a request'],
] as const;

function tiles(count: number): string {
  return HERO.slice(0, count)
    .map(
      ([title, cta], i) =>
        `<a class="sp-hero__tile" href="#"${i > 0 ? ` data-optional="item${i + 1}"` : ''}>${picture(`image${i + 1}`, i + 1, title, 800, 500)}<span class="sp-hero__content"><span class="sp-hero__title" data-edit="title${i + 1}">${title}</span><span class="sp-hero__cta" data-optional="cta${i + 1}" data-edit="cta${i + 1}">${cta}</span></span></a>`,
    )
    .join('');
}

/** Image, Image gallery and Hero. */
export const media: ComponentSource[] = [
  {
    id: 'sp-image',
    slug: 'image',
    name: 'Image',
    category: 'Text and media',
    variants: [
      {
        id: 'image',
        label: 'Image',
        html: `<figure class="sp-image"><div class="sp-image__frame sp-ratio-16x9">${picture('image', 0, 'A placeholder picture', 960, 540, 'sp-media')}</div><figcaption class="sp-image__caption" data-optional="caption" data-edit="caption">Add a caption</figcaption></figure>`,
      },
    ],
  },
  {
    id: 'sp-image-gallery',
    slug: 'image-gallery',
    name: 'Image gallery',
    category: 'Text and media',
    variants: [
      {
        id: 'brick',
        label: 'Brick',
        html: `<div class="sp-gallery sp-gallery--brick">${CAPTIONS.map(
          (c, i) =>
            `<div class="sp-gallery__item" style="aspect-ratio:${['4/3', '1/1', '3/4', '16/9', '1/1', '4/3'][i]}">${picture(`image${i + 1}`, i, c, 480, 360)}<span class="sp-gallery__caption" data-optional="captions" data-edit="caption${i + 1}">${c}</span></div>`,
        ).join('')}</div>`,
      },
      {
        id: 'grid',
        label: 'Grid',
        html: `<div class="sp-gallery sp-gallery--grid">${CAPTIONS.slice(0, 6)
          .map(
            (c, i) =>
              `<div class="sp-gallery__item sp-ratio-1x1">${picture(`image${i + 1}`, i + 2, c, 400, 400)}<span class="sp-gallery__caption" data-optional="captions" data-edit="caption${i + 1}">${c}</span></div>`,
          )
          .join('')}</div>`,
      },
      {
        id: 'carousel',
        label: 'Carousel',
        html:
          `<div class="sp-gallery sp-gallery--carousel sp-carousel" data-sp-carousel>` +
          CAPTIONS.slice(0, 4)
            .map(
              (c, i) =>
                `<div class="sp-carousel__slide sp-gallery__item${i === 0 ? ' is-active' : ''}">${picture(`image${i + 1}`, i + 4, c, 960, 540)}<span class="sp-gallery__caption" data-optional="captions" data-edit="caption${i + 1}">${c}</span></div>`,
            )
            .join('') +
          carouselControls(4) +
          `</div>`,
      },
    ],
  },
  {
    id: 'sp-hero',
    slug: 'hero',
    name: 'Hero',
    category: 'Navigation and links',
    note: 'Full-width in SharePoint; place it in a full-width section on a communication site.',
    variants: [
      {
        id: 'tiles',
        label: 'Tiles',
        html: `<div class="sp-hero sp-hero--tiles">${tiles(5)}</div>`,
      },
      {
        id: 'layers',
        label: 'Layers',
        html: `<div class="sp-hero sp-hero--layers">${tiles(3)}</div>`,
      },
    ],
  },
];
