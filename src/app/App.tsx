import { useEffect } from 'react';
import { Viewport } from '../canvas/Viewport';
import { handleKeyDown, handleKeyUp } from '../canvas/shortcuts';
import { useStore } from '../store/store';
import { FrameBar } from './FrameBar';
import { Toolbar } from './Toolbar';

export function App() {
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Releasing space outside the window would leave the canvas stuck in pan mode.
    const reset = () => useStore.getState().setPanning(false);
    window.addEventListener('blur', reset);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', reset);
    };
  }, []);

  // Fit the frames into view once they have been measured on load.
  useEffect(() => {
    const unsubscribe = useStore.subscribe((state) => {
      if (state.doc.frames.every((f) => f.id in state.frameHeights)) {
        unsubscribe();
        state.zoomToFit();
        state.markFitted();
      }
    });
    return unsubscribe;
  }, []);

  return (
    <div className="app">
      <Toolbar />
      <FrameBar />
      <Viewport />
    </div>
  );
}
