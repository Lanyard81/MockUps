import { useStore } from '../store/store';
import { ImportReportView } from './ImportReportView';
import { Modal } from './Modal';

/** After importing a page spec: what came in, what became a placeholder, what was repaired. */
export function ImportSummary() {
  const summary = useStore((s) => s.importSummary);
  if (!summary) return null;
  const close = () => useStore.getState().dismissImportSummary();
  return (
    <Modal
      title={
        summary.pages.length === 1 ? 'Page imported' : `${summary.pages.length} pages imported`
      }
      width={520}
      onClose={close}
      footer={
        <button className="btn btn--primary" onClick={close}>
          Done
        </button>
      }
    >
      <p className="modal__text">
        New frames were added beside the others. Check anything marked as a placeholder. The report
        stays in the frame’s Properties until you dismiss it, and Undo removes the import.
      </p>
      {summary.pages.map((p) => (
        <section key={p.frameId} aria-label={p.frameName}>
          {summary.pages.length > 1 && <h3 className="modal__subtitle">{p.frameName}</h3>}
          <ImportReportView report={p} />
        </section>
      ))}
    </Modal>
  );
}
