import { summariseReport, type PageImportReport } from '../pagespec';

/** What an import did to a page: a one-line summary, with the details one click away. */
export function ImportReportView({ report }: { report: PageImportReport }) {
  return (
    <div data-testid="import-report">
      <p className="modal__text" data-testid="import-summary-line">
        {summariseReport(report)}
      </p>
      {(report.placeholders.length > 0 || report.notes.length > 0) && (
        <details className="import-report__details">
          <summary>Details</summary>
          {report.placeholders.length > 0 && (
            <>
              <h3 className="modal__subtitle">Placeholders to replace</h3>
              <ul className="modal__list" data-testid="import-placeholders">
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
              <h3 className="modal__subtitle">What was changed</h3>
              <ul className="modal__list">
                {report.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </>
          )}
        </details>
      )}
    </div>
  );
}
