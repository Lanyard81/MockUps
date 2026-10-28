import { getComponent } from '../catalogue';
import { getKit } from '../kits';
import { useStore } from '../store/store';
import { Modal } from './Modal';

/** After converting a frame: what came across, and what turned into a placeholder. */
export function ConversionSummary() {
  const report = useStore((s) => s.conversionReport);
  if (!report) return null;
  const close = () => useStore.getState().dismissConversionReport();
  const placeholders = report.placeholders.reduce((n, p) => n + p.count, 0);
  return (
    <Modal
      title="Page converted"
      width={520}
      onClose={close}
      footer={
        <button className="btn btn--primary" onClick={close}>
          Done
        </button>
      }
    >
      <p className="modal__text">
        “{report.sourceName}” was copied to a new {getKit(report.toKit).shortLabel} page,{' '}
        <strong>{report.newFrameName}</strong>. The original is unchanged, and Undo removes the
        copy.
      </p>
      <p className="modal__text" data-testid="conversion-counts">
        {report.converted} item{report.converted === 1 ? '' : 's'} brought across
        {placeholders > 0
          ? `; ${placeholders} had no equivalent and became a placeholder.`
          : '. Everything had an equivalent.'}
      </p>
      {report.mappings.length > 0 && (
        <>
          <h3 className="modal__subtitle">What each part became</h3>
          <ul className="modal__list" data-testid="conversion-mappings">
            {report.mappings.map((m) => (
              <li key={`${m.from}-${m.to.join('+')}`}>
                {m.from}
                {m.count > 1 ? ` (${m.count})` : ''} →{' '}
                {m.to.length
                  ? [...new Set(m.to.map((id) => getComponent(id)?.name ?? id))].join(' + ')
                  : 'page settings (header, menu or footer)'}
              </li>
            ))}
          </ul>
        </>
      )}
      {report.placeholders.length > 0 && (
        <>
          <h3 className="modal__subtitle">Not converted</h3>
          <ul className="modal__list" data-testid="conversion-placeholders">
            {report.placeholders.map((p) => (
              <li key={p.name}>
                {p.name}
                {p.count > 1 ? ` (${p.count})` : ''}
              </li>
            ))}
          </ul>
        </>
      )}
      {report.notes.length > 0 && (
        <>
          <h3 className="modal__subtitle">Things to know</h3>
          <ul className="modal__list">
            {report.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}
