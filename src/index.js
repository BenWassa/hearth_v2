import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

if (typeof window !== 'undefined' && typeof import.meta !== 'undefined') {
  window.__vite_import_meta_env__ = import.meta.env || {};
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = '/sw.js';
    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.update().catch(() => {});
        setInterval(() => {
          registration.update().catch(() => {});
        }, 5 * 60 * 1000);
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New service worker available, dispatch custom event
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          }
        });

        // Handle when service worker becomes active
        if (registration.active) {
          registration.addEventListener('controllerchange', () => {
            window.location.reload();
          });
        }
      })
      .catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
  });
}
