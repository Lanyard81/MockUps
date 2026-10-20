import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles/theme.css';
import './styles/app.css';

import { initPersistence } from './persistence/init';

// Reopen the last mockup before the first paint, but never let slow storage hold the app up.
const timeout = new Promise<void>((resolve) => setTimeout(resolve, 1500));
await Promise.race([initPersistence().catch(() => undefined), timeout]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
