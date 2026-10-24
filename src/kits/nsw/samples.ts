import type { MockupDoc } from '../../store/types';
import {
  buildTree,
  c,
  page,
  sec,
  top,
  type CompSpec,
  type RowSpec,
  type SectionSpec,
  type TopItem,
} from './templateDsl';
import { NSW_TEMPLATE_DEFS } from './templates';
import nswPkg from 'nsw-design-system/package.json';

/**
 * The sample mockups that ship with the app (`public/samples/*.mockup.json`). They are built from the
 * official templates, with "go to frame" links so Preview works as a click-through prototype.
 * `npm run samples` writes them; a test checks the committed files match this code.
 */
export interface SampleDef {
  id: string;
  name: string;
  description: string;
  frames: { name: string; device: 'desktop' | 'iphone'; width: number; items: () => TopItem[] }[];
  /** Links between frames: [frame index, component id, which one (0-based), target frame index]. */
  links: [number, string, number, number][];
}

const template = (id: string): TopItem[] => NSW_TEMPLATE_DEFS.find((t) => t.id === id)!.items();

const h = (level: 1 | 2 | 3, text: string) => c('heading', `h${level}`, { text: { text } });
const p = (text: string) => c('paragraph', 'default', { text: { text } });

/** Set props on the nth component with this id, anywhere in a template. Returns new specs. */
function patch(
  items: TopItem[],
  componentId: string,
  nth: number,
  props: Record<string, unknown>,
): TopItem[] {
  let seen = -1;
  const comp = (s: CompSpec): CompSpec => {
    if (s.componentId !== componentId) return s;
    seen += 1;
    return seen === nth ? { ...s, props: { ...s.props, ...props } } : s;
  };
  const block = (b: CompSpec | RowSpec): CompSpec | RowSpec =>
    b.kind === 'comp' ? comp(b) : { ...b, columns: b.columns.map((col) => col.map(comp)) };
  return items.map((i): TopItem =>
    i.kind === 'comp' ? comp(i) : ({ ...i, blocks: i.blocks.map(block) } satisfies SectionSpec),
  );
}

const chromeLite = (): TopItem[] => [
  top('masthead', 'dark'),
  top('header', 'default', {
    text: { title: 'Service name', description: 'Helping people with everyday services' },
  }),
];

