import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Global styles load before any component so component styles always come later in the cascade.
import './styles/tokens.css';
import './styles/fonts.css';
import './styles/base.css';
import App from './App.tsx';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
