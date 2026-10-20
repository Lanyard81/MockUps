import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/fontData', () => ({
  getFontEmbedCss: async () => '@font-face{font-family:"Test"}',
}));

import { cleanForExport, formatHtml } from '../src/export/clean';
import { slug, uniqueNames } from '../src/export/download';
import { exportHtmlFiles } from '../src/export/page';
import { createDoc, useStore } from '../src/store/store';

const s = () => useStore.getState();

describe('cleaning markup for export', () => {
  it('removes every editor marker and keeps real attributes', () => {
    const out = cleanForExport(
      '<div data-node="n1"><p data-edit="text" data-multiline data-optional="x" data-image="a" data-empty="Empty" data-fit="on" contenteditable="true" id="keep" data-popover-id="p">Hi</p></div>',
    );
    expect(out).not.toMatch(
      /data-node|data-edit|data-optional|data-image|data-empty|data-fit|contenteditable|data-multiline/,
    );
    expect(out).toContain('id="keep"');
    expect(out).toContain('data-popover-id="p"');
  });

  it('turns "go to frame" links into real links, or # when the page isn’t exported', () => {
    const html = '<a data-goto="f1" href="#">One</a><a data-goto="f2" href="#">Two</a>';
    const out = cleanForExport(html, { links: { f1: 'home.html' } });
    expect(out).toContain('href="home.html"');
    expect(out).toContain('href="#"');
    expect(out).not.toContain('data-goto');
  });

  it('can unwrap the bare wrapper divs and nothing else', () => {
    const html =
      '<section data-node="s"><div data-node="c"><p>Hi</p></div><div class="keep" data-node="d">x</div></section>';
    const out = cleanForExport(html, { unwrap: true });
    expect(out).toBe('<section><p>Hi</p><div class="keep">x</div></section>');
  });

  it('indents block markup and keeps short inline markup on one line', () => {
    const text = formatHtml(
      '<section><div><p>One <a href="#">two</a></p><ul><li>a</li><li>b</li></ul></div></section>',
    );
    expect(text.split('\n')[0]).toBe('<section>');
    expect(text).toContain('    <p>One <a href="#">two</a></p>');
    expect(text.trimEnd().endsWith('</section>')).toBe(true);
  });
});

describe('file names', () => {
  it('makes safe, readable names', () => {
    expect(slug('My Mockup – v2!')).toBe('my-mockup-v2');
    expect(slug('   ')).toBe('mockup');
    expect(slug('///', 'frame')).toBe('frame');
    expect(slug('a'.repeat(200))).toHaveLength(60);
  });

  it('keeps names unique within an export', () => {
    expect(uniqueNames(['home', 'home', 'about', 'home'], 'html')).toEqual([
      'home.html',
      'home-2.html',
      'about.html',
      'home-3.html',
    ]);
  });
});

describe('HTML export', () => {
  function docWithTwoFrames() {
    useStore.setState({ doc: createDoc(), past: [], future: [] });
    const first = s().doc.frames[0]!.id;
    s().addComponent(first, 'button', 'dark');
    s().addFrame('desktop');
    s().addComponent(s().doc.frames[1]!.id, 'heading', 'h1');
    return s().doc;
  }

  it('builds a self-contained page: styles, script and fonts inline, nothing external', async () => {
    const doc = docWithTwoFrames();
    const [page] = await exportHtmlFiles(doc, [doc.frames[0]!], 'inline');
    expect(page!.name).toBe('home.html');
    expect(page!.data).toContain('<!doctype html>');
    expect(page!.data).toContain('lang="en-AU"');
    expect(page!.data).toContain('@font-face{font-family:"Test"}');
    expect(page!.data).toContain('.nsw-button');
    expect(page!.data).toContain('window.NSW.initSite()');
    expect(page!.data).not.toMatch(/<link[^>]+href=/);
    expect(page!.data).not.toMatch(/<script[^>]+src=/);
    expect(page!.data).not.toContain('data-node');
    expect(page!.data).toContain('nsw-button--dark');
  });

  it('can link to NSW on the internet instead, pinned to the installed version', async () => {
    const doc = docWithTwoFrames();
    const [page] = await exportHtmlFiles(doc, [doc.frames[0]!], 'cdn');
    expect(page!.data).toMatch(
      /cdn\.jsdelivr\.net\/npm\/nsw-design-system@3\.\d+\.\d+\/dist\/css\/main\.css/,
    );
    expect(page!.data).toContain('fonts.googleapis.com');
    expect(page!.data.length).toBeLessThan(10_000);
    expect(page!.data).not.toContain('.nsw-button{');
  });

  it('exports several frames as pages plus an index, and shares the assets in self-contained mode', async () => {
    const doc = docWithTwoFrames();
    const files = await exportHtmlFiles(doc, doc.frames, 'shared');
    expect(files.map((f) => f.name)).toEqual([
      'index.html',
      'home.html',
      'desktop-2.html',
      'assets/nsw.css',
      'assets/nsw.js',
    ]);
    const index = files[0]!.data;
    expect(index).toContain('href="home.html"');
    expect(index).toContain('href="desktop-2.html"');
    expect(files[1]!.data).toContain('href="assets/nsw.css"');
    expect(files[3]!.data).toContain('.nsw-button');
  });
});