export const SAMPLES: SampleDef[] = [
  {
    id: 'licence-renewal',
    name: 'Licence renewal journey',
    description: 'Home page, application form and confirmation. Preview mode clicks through them.',
    frames: [
      {
        name: 'Home',
        device: 'desktop',
        width: 1440,
        items: () => template('homepage-hero-banner'),
      },
      { name: 'Apply', device: 'desktop', width: 1440, items: () => template('content-form') },
      {
        name: 'Done',
        device: 'desktop',
        width: 1440,
        items: () =>
          page(
            ...chromeLite(),
            sec(
              { bg: 'white' },
              c('in-page-alert', 'success', {
                text: {
                  title: 'Application received',
                  copy: 'Your reference number is LR-204817. We have emailed you a receipt.',
                },
              }),
              h(1, 'What happens next'),
              c('steps', 'default', {
                text: {
                  title1: 'We check your details',
                  copy1: 'This usually takes one working day.',
                  title2: 'You get an email',
                  copy2: 'It tells you when your new licence is on its way.',
                  title3: 'Your licence arrives',
                  copy3: 'Within 7 days, by post.',
                },
              }),
              c('button', 'dark', { text: { label: 'Back to home' } }),
            ),
            top('footer', 'dark'),
          ),
      },
    ],
    links: [
      [0, 'button', 0, 1],
      [0, 'hero-banner', 0, 1],
      [1, 'button', 0, 2],
      [2, 'button', 0, 0],
    ],
  },
  {
    id: 'events-and-news',
    name: 'Events and news',
    description: 'An events landing page, an article and a search results page, linked together.',
    frames: [
      { name: 'Events', device: 'desktop', width: 1440, items: () => template('landing-events') },
      { name: 'Article', device: 'desktop', width: 1440, items: () => template('content-article') },
      { name: 'Search', device: 'desktop', width: 1440, items: () => template('search-simple') },
    ],
    links: [
      [0, 'card', 0, 1],
      [0, 'button', 0, 2],
      [1, 'breadcrumbs', 0, 0],
      [2, 'list-item', 0, 1],
    ],
  },
  {
    id: 'mobile-service',
    name: 'Mobile service',
    description: 'Three phone screens: a home screen, a service page and a contact form.',
    frames: [
      {
        name: 'Home',
        device: 'iphone',
        width: 393,
        items: () =>
          page(
            top('masthead', 'dark'),
            top('header', 'simple', { text: { title: 'Service name' } }),
            top('hero-banner', 'dark', {
              text: {
                title: 'Help, wherever you are',
                intro: 'Services in your pocket.',
                button: 'See services',
              },
            }),
            sec(
              { bg: 'white' },
              h(2, 'Popular'),
              c('card', 'default', {
                text: { tag: 'Service', title: 'Renew a licence', copy: 'Online in minutes.' },
                hide: ['date'],
              }),
              c('card', 'default', {
                text: {
                  tag: 'Service',
                  title: 'Find a service centre',
                  copy: 'Hours and directions.',
                },
                hide: ['date'],
              }),
            ),
            top('footer', 'dark'),
          ),
      },
      {
        name: 'Service',
        device: 'iphone',
        width: 393,
        items: () =>
          page(
            top('masthead', 'dark'),
            top('header', 'simple', { text: { title: 'Service name' } }),
            sec(
              { bg: 'white' },
              c('breadcrumbs', 'default', {
                text: { crumb1: 'Home', crumb2: 'Services', current: 'Renew a licence' },
              }),
              h(1, 'Renew a licence'),
              p('You can renew up to 90 days before your licence expires.'),
              c('accordion', 'default', {
                text: {
                  title1: 'What you need',
                  content1: 'Your licence number and a payment card.',
                  title2: 'How much it costs',
                  content2: 'Fees depend on the licence type.',
                  title3: 'How long it takes',
                  content3: 'Most renewals are done on the spot.',
                },
              }),
              c('button', 'dark', { text: { label: 'Start renewal' } }),
              c('button', 'dark-outline', { text: { label: 'Contact us' } }),
            ),
            top('footer', 'dark'),
          ),
      },
      {
        name: 'Contact',
        device: 'iphone',
        width: 393,
        items: () =>
          page(
            top('masthead', 'dark'),
            top('header', 'simple', { text: { title: 'Service name' } }),
            sec(
              { bg: 'white' },
              h(1, 'Contact us'),
              c('form', 'text', { text: { label: 'Your name', helper: '' }, hide: ['helper'] }),
              c('form', 'text', { text: { label: 'Email address', helper: '' }, hide: ['helper'] }),
              c('form', 'textarea', {
                text: { label: 'Your message', helper: '' },
                hide: ['helper'],
              }),
              c('button', 'dark', { text: { label: 'Send message' } }),
            ),
            top('footer', 'dark'),
          ),
      },
    ],
    links: [
      [0, 'hero-banner', 0, 1],
      [0, 'card', 0, 1],
      [1, 'button', 1, 2],
      [2, 'button', 0, 0],
    ],
  },
];

/** The sample as a document. Ids are fixed, so the output is the same every time. */
export function buildSample(def: SampleDef): MockupDoc {
  let counter = 0;
  const makeId = (prefix: string) => `${prefix}_${def.id.slice(0, 3)}${++counter}`;
  const frameIds = def.frames.map((_, i) => `f_${def.id}_${i + 1}`);

  const nodes: MockupDoc['nodes'] = {};
  let x = 0;
  const frames = def.frames.map((f, i) => {
    let items = f.items();
    for (const [from, componentId, nth, to] of def.links) {
      if (from === i) items = patch(items, componentId, nth, { goto: frameIds[to] });
    }
    const built = buildTree(items, makeId);
    Object.assign(nodes, built.nodes);
    const frame = {
      id: frameIds[i]!,
      name: f.name,
      kitId: 'nsw',
      device: f.device,
      width: f.width,
      x,
      y: 0,
      root: built.root,
    };
    x += f.width + 80;
    return frame;
  });

  return {
    version: 7,
    id: `doc_sample_${def.id}`,
    name: def.name,
    defaultKitId: 'nsw',
    kitVersions: { nsw: nswPkg.version },
    kitSettings: {},
    view: { x: 80, y: 80, zoom: 0.3 },
    frames,
    nodes,
    images: {},
  };
}
