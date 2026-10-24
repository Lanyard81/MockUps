import type { Comment, MockupDoc } from '../store/types';

const NO_COMMENTS: Comment[] = [];

/** A document's notes (a stable empty list when it has none, so selectors don't loop). */
export const commentsOf = (doc: Pick<MockupDoc, 'comments'>): Comment[] =>
  doc.comments ?? NO_COMMENTS;

/** The number shown on a note's pin: its place in the document's list, from 1. */
export const commentNumber = (doc: Pick<MockupDoc, 'comments'>, id: string): number =>
  commentsOf(doc).findIndex((c) => c.id === id) + 1;

/** The notes as Markdown, grouped by frame, for pasting into a ticket or an email. */
export function commentsMarkdown(
  doc: Pick<MockupDoc, 'name' | 'frames' | 'comments'>,
  includeResolved = false,
): string {
  const all = commentsOf(doc);
  const lines = [`# Comments on ${doc.name}`, ''];
  let any = false;
  for (const frame of doc.frames) {
    const mine = all
      .map((c, i) => ({ c, n: i + 1 }))
      .filter(({ c }) => c.frameId === frame.id && (includeResolved || !c.resolved));
    if (mine.length === 0) continue;
    any = true;
    lines.push(`## ${frame.name}`, '');
    for (const { c, n } of mine) {
      const text = c.text.trim() || '(empty note)';
      lines.push(`${n}. ${c.resolved ? '[done] ' : ''}${text.replace(/\n+/g, ' ')}  `);
      lines.push(`   _at ${c.x}, ${c.y}_`);
    }
    lines.push('');
  }
  if (!any) lines.push(includeResolved ? 'No comments.' : 'No open comments.', '');
  return lines.join('\n');
}
