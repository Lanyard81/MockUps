import { useEffect } from 'react';
import { DragGhost } from '../canvas/DragGhost';
import { Viewport } from '../canvas/Viewport';
import { handleKeyDown, handleKeyUp } from '../canvas/shortcuts';
import { useStore } from '../store/store';
import { Library } from './Library';
import { Properties } from './Properties';
import { Toast } from './Toast';
import { Toolbar } from './Toolbar';

export function App() {
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Releasing space outside the window would leave the canvas stuck in pan mode.
    const reset = () => useStore.getState().setPanning(false);
    window.addEventListener('blur', reset);
    // A file dropped outside a picture would make the browser open it and lose all unsaved work.
    const stopFileDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    };
    window.addEventListener('dragover', stopFileDrop);
    window.addEventListener('drop', stopFileDrop);
    return () => {
      window.removeEventListener('dragover', stopFileDrop);
      window.removeEventListener('drop', stopFileDrop);
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
      <Library />
      <Viewport />
      <Properties />
      <DragGhost />
      <Toast />
    </div>
  );
}
