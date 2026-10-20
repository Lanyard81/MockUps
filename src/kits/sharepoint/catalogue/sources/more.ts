import type { ComponentSource } from '../../../../catalogue/types';
import { DEFAULT_CHART, chartMarkup } from '../../charts';
import { PEOPLE, art, avatar, head, spIcon } from './helpers';

/**
 * The remaining out-of-the-box web parts, as static previews (their real versions need live data,
 * a service or an account). Each says so in the library through its fidelity and note.
 */
const STATIC = 'static' as const;
const note = (what: string) => `A static preview. In SharePoint ${what}`;

/** A framed preview with an icon, a title and a line of text: the shape of most service web parts. */
const preview = (icon: string, title: string, text: string, extra = '') =>
  `<div class="sp-wp"><div class="sp-preview sp-card"><span class="sp-preview__icon">${spIcon(icon, '', 28)}</span>` +
  `<div class="sp-preview__body"><div class="sp-preview__title" data-edit="title">${title}</div>` +
  `<div class="sp-preview__text" data-edit="text" data-multiline>${text}</div>${extra}</div></div></div>`;

const file = (name: string, kind: string, glyph: string, when: string, n: number) =>
  `<li class="sp-row"><span class="sp-filetype sp-filetype--${kind}" aria-hidden="true">${glyph}</span>` +
  `<span class="sp-row__main"><span class="sp-row__title" data-edit="name${n}">${name}</span><span class="sp-meta" data-edit="when${n}">${when}</span></span></li>`;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const more: ComponentSource[] = [
  {
    id: 'sp-quick-chart',
    slug: 'quick-chart',
    name: 'Quick chart',
    category: 'Data',
    note: 'Edit the data in Properties. SharePoint offers column, bar, line, pie and doughnut charts; this kit draws column and pie.',
    variants: [
      {
        id: 'column',
        label: 'Column',
        html: `<div class="sp-wp">${head('Quick chart')}<div class="sp-chart" data-chart="column">${chartMarkup('column', DEFAULT_CHART)}</div></div>`,
      },
      {
        id: 'pie',
        label: 'Pie',
        html: `<div class="sp-wp">${head('Quick chart')}<div class="sp-chart" data-chart="pie">${chartMarkup('pie', DEFAULT_CHART)}</div></div>`,
      },
    ],
  },
  {
    id: 'sp-weather',
    slug: 'weather',
    name: 'Weather',
    category: 'Content',
    fidelity: STATIC,
    note: note('it shows the forecast for the location you choose.'),
    variants: [
      {
        id: 'forecast',
        label: 'Weather',
        html:
          `<div class="sp-wp sp-weather sp-card"><div class="sp-weather__now">${spIcon('weather_sunny', 'sp-weather__icon', 48)}` +
          `<div><div class="sp-weather__temp"><span data-edit="temp">24°</span></div><div class="sp-weather__place" data-edit="place">Sydney</div><div class="sp-meta" data-edit="condition">Sunny</div></div></div>` +
          `<ul class="sp-weather__days" data-optional="forecast">${DAYS.map((d, i) => `<li><span data-edit="day${i + 1}">${d}</span>${spIcon(i % 2 ? 'weather_rain_showers_day' : 'weather_sunny', '', 20)}<span data-edit="high${i + 1}">${22 + i}°</span></li>`).join('')}</ul></div>`,
      },
    ],
  },
  {
    id: 'sp-world-clock',
    slug: 'world-clock',
    name: 'World clock',
    category: 'Content',
    fidelity: STATIC,
    note: note('the clocks show the live time in each place.'),
    variants: [
      {
        id: 'clocks',
        label: 'World clock',
        html: `<div class="sp-wp">${head('World clock')}<div class="sp-clocks">${[
          ['Sydney', '9:41 am'],
          ['London', '11:41 pm'],
          ['New York', '6:41 pm'],
        ]
          .map(
            ([c, t], i) =>
              `<div class="sp-clock"><span class="sp-clock__face" aria-hidden="true"><span class="sp-clock__hand sp-clock__hand--hour"></span><span class="sp-clock__hand sp-clock__hand--minute"></span></span><span class="sp-clock__city" data-edit="city${i + 1}">${c}</span><span class="sp-meta" data-edit="time${i + 1}">${t}</span></div>`,
          )
          .join('')}</div></div>`,
      },
    ],
  },
  {
    id: 'sp-sites',
    slug: 'sites',
    name: 'Sites',
    category: 'Navigation and links',
    fidelity: STATIC,
    note: note('it lists the sites you follow or choose.'),
    variants: [
      {
        id: 'sites',
        label: 'Sites',
        html: `<div class="sp-wp">${head('Sites')}<div class="sp-sites">${[
          'Finance',
          'People and culture',
          'Technology',
          'Communications',
        ]
          .map(
            (n, i) =>
              `<a class="sp-site-tile sp-card" href="#"><span class="sp-site-tile__logo" style="background:${['#0f6cbd', '#8764b8', '#0e7a6a', '#c4562b'][i]}">${n[0]}</span><span class="sp-site-tile__name" data-edit="site${i + 1}">${n}</span></a>`,
          )
          .join('')}</div></div>`,
      },
    ],
  },
  {
    id: 'sp-recent-documents',
    slug: 'recent-documents',
    name: 'Recent documents',
    category: 'Data',
    fidelity: STATIC,
    note: note('it lists the files you opened or changed recently.'),
    variants: [
      {
        id: 'recent',
        label: 'Recent documents',
        html: `<div class="sp-wp">${head('Recent documents')}<ul class="sp-rows">${[
          ['Annual report 2026.docx', 'word', 'W', 'Edited today'],
          ['Budget forecast.xlsx', 'excel', 'X', 'Edited yesterday'],
          ['All-hands slides.pptx', 'powerpoint', 'P', 'Opened 14 Oct'],
          ['Travel policy.pdf', 'pdf', 'PDF', 'Opened 9 Oct'],
        ]
          .map(([n, k, g, w], i) => file(n!, k!, g!, w!, i + 1))
          .join('')}</ul></div>`,
      },
    ],
  },
  {
    id: 'sp-site-activity',
    slug: 'site-activity',
    name: 'Site activity',
    category: 'Data',
    fidelity: STATIC,
    note: note('it shows what has just changed on this site.'),
    variants: [
      {
        id: 'activity',
        label: 'Site activity',
        html: `<div class="sp-wp">${head('Site activity')}<ul class="sp-rows">${[
          ['Priya Nair', 'edited Budget forecast.xlsx', '10 minutes ago'],
          ['Sam Okafor', 'added Release notes.docx', '1 hour ago'],
          ['Mei Lin', 'created the page Onboarding guide', 'Yesterday'],
        ]
          .map(
            ([who, what, when], i) =>
              `<li class="sp-row">${avatar(PEOPLE[i + 1]![2], i + 1, 'sp-avatar--small')}<span class="sp-row__main"><span><strong data-edit="who${i + 1}">${who}</strong> <span data-edit="what${i + 1}">${what}</span></span><span class="sp-meta" data-edit="when${i + 1}">${when}</span></span></li>`,
          )
          .join('')}</ul></div>`,
      },
    ],
  },
  {
    id: 'sp-saved-for-later',
    slug: 'saved-for-later',
    name: 'Saved for later',
    category: 'Data',
    fidelity: STATIC,
    note: note('it lists the news and pages you saved.'),
    variants: [
      {
        id: 'saved',
        label: 'Saved for later',
        html: `<div class="sp-wp">${head('Saved for later')}<ul class="sp-rows">${[
          'Remote working guide',
          'Meet the 2026 innovation winners',
          'Changes to the expenses process',
        ]
          .map(
            (t, i) =>
              `<li class="sp-row">${spIcon('bookmark', 'sp-row__icon', 20)}<span class="sp-row__main"><span class="sp-row__title" data-edit="title${i + 1}">${t}</span><span class="sp-meta" data-edit="when${i + 1}">Saved ${i + 1} day${i ? 's' : ''} ago</span></span></li>`,
          )
          .join('')}</ul></div>`,
      },
    ],
  },
  {
    id: 'sp-group-calendar',
    slug: 'group-calendar',
    name: 'Group calendar',
    category: 'Data',
    fidelity: STATIC,
    note: note('it shows a Microsoft 365 group calendar.'),
    variants: [
      {
        id: 'month',
        label: 'Month',
        html:
          `<div class="sp-wp sp-calendar sp-card"><div class="sp-calendar__head"><span data-edit="month">October 2026</span></div>` +
          `<div class="sp-calendar__grid">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<span class="sp-calendar__dow">${d}</span>`).join('')}` +
          Array.from({ length: 35 }, (_, i) => {
            const day = i - 3;
            const out = day < 1 || day > 31;
            const ev = [8, 14, 21, 28].includes(day)
              ? '<span class="sp-calendar__event"></span>'
              : '';
            return `<span class="sp-calendar__day${out ? ' is-out' : ''}${day === 20 ? ' is-today' : ''}">${out ? '' : day}${ev}</span>`;
          }).join('') +
          `</div></div>`,
      },
    ],
  },
  {
    id: 'sp-org-chart',
    slug: 'organization-chart',
    name: 'Organisation chart',
    category: 'Content',
    fidelity: STATIC,
    note: note('the chart comes from the directory.'),
    variants: [
      {
        id: 'chart',
        label: 'Organisation chart',
        html: `<div class="sp-wp">${head('Organisation chart')}<div class="sp-org"><div class="sp-org__top">${orgBox(0)}</div><div class="sp-org__row">${[1, 2, 3].map(orgBox).join('')}</div></div></div>`,
      },
    ],
  },
  {
    id: 'sp-markdown',
    slug: 'markdown',
    name: 'Markdown',
    category: 'Text and media',
    fidelity: STATIC,
    note: note('you type Markdown and it shows the formatted result.'),
    variants: [
      {
        id: 'markdown',
        label: 'Markdown',
        html: `<div class="sp-markdown"><h2 data-edit="heading">Release notes</h2><p data-edit="intro" data-multiline>What changed in this version, in plain words.</p><ul><li data-edit="item1">Faster search</li><li data-edit="item2">New page templates</li></ul></div>`,
      },
    ],
  },
  {
    id: 'sp-code-snippet',
    slug: 'code-snippet',
    name: 'Code snippet',
    category: 'Text and media',
    variants: [
      {
        id: 'code',
        label: 'Code snippet',
        html: `<div class="sp-code-wrap"><div class="sp-code__lang" data-optional="language" data-edit="language">JavaScript</div><pre class="sp-code"><code data-edit="code" data-multiline>function greet(name) {\n  return "Hello, " + name;\n}</code></pre></div>`,
      },
    ],
  },
  {
    id: 'sp-embed',
    slug: 'embed',
    name: 'Embed',
    category: 'Text and media',
    fidelity: STATIC,
    note: note('it shows the page or content at the address you give.'),
    variants: [
      {
        id: 'embed',
        label: 'Embed',
        html: preview(
          'globe_desktop',
          'Embedded content',
          'The page at this address shows here: https://example.com/dashboard',
        ),
      },
    ],
  },
  {
    id: 'sp-youtube',
    slug: 'youtube',
    name: 'YouTube',
    category: 'Text and media',
    fidelity: STATIC,
    note: note('the video plays in the page.'),
    variants: [
      {
        id: 'video',
        label: 'YouTube',
        html: `<div class="sp-video sp-ratio-16x9"><img class="sp-media" data-image="poster" src="${art(3, 960, 540)}" alt="Video poster"><span class="sp-video__play">${spIcon('play', '', 28)}</span><span class="sp-video__title" data-edit="title">Welcome from our CEO</span></div>`,
      },
    ],
  },
  {
    id: 'sp-file-media',
    slug: 'file-and-media',
    name: 'File and media',
    category: 'Text and media',
    fidelity: STATIC,
    note: note('it previews a file from a library.'),
    variants: [
      {
        id: 'file',
        label: 'File and media',
        html: `<div class="sp-wp"><div class="sp-filecard sp-card"><div class="sp-filecard__page" aria-hidden="true"><span></span><span></span><span></span><span></span></div><div class="sp-filecard__name"><span class="sp-filetype sp-filetype--word" aria-hidden="true">W</span><span data-edit="name">Annual report 2026.docx</span></div></div></div>`,
      },
    ],
  },
  {
    id: 'sp-forms',
    slug: 'microsoft-forms',
    name: 'Microsoft Forms',
    category: 'Content',
    fidelity: STATIC,
    note: note('the form or its results show here.'),
    variants: [
      {
        id: 'form',
        label: 'Microsoft Forms',
        html: preview(
          'clipboard_task',
          'Staff survey',
          'Tell us how the new office is working for you. It takes about two minutes.',
          `<a class="sp-button sp-button--primary" href="#"><span data-edit="button">Start</span></a>`,
        ),
      },
    ],
  },
  {
    id: 'sp-power-bi',
    slug: 'power-bi',
    name: 'Power BI',
    category: 'Data',
    fidelity: STATIC,
    note: note('a Power BI report shows here.'),
    variants: [
      {
        id: 'report',
        label: 'Power BI report',
        html: `<div class="sp-wp"><div class="sp-report sp-card"><div class="sp-report__title" data-edit="title">Sales dashboard</div><div class="sp-chart" data-chart="column">${chartMarkup('column', { labels: ['North', 'South', 'East', 'West'], values: [64, 38, 52, 80] })}</div></div></div>`,
      },
    ],
  },
  {
    id: 'sp-power-apps',
    slug: 'power-apps',
    name: 'Power Apps',
    category: 'Content',
    fidelity: STATIC,
    note: note('your app runs in the page.'),
    variants: [
      {
        id: 'app',
        label: 'Power Apps',
        html: preview(
          'window_apps',
          'Leave request app',
          'Your Power Apps app shows here. Staff can use it without leaving the page.',
        ),
      },
    ],
  },
  {
    id: 'sp-maps',
    slug: 'maps',
    name: 'Maps',
    category: 'Text and media',
    fidelity: STATIC,
    note: note('an interactive map with pins shows here.'),
    variants: [
      {
        id: 'map',
        label: 'Maps',
        html: `<div class="sp-wp"><div class="sp-map sp-ratio-16x9"><span class="sp-map__pin">${spIcon('location', '', 28)}</span><span class="sp-map__label" data-edit="place">Head office, 1 Example Street</span></div></div>`,
      },
    ],
  },
  {
    id: 'sp-planner',
    slug: 'planner',
    name: 'Planner',
    category: 'Data',
    fidelity: STATIC,
    note: note('your plan’s board shows here.'),
    variants: [
      {
        id: 'plan',
        label: 'Planner',
        html: `<div class="sp-wp">${head('Open day plan')}<div class="sp-board">${[
          ['To do', ['Book the venue', 'Send invitations']],
          ['In progress', ['Print signs']],
          ['Done', ['Confirm catering', 'Choose a date']],
        ]
          .map(
            ([b, tasks], i) =>
              `<div class="sp-board__col"><div class="sp-board__head" data-edit="bucket${i + 1}">${b}</div>${(tasks as string[]).map((t, j) => `<div class="sp-board__card sp-card" data-edit="task${i + 1}${j + 1}">${t}</div>`).join('')}</div>`,
          )
          .join('')}</div></div>`,
      },
    ],
  },
  {
    id: 'sp-conversations',
    slug: 'conversations',
    name: 'Conversations (Viva Engage)',
    category: 'Content',
    fidelity: STATIC,
    note: note('live Viva Engage conversations show here.'),
    variants: [
      {
        id: 'feed',
        label: 'Conversations',
        html: `<div class="sp-wp">${head('Conversations')}<div class="sp-posts">${[
          ['Mei Lin', 'Does anyone have the new brand templates?', '4 replies'],
          ['Jordan Blake', 'Great turnout at the open day. Thank you all!', '12 likes'],
        ]
          .map(
            ([who, what, meta], i) =>
              `<div class="sp-post sp-card">${avatar(PEOPLE[i + 3]![2], i + 3)}<div class="sp-post__body"><strong data-edit="who${i + 1}">${who}</strong><div data-edit="post${i + 1}" data-multiline>${what}</div><span class="sp-meta" data-edit="meta${i + 1}">${meta}</span></div></div>`,
          )
          .join('')}</div></div>`,
      },
    ],
  },
  {
    id: 'sp-highlights',
    slug: 'highlights',
    name: 'Highlights (Viva Engage)',
    category: 'Content',
    fidelity: STATIC,
    note: note('highlighted Viva Engage posts show here.'),
    variants: [
      {
        id: 'highlights',
        label: 'Highlights',
        html: `<div class="sp-wp">${head('Highlights')}<div class="sp-posts">${[
          'Our values in action: stories from this quarter',
          'Welcome to the 12 people who joined in October',
        ]
          .map(
            (t, i) =>
              `<div class="sp-post sp-card">${spIcon('sparkle', 'sp-row__icon', 20)}<div class="sp-post__body"><div data-edit="post${i + 1}" data-multiline>${t}</div><span class="sp-meta" data-edit="meta${i + 1}">${40 + i * 9} reactions</span></div></div>`,
          )
          .join('')}</div></div>`,
      },
    ],
  },
  {
    id: 'sp-agent-link',
    slug: 'agent-link',
    name: 'Agent link',
    category: 'Navigation and links',
    fidelity: STATIC,
    note: note('it opens a conversation with an agent.'),
    variants: [
      {
        id: 'agent',
        label: 'Agent link',
        html: preview(
          'sparkle',
          'Ask the HR assistant',
          'Get quick answers about leave, pay and policies.',
          `<a class="sp-button sp-button--primary" href="#"><span data-edit="button">Chat now</span></a>`,
        ),
      },
    ],
  },
];

function orgBox(i: number): string {
  const [name, role, initials] = PEOPLE[i]!;
  return `<div class="sp-org__box sp-card">${avatar(initials, i)}<div><div class="sp-person__name" data-edit="name${i + 1}">${name}</div><div class="sp-person__title" data-edit="role${i + 1}">${role}</div></div></div>`;
}
