import type { ComponentSource } from '../../../../catalogue/types';
import { icon, placeholderImage } from './helpers';

const carouselCard = (n: number) =>
  `<div class="nsw-card"><div class="nsw-card__image"><img src="${placeholderImage(480, 270)}" alt="" data-image="image${n}"></div>` +
  `<div class="nsw-card__content"><h3 class="nsw-card__title"><a href="#"><span data-edit="title${n}">Card ${n}</span>${icon('east', 'nsw-material-icons--24 nsw-link--icon')}</a></h3>` +
  `<p class="nsw-card__copy" data-edit="copy${n}">Supporting text for card ${n}.</p></div></div>`;

export const media: ComponentSource[] = [
  {
    id: 'media',
    slug: 'media',
    name: 'Media',
    category: 'Media',
    variants: [
      {
        id: 'default',
        label: 'Image',
        html: `<figure class="nsw-media"><img src="${placeholderImage(960, 540)}" alt="" data-image="image"><figcaption data-optional="caption" data-edit="caption">Image caption</figcaption></figure>`,
      },
      {
        id: 'video',
        label: 'Video',
        html:
          `<figure class="nsw-media"><div class="nsw-media__video"><iframe title="Video placeholder" src="about:blank" style="background:#22272b"></iframe></div>` +
          `<figcaption data-optional="caption" data-edit="caption">Video caption</figcaption></figure>`,
      },
    ],
  },
  {
    id: 'card-carousel',
    slug: 'card-carousel',
    name: 'Card carousel',
    category: 'Media',
    fidelity: 'static',
    note: 'Cards are shown in a row. The scrolling, arrows and dots need the carousel script, which depends on more markup than is included here.',
    variants: [
      {
        id: 'default',
        label: 'Default',
        html:
          `<div class="nsw-carousel-container"><div class="nsw-carousel__header"><h2 class="nsw-carousel__title nsw-h3" data-edit="title">Carousel title</h2></div>` +
          `<div class="nsw-grid">` +
          [1, 2, 3]
            .map((n) => `<div class="nsw-col nsw-col-md-4">${carouselCard(n)}</div>`)
            .join('') +
          `</div></div>`,
      },
    ],
  },
];
