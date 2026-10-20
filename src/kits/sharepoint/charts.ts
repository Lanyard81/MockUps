/**
 * Quick chart: column and pie charts drawn as inline SVG in theme colours. The data is a list of
 * labels and values (at most eight points); anything else is cleaned up before drawing.
 */
export interface ChartData {
  labels: string[];
  values: number[];
}

export const MAX_CHART_POINTS = 8;

export const DEFAULT_CHART: ChartData = {
  labels: ['Q1', 'Q2', 'Q3', 'Q4'],
  values: [42, 58, 37, 71],
};

const SERIES = [
  'var(--sp-theme-primary)',
  'var(--sp-theme-secondary)',
  'var(--sp-theme-dark-alt)',
  'var(--sp-theme-tertiary)',
  'var(--sp-theme-darker)',
  'var(--sp-theme-light)',
  'var(--sp-neutral-secondary)',
  'var(--sp-neutral-tertiary)',
];

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Chart data from stored settings: short labels, finite non-negative numbers, 1 to 8 points. */
export function readChart(raw: unknown): ChartData {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const labels = Array.isArray(o.labels) ? o.labels : [];
  const values = Array.isArray(o.values) ? o.values : [];
  const n = Math.min(MAX_CHART_POINTS, Math.max(labels.length, values.length));
  if (n === 0) return DEFAULT_CHART;
  const out: ChartData = { labels: [], values: [] };
  for (let i = 0; i < n; i++) {
    out.labels.push(
      typeof labels[i] === 'string' ? (labels[i] as string).slice(0, 24) : `Item ${i + 1}`,
    );
    const v = Number(values[i]);
    out.values.push(Number.isFinite(v) && v >= 0 ? Math.min(v, 1e9) : 0);
  }
  return out;
}

/** A column chart: bars scaled to the largest value, each with its value above and its label below. */
export function columnChart(data: ChartData): string {
  const w = 480;
  const h = 260;
  const top = 24;
  const bottom = 36;
  const n = data.values.length;
  const max = Math.max(1, ...data.values);
  const slot = w / n;
  const bar = Math.min(64, slot * 0.6);
  const bars = data.values
    .map((v, i) => {
      const bh = ((h - top - bottom) * v) / max;
      const x = i * slot + (slot - bar) / 2;
      const y = h - bottom - bh;
      return (
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bar.toFixed(1)}" height="${bh.toFixed(1)}" style="fill:${SERIES[i % SERIES.length]}"/>` +
        `<text x="${(x + bar / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" class="sp-chart__value">${v}</text>` +
        `<text x="${(x + bar / 2).toFixed(1)}" y="${h - 14}" text-anchor="middle" class="sp-chart__label">${esc(data.labels[i] ?? '')}</text>`
      );
    })
    .join('');
  return `<svg class="sp-chart__svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Column chart"><line x1="0" y1="${h - bottom}" x2="${w}" y2="${h - bottom}" class="sp-chart__axis"/>${bars}</svg>`;
}

/** A pie chart, with a legend of colour, label and value beside it. */
export function pieChart(data: ChartData): string {
  const total = data.values.reduce((a, b) => a + b, 0) || 1;
  const r = 100;
  const cx = 110;
  const cy = 110;
  let angle = -Math.PI / 2;
  const slices = data.values
    .map((v, i) => {
      const a = (v / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(angle);
      const y1 = cy + r * Math.sin(angle);
      angle += a;
      const x2 = cx + r * Math.cos(angle);
      const y2 = cy + r * Math.sin(angle);
      const large = a > Math.PI ? 1 : 0;
      const colour = SERIES[i % SERIES.length];
      if (data.values.filter((x) => x > 0).length === 1 && v > 0)
        return `<circle cx="${cx}" cy="${cy}" r="${r}" style="fill:${colour}"/>`;
      if (v <= 0) return '';
      return `<path d="M${cx} ${cy} L${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" style="fill:${colour}"/>`;
    })
    .join('');
  const legend = data.labels
    .slice(0, data.values.length)
    .map(
      (l, i) =>
        `<li><span class="sp-chart__swatch" style="background:${SERIES[i % SERIES.length]}"></span><span>${esc(l)}</span><span class="sp-meta">${data.values[i]}</span></li>`,
    )
    .join('');
  return `<div class="sp-chart__pie"><svg class="sp-chart__svg sp-chart__svg--pie" viewBox="0 0 220 220" role="img" aria-label="Pie chart">${slices}</svg><ul class="sp-chart__legend">${legend}</ul></div>`;
}

export const chartMarkup = (kind: 'column' | 'pie', data: ChartData): string =>
  kind === 'pie' ? pieChart(data) : columnChart(data);
