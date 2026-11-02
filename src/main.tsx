import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Global styles load before any component so component styles always come later in the cascade.
import './styles/tokens.css';
import './styles/fonts.css';
import './styles/base.css';
import App from './App.tsx';
import { initMotion } from './motion/preference.ts';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found in index.html');
}

// Publish CSS motion variables and set data-motion before the first paint (ARCHITECTURE §5; MO-5).
initMotion();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
