import { useState } from 'react';
import { copyText } from '../export/copy';
import { downloadBlob, slug } from '../export/download';
import { commentNumber, commentsMarkdown, commentsOf } from '../lib/comments';
import { useStore } from '../store/store';

/** The list of notes pinned to frames: open one, mark it done, or take them all away as Markdown. */
export function Comments() {
  const doc = useStore((s) => s.doc);
  const activeId = useStore((s) => s.activeCommentId);
  const tool = useStore((s) => s.commentTool);
  const [showDone, setShowDone] = useState(false);
  const all = commentsOf(doc);
  const shown = all.filter((c) => showDone || !c.resolved);
  const st = useStore.getState;
  const open = (id: string, frameId: string) => {
    st().selectFrame(frameId);
    st().setActiveComment(id);
  };
  return (
    <section className="comments" aria-label="Comments">
      <div className="comments__head">
        <button
          className="btn btn--primary"
          aria-pressed={tool}
          onClick={() => st().setCommentTool(!tool)}
        >
          Add a comment
        </button>
        <label className="prop-toggle">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(e) => setShowDone(e.target.checked)}
          />
          <span>Show done</span>
        </label>
      </div>
      <p className="prop-hint">
        Click “Add a comment”, then click a spot on a page to pin a note there. Notes show while
        editing only; they are not part of Preview or an HTML export.
      </p>
      {shown.length === 0 ? (
        <p className="library__none" data-testid="comments-empty">
          {all.length === 0 ? 'No comments yet.' : 'No open comments.'}
        </p>
      ) : (
        <ul className="comments__list" data-testid="comments-list">
          {shown.map((c) => (
            <li key={c.id}>
              <button
                className={`comment-row${activeId === c.id ? ' is-active' : ''}${c.resolved ? ' is-resolved' : ''}`}
                onClick={() => open(c.id, c.frameId)}
              >
                <span className="comment-row__n">{commentNumber(doc, c.id)}</span>
                <span className="comment-row__body">
                  <span className="comment-row__text">{c.text.trim() || '(empty note)'}</span>
                  <span className="comment-row__where">
                    {doc.frames.find((f) => f.id === c.frameId)?.name}
                    {c.resolved ? ' · done' : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="prop-actions">
        <button
          className="btn"
          disabled={all.length === 0}
          onClick={async () =>
            st().setNotice(
              (await copyText(commentsMarkdown(doc, showDone)))
                ? 'Comments copied as Markdown.'
                : 'The browser blocked copying. Allow clipboard access and try again.',
            )
          }
        >
          Copy as Markdown
        </button>
        <button
          className="btn"
          disabled={all.length === 0}
          onClick={() => {
            const file = `${slug(doc.name)}.comments.md`;
            downloadBlob(commentsMarkdown(doc, showDone), file, 'text/markdown');
            st().setNotice(`Saved ${file} to your downloads.`);
          }}
        >
          Download (.md)
        </button>
      </div>
    </section>
  );
}
