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

const isDev = Boolean(import.meta?.env?.DEV);

if ('serviceWorker' in navigator) {
  if (isDev) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(
          registrations.map((registration) => registration.unregister()),
        ),
      )
      .catch(() => {});
  }

  if (!isDev) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';
      let hasRefreshedForNewWorker = false;

      const forceActivateWaitingWorker = async (registration) => {
        if (!registration) return;
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      };

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hasRefreshedForNewWorker) return;
        hasRefreshedForNewWorker = true;
        window.location.reload();
      });

      navigator.serviceWorker
        .register(swUrl, { updateViaCache: 'none' })
        .then((registration) => {
          registration.update().catch(() => {});
          setInterval(() => {
            registration.update().catch(() => {});
          }, 60 * 1000);

          forceActivateWaitingWorker(registration).catch(() => {});

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                window.dispatchEvent(new CustomEvent('sw-update-available'));
                forceActivateWaitingWorker(registration).catch(() => {});
              }
            });
          });
        })
        .catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
    });
  }
}
