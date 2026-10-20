import { useState } from 'react';
import { MOD } from './platform';

const KEY = 'nswmb.tourDone';

const wasDone = (): boolean => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};
const markDone = () => {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* storage is blocked: the tour only stays closed for this visit */
  }
};

const STEPS = [
  {
    title: 'Build a screen',
    body: 'Find a component in the library on the left. Drag it onto the frame, or just click it to add it.',
  },
  {
    title: 'Click to select, double-click to edit',
    body: 'Click anything to change it in the panel on the right. Double-click text to type straight into it.',
  },
  {
    title: 'Move things around',
    body: `Drag items to reorder them, or drop them in another frame. Right-click for more actions. ${MOD}Z undoes anything. The Layers tab shows the whole page as a list.`,
  },
  {
    title: 'Look around and try it out',
    body: 'Hold Space and drag to pan, and use the zoom control to fit your screens. Switch to Preview to click through components. Press ? at any time for all the shortcuts.',
  },
];

/** A short first-run tour: four tips, dismissible, never shown again once closed. */
export function Tour() {
  const [open, setOpen] = useState(() => !wasDone());
  const [step, setStep] = useState(0);
  if (!open) return null;

  const last = step === STEPS.length - 1;
  const close = () => {
    markDone();
    setOpen(false);
  };
  const { title, body } = STEPS[step]!;

  return (
    <div
      className="tour"
      role="dialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          close();
        }
      }}
    >
      <p className="tour__step">
        Tip {step + 1} of {STEPS.length}
      </p>
      <h2 id="tour-title" className="tour__title">
        {title}
      </h2>
      <p id="tour-body" className="tour__body">
        {body}
      </p>
      <div className="tour__actions">
        <div className="tour__dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? 'is-active' : ''} />
          ))}
        </div>
        <button className="btn" onClick={close}>
          {last ? 'Close' : 'Skip tour'}
        </button>
        {step > 0 && (
          <button className="btn" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        <button
          className="btn btn--primary"
          autoFocus
          onClick={() => (last ? close() : setStep(step + 1))}
        >
          {last ? 'Start building' : 'Next'}
        </button>
      </div>
    </div>
  );
}
