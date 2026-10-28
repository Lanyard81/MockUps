import { KITS } from '../kits';
import { loadSample } from '../persistence/file';
import { useStore } from '../store/store';
import { Modal } from './Modal';

/** The built-in sample mockups, each with what it shows, to open as a starting point. */
export function SamplesDialog() {
  const open = useStore((s) => s.dialog === 'samples');
  if (!open) return null;
  return <Inner />;
}

function Inner() {
  const close = () => useStore.getState().setDialog(null);
  const samples = KITS.flatMap((k) => k.samples.map((d) => ({ ...d, kit: k.shortLabel })));
  return (
    <Modal title="Try a sample" width={520} onClose={close}>
      <p className="modal__text">
        A sample is a finished mockup to look at, click through and change. It opens as a new
        mockup, and what you have now stays in My mockups.
      </p>
      <ul className="samples" data-testid="samples">
        {samples.map((d) => (
          <li key={d.id}>
            <div>
              <strong>{d.name}</strong> <span className="samples__kit">{d.kit}</span>
              <p>{d.description}</p>
            </div>
            <button
              className="btn btn--primary"
              onClick={() => {
                close();
                loadSample(d.id);
              }}
            >
              Open
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
