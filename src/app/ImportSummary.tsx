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
        summary.pages.every((p) => p.components === 0)
          ? 'Nothing usable was found'
          : summary.pages.length === 1
            ? 'Page imported'
            : `${summary.pages.length} pages imported`
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
        {summary.pages.every((p) => p.components === 0)
          ? 'No components could be read from that description, so the page was added empty. '
          : 'New pages were added beside the others. '}
        Check anything marked as a placeholder. The report stays in the page’s Properties until you
        dismiss it, and Undo removes the import.
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
