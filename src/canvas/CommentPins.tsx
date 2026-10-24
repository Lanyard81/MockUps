import { useEffect, useRef } from 'react';
import { commentNumber, commentsOf } from '../lib/comments';
import { useStore } from '../store/store';

/**
 * A frame's pinned notes, drawn in the editor over the frame (never inside it, so never in Preview or an
 * HTML export). A pin is a numbered dot at the spot; clicking it opens the note.
 */
export function CommentPins({ frameId }: { frameId: string }) {
  const doc = useStore((s) => s.doc);
  const activeId = useStore((s) => s.activeCommentId);
  const mine = commentsOf(doc).filter((c) => c.frameId === frameId);
  if (mine.length === 0) return null;
  return (
    <div className="pins" data-testid="comment-pins">
      {mine.map((c) => (
        <div key={c.id} className="pins__at" style={{ left: c.x, top: c.y }}>
          <button
            className={`pin${c.resolved ? ' is-resolved' : ''}${activeId === c.id ? ' is-active' : ''}`}
            data-testid="comment-pin"
            aria-label={`Comment ${commentNumber(doc, c.id)}${c.resolved ? ' (done)' : ''}: ${c.text || 'empty'}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              const st = useStore.getState();
              st.setActiveComment(activeId === c.id ? null : c.id);
            }}
          >
            {commentNumber(doc, c.id)}
          </button>
          {activeId === c.id && <Note id={c.id} />}
        </div>
      ))}
    </div>
  );
}

/** The open note: its text, and Done, Delete and Close. */
function Note({ id }: { id: string }) {
  const comment = useStore((s) => commentsOf(s.doc).find((c) => c.id === id));
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), [id]);
  if (!comment) return null;
  const st = useStore.getState;
  /** Save the typed text; a note left empty is not worth keeping. */
  const save = () => {
    const text = ref.current?.value ?? comment.text;
    const s = st();
    if (text.trim() === '' && comment.text.trim() === '') s.deleteComment(id);
    else s.updateComment(id, { text });
  };
  const close = () => {
    save();
    st().setActiveComment(null);
  };
  return (
    <div
      className="note"
      role="dialog"
      aria-label={`Comment ${commentNumber(st().doc, id)}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <textarea
        ref={ref}
        aria-label="Comment text"
        rows={3}
        defaultValue={comment.text}
        placeholder="Add a note…"
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Escape') close();
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) close();
        }}
      />
      <div className="note__actions">
        <button
          className="btn"
          onClick={() => {
            save();
            st().updateComment(id, { resolved: !comment.resolved });
            st().setActiveComment(null);
          }}
        >
          {comment.resolved ? 'Reopen' : 'Done'}
        </button>
        <button className="btn btn--danger" onClick={() => st().deleteComment(id)}>
          Delete
        </button>
        <button className="btn" onClick={close}>
          Close
        </button>
      </div>
    </div>
  );
}
