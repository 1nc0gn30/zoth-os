import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Synchronous dual-theme initialization before first paint
function initTheme(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const queryTheme = params.get('theme');
    const saved = window.localStorage.getItem('maya-theme');
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    const resolved =
      queryTheme === 'light' || queryTheme === 'dark'
        ? queryTheme
        : saved === 'light' || saved === 'dark'
          ? saved
          : prefersLight
            ? 'light'
            : 'dark';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolved);
    document.documentElement.dataset.theme = resolved;
  } catch (_) {
    document.documentElement.classList.add('dark');
  }
}

initTheme();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
