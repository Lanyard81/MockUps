import { useEffect, useState } from 'react';
import {
  deleteMockup,
  duplicateMockup,
  listMockups,
  loadMockup,
  saveMockup,
  type MockupMeta,
} from '../persistence/library';
import { useStore } from '../store/store';
import { Modal } from './Modal';

const when = (t: number) =>
  new Date(t).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/** The list of saved mockups: open, rename, duplicate, delete (with confirmation), or start a new one. */
export function MyMockups() {
  const open = useStore((s) => s.dialog === 'mockups');
  if (!open) return null;
  return <Inner />;
}

function Inner() {
  const current = useStore((s) => s.doc);
  const storageOk = useStore((s) => s.storageOk);
  const [list, setList] = useState<MockupMeta[] | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());
  const st = useStore.getState;
  const close = () => st().setDialog(null);

  const refresh = async () => setList(await listMockups());
  useEffect(() => {
    void listMockups().then(setList);
  }, []);

  // The mockup you are in may not be saved yet (nothing changed): show it anyway.
  const rows: MockupMeta[] = list
    ? list.some((m) => m.id === current.id)
      ? list
      : [
          {
            id: current.id,
            name: current.name,
            updatedAt: now,
            frames: current.frames.length,
          },
          ...list,
        ]
    : [];

  const openMockup = async (id: string) => {
    if (id === current.id) return close();
    setBusy(true);
    await saveMockup(st().doc); // make sure the one we are leaving is kept
    const doc = await loadMockup(id);
    setBusy(false);
    if (!doc) {
      st().setNotice('That mockup couldn’t be opened. It may be damaged.');
      return refresh();
    }
    st().loadDoc(doc);
    close();
  };

  const remove = (m: MockupMeta) =>
    st().requestConfirm({
      title: 'Delete this mockup?',
      body: `“${m.name}” will be deleted from this browser. This can’t be undone. (If you have saved it as a file, the file is not affected.)`,
      confirmLabel: 'Delete mockup',
      danger: true,
      onConfirm: async () => {
        await deleteMockup(m.id);
        if (m.id === st().doc.id) st().newDoc();
        await refresh();
      },
    });

  const duplicate = async (m: MockupMeta) => {
    setBusy(true);
    if (m.id === st().doc.id) await saveMockup(st().doc);
    const copy = await duplicateMockup(m.id);
    setBusy(false);
    if (!copy) st().setNotice('That mockup couldn’t be duplicated.');
    await refresh();
  };

  const rename = async (m: MockupMeta, name: string) => {
    setRenaming(null);
    const next = name.trim();
    if (!next || next === m.name) return;
    if (m.id === st().doc.id) st().renameDoc(next);
    else {
      const doc = await loadMockup(m.id);
      if (doc) await saveMockup({ ...doc, name: next });
    }
    // The current mockup saves itself shortly; update the list straight away.
    setList((prev) => (prev ?? []).map((x) => (x.id === m.id ? { ...x, name: next } : x)));
    await refresh();
  };

  return (
    <Modal
      title="My mockups"
      width={760}
      onClose={close}
      footer={
        <>
          <span className="modal__note">
            {storageOk === false
              ? 'Saving in this browser isn’t available here. Use Save to file.'
              : 'Saved in this browser.'}
          </span>
          <button
            className="btn btn--primary"
            onClick={() => {
              st().newDoc();
              close();
            }}
          >
            New mockup
          </button>
        </>
      }
    >
      {list === null ? (
        <p className="modal__text">Loading…</p>
      ) : (
        <ul className="mockup-list" aria-busy={busy}>
          {rows.map((m) => (
            <li
              key={m.id}
              className={`mockup-card${m.id === current.id ? ' is-current' : ''}`}
              data-testid="mockup-card"
            >
              <button
                className="mockup-card__open"
                onClick={() => void openMockup(m.id)}
                aria-label={`Open ${m.name}`}
              >
                <span
                  className={`mockup-card__thumb${m.thumbnail ? '' : ' mockup-card__thumb--empty'}`}
                >
                  {m.thumbnail ? <img src={m.thumbnail} alt="" /> : null}
                </span>
              </button>
              <div className="mockup-card__info">
                {renaming === m.id ? (
                  <input
                    autoFocus
                    defaultValue={m.name}
                    aria-label="Mockup name"
                    onFocus={(e) => e.currentTarget.select()}
                    onBlur={(e) => void rename(m, e.currentTarget.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') e.currentTarget.blur();
                      if (e.key === 'Escape') setRenaming(null);
                    }}
                  />
                ) : (
                  <strong className="mockup-card__name">{m.name}</strong>
                )}
                <span className="mockup-card__meta">
                  {m.id === current.id ? 'Open now · ' : ''}
                  {m.frames} frame{m.frames === 1 ? '' : 's'} · {when(m.updatedAt)}
                </span>
                <span className="mockup-card__actions">
                  <button className="btn" onClick={() => setRenaming(m.id)}>
                    Rename
                  </button>
                  <button className="btn" onClick={() => void duplicate(m)}>
                    Duplicate
                  </button>
                  <button className="btn btn--danger" onClick={() => remove(m)}>
                    Delete
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
