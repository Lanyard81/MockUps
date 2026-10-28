import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-500.css';
import './styles/theme.css';
import './styles/app.css';
import './styles/devdan.css';
import './styles/flat.css';
import { applyStoredTheme } from './app/theme';

applyStoredTheme();

import { initPersistence } from './persistence/init';

// Reopen the last mockup before the first paint, but never let slow storage hold the app up.
const timeout = new Promise<void>((resolve) => setTimeout(resolve, 1500));
await Promise.race([initPersistence().catch(() => undefined), timeout]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
