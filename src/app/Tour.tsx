import { useEffect, useLayoutEffect, useState } from 'react';
import { useStore } from '../store/store';
import { MOD } from './platform';

const KEY = 'pagewright.tourDone';

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

interface Step {
  title: string;
  body: string;
  /** What the tip is about: the card sits beside it and it gets an outline. */
  target: string;
  side: 'right' | 'left' | 'below';
  /** The tour moves on by itself when this becomes true (the person did what the tip says). */
  done?: (s: ReturnType<typeof useStore.getState>) => boolean;
}

const STEPS: Step[] = [
  {
    title: 'Build a page',
    body: 'Find a component in the library, here on the left. Click it to add it to the page, or drag it onto the page.',
    target: '#left-panel',
    side: 'right',
    done: (s) => Object.values(s.doc.nodes).some((n) => n.type === 'component'),
  },
  {
    title: 'Click to select, double-click to edit',
    body: 'Click anything on the page and its options appear here. Double-click text to type straight into it.',
    target: '#properties-panel',
    side: 'left',
    done: (s) => s.selectedNodeId !== null,
  },
  {
    title: 'Move things around',
    body: `Drag items to reorder them, or drop them on another page. Right-click for more actions. ${MOD}Z undoes anything. The Layers tab lists everything on the page.`,
    target: '#tab-layers, #left-panel .tabs',
    side: 'right',
  },
  {
    title: 'Look around and try it out',
    body: 'Hold Space and drag to move around, and use Zoom to fit (bottom right) to see all your pages. Preview lets you try components; Present shows your pages full screen. Press ? any time for all the shortcuts.',
    target: '.zoom-controls',
    side: 'left',
  },
];

/** The first element on the page that matches, for the tip to point at. */
const findTarget = (selector: string): HTMLElement | null => {
  for (const part of selector.split(',')) {
    const el = document.querySelector<HTMLElement>(part.trim());
    if (el && el.offsetParent !== null) return el;
  }
  return null;
};

/**
 * A short first-run tour: four tips, each beside the thing it is about, dismissible, never shown
 * again once closed, and replayable from Help. Tips move on by themselves when you do what they say.
 */
export function Tour() {
  const request = useStore((s) => s.tourRequest);
  const [open, setOpen] = useState(() => !wasDone());
  const [step, setStep] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const current = STEPS[step]!;

  // "Replay the tour" from the Help menu.
  const [seen, setSeen] = useState(request);
  if (seen !== request) {
    setSeen(request);
    setStep(0);
    setOpen(true);
  }

  // Sit beside the thing the tip is about, kept on screen.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const el = findTarget(current.target);
      document
        .querySelectorAll('[data-tour-target]')
        .forEach((e) => e.removeAttribute('data-tour-target'));
      const card = document.querySelector<HTMLElement>('.tour');
      if (!el || !card) return setPos(null);
      el.setAttribute('data-tour-target', 'true');
      const r = el.getBoundingClientRect();
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      const left =
        current.side === 'right'
          ? r.right + 12
          : current.side === 'left'
            ? r.left - w - 12
            : r.left;
      const top = current.side === 'below' ? r.bottom + 12 : r.top + 12;
      setPos({
        left: Math.max(8, Math.min(left, window.innerWidth - w - 8)),
        top: Math.max(8, Math.min(top, window.innerHeight - h - 8)),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('resize', place);
      document
        .querySelectorAll('[data-tour-target]')
        .forEach((e) => e.removeAttribute('data-tour-target'));
    };
  }, [open, step, current]);

  // Move on when the person does what the tip says.
  useEffect(() => {
    if (!open || !current.done) return;
    const check = (s: ReturnType<typeof useStore.getState>) => {
      if (current.done!(s)) setStep((n) => Math.min(n + 1, STEPS.length - 1));
    };
    // Only when it becomes true after the tip appears, not when it already was.
    if (current.done(useStore.getState())) return;
    return useStore.subscribe(check);
  }, [open, current]);

  if (!open) return null;

  const last = step === STEPS.length - 1;
  const close = () => {
    markDone();
    setOpen(false);
  };

  return (
    <div
      className="tour"
      role="dialog"
      aria-labelledby="tour-title"
      aria-describedby="tour-body"
      style={pos ? { top: pos.top, left: pos.left, bottom: 'auto', transform: 'none' } : undefined}
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
        {current.title}
      </h2>
      <p id="tour-body" className="tour__body">
        {current.body}
      </p>
      <div className="tour__actions">
        <div className="tour__dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={i === step ? 'is-active' : ''} />
          ))}
        </div>
        {!last && (
          <button className="btn" onClick={close}>
            Skip tour
          </button>
        )}
        {step > 0 && (
          <button className="btn" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        <button className="btn btn--primary" onClick={() => (last ? close() : setStep(step + 1))}>
          {last ? 'Start building' : 'Next'}
        </button>
      </div>
    </div>
  );
}
