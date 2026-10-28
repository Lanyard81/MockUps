import { useEffect, useState } from 'react';
import { diffDocs } from '../lib/diff';
import { newId } from '../lib/ids';
import { deleteVersion, listVersions, saveVersion, type Version } from '../persistence/versions';
import { useStore } from '../store/store';
import { Modal } from './Modal';

/** Named versions of this mockup: save one, compare it with now, restore it, open it as a new mockup. */
export function HistoryDialog() {
  const open = useStore((s) => s.dialog === 'history');
  if (!open) return null;
  return <Inner />;
}

const when = (t: number) =>
  new Date(t).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' });

function Inner() {
  const doc = useStore((s) => s.doc);
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [name, setName] = useState('');
  const [showing, setShowing] = useState<string | null>(null);
  const close = () => useStore.getState().setDialog(null);
  const st = useStore.getState;

  const refresh = async () => setVersions(await listVersions(st().doc.id));
  useEffect(() => {
    void listVersions(useStore.getState().doc.id).then(setVersions);
  }, []);

  const save = async () => {
    const label = name.trim() || `Version ${(versions?.length ?? 0) + 1}`;
    const saved = await saveVersion(st().doc, label);
    if (!saved)
      st().setNotice('The browser couldn’t keep that version (is storage full or blocked?).');
    else setName('');
    await refresh();
  };

  const restore = async (v: Version) => {
    // Keep what is here now first, so restoring can always be taken back.
    await saveVersion(st().doc, `Before restoring “${v.name}”`);
    st().restoreDoc(v.doc);
    st().setNotice(`Restored “${v.name}”. Undo puts the page back as it was.`);
    close();
  };

  const confirmRestore = (v: Version) =>
    st().requestConfirm({
      title: `Restore “${v.name}”?`,
      body: 'The mockup goes back to how it was then. What is here now is kept as a version first, and Undo works too.',
      confirmLabel: 'Restore',
      onConfirm: () => void restore(v),
    });

  return (
    <Modal title="Version history" width={600} onClose={close}>
      <p className="modal__text">
        Save a named copy of this mockup that you can come back to later. Copies stay in this
        browser only (up to 30) and are not in a downloaded file.
      </p>
      <div className="history__save">
        <input
          aria-label="Version name"
          placeholder={`Version ${(versions?.length ?? 0) + 1}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') void save();
          }}
        />
        <button className="btn btn--primary" onClick={() => void save()}>
          Save version
        </button>
      </div>
      {versions === null ? null : versions.length === 0 ? (
        <p className="library__none" data-testid="history-empty">
          No versions yet.
        </p>
      ) : (
        <ul className="history__list" data-testid="history-list">
          {versions.map((v) => {
            const diff = diffDocs(v.doc, doc);
            return (
              <li key={v.id} className="history__row">
                <div className="history__head">
                  <div>
                    <strong>{v.name}</strong>
                    <div className="history__when">{when(v.createdAt)}</div>
                  </div>
                  <div className="history__summary" data-testid="history-summary">
                    Since then: {diff.summary}
                  </div>
                </div>
                {showing === v.id && (
                  <ul className="history__diff" data-testid="history-diff">
                    {diff.frames
                      .filter((f) => f.change !== 'same')
                      .map((f) => (
                        <li key={f.frameId}>
                          <strong>{f.name}</strong>: {f.change}
                          {f.details.length ? ` (${f.details.join(', ')})` : ''}
                        </li>
                      ))}
                    {!diff.changed && <li>The page is the same as this version.</li>}
                  </ul>
                )}
                <div className="prop-actions">
                  <button
                    className="btn"
                    onClick={() => setShowing(showing === v.id ? null : v.id)}
                  >
                    {showing === v.id ? 'Hide changes' : 'What changed'}
                  </button>
                  <button className="btn" onClick={() => confirmRestore(v)}>
                    Restore
                  </button>
                  <button
                    className="btn"
                    onClick={() => {
                      st().loadDoc({ ...v.doc, id: newId('doc'), name: `${doc.name} (${v.name})` });
                      close();
                    }}
                  >
                    Open as new mockup
                  </button>
                  <button
                    className="btn btn--danger"
                    onClick={() =>
                      st().requestConfirm({
                        title: `Delete “${v.name}”?`,
                        body: 'This saved copy will be removed from this browser. It can’t be brought back.',
                        confirmLabel: 'Delete version',
                        onConfirm: () => void deleteVersion(doc.id, v.id).then(refresh),
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
