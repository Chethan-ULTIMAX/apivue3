import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  // Fail loudly instead of silently rendering nothing.
  throw new Error(
    'Root element #root not found. Check index.html.',
  );
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);