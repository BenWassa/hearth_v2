import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_VERSION } from '../version';
import { isProductionBuild } from '../utils/env.js';

export const useVersionUpdates = () => {
  const [newVersionAvailable, setNewVersionAvailable] = useState(null);
  const [updateMessage, setUpdateMessage] = useState('');
  const [autoReloadCountdown, setAutoReloadCountdown] = useState(null);
  const autoReloadTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const clearAutoReloadTimers = useCallback(() => {
    if (autoReloadTimerRef.current) {
      clearTimeout(autoReloadTimerRef.current);
      autoReloadTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const notifyUpdate = useCallback(
    (message) => {
      if (newVersionAvailable) return;
      setUpdateMessage(message);
      setTimeout(() => {
        setUpdateMessage((prev) => (prev === message ? '' : prev));
      }, 3500);
    },
    [newVersionAvailable],
  );

  const scheduleAutoReload = useCallback(() => {
    clearAutoReloadTimers();
    let countdown = 60;
    setAutoReloadCountdown(countdown);

    autoReloadTimerRef.current = setTimeout(() => {
      window.location.reload();
    }, 60000);

    countdownIntervalRef.current = setInterval(() => {
      countdown -= 1;
      setAutoReloadCountdown(countdown);
      if (countdown <= 0) {
        clearAutoReloadTimers();
      }
    }, 1000);
  }, [clearAutoReloadTimers]);

  useEffect(() => {
    if (!isProductionBuild()) return undefined;

    let isMounted = true;

    const checkForUpdate = async () => {
      try {
        const versionUrl = '/version.json';
        const response = await fetch(versionUrl, { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted && data.version && data.version !== APP_VERSION) {
          setNewVersionAvailable(data.version);
          setUpdateMessage(`New version available (${data.version})`);
          scheduleAutoReload();
        }
      } catch (err) {
        console.error('Error checking version:', err);
      }
    };

    const handleSWUpdate = () => {
      if (isMounted) {
        setNewVersionAvailable('service-worker');
        setUpdateMessage('App updated! Reload to get the latest version.');
        scheduleAutoReload();
      }
    };

    checkForUpdate();
    const interval = setInterval(checkForUpdate, 60000);
    window.addEventListener('sw-update-available', handleSWUpdate);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearAutoReloadTimers();
      setAutoReloadCountdown(null);
      window.removeEventListener('sw-update-available', handleSWUpdate);
    };
  }, [clearAutoReloadTimers, scheduleAutoReload]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange,
    );
    return () => {
      try {
        navigator.serviceWorker.removeEventListener(
          'controllerchange',
          onControllerChange,
        );
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const handleReloadNow = useCallback(async () => {
    clearAutoReloadTimers();
    setAutoReloadCountdown(null);

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          setNewVersionAvailable(null);
          setUpdateMessage('');
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          return;
        }

        if (reg?.installing) {
          await new Promise((resolve) => {
            let settled = false;
            const finalize = () => {
              if (settled) return;
              settled = true;
              resolve();
            };
            const timeoutId = setTimeout(finalize, 4000);
            reg.installing.addEventListener('statechange', () => {
              if (reg.waiting || reg.installing?.state === 'redundant') {
                clearTimeout(timeoutId);
                finalize();
              }
            });
          });

          if (reg.waiting) {
            setNewVersionAvailable(null);
            setUpdateMessage('');
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            return;
          }
        }
      }
    } catch (err) {
      console.error('Error while requesting SW skipWaiting:', err);
    }

    window.location.reload();
  }, [clearAutoReloadTimers]);

  const dismissUpdate = useCallback(() => {
    setNewVersionAvailable(null);
    setUpdateMessage('');
    clearAutoReloadTimers();
    setAutoReloadCountdown(null);
  }, [clearAutoReloadTimers]);

  return {
    autoReloadCountdown,
    dismissUpdate,
    handleReloadNow,
    newVersionAvailable,
    notifyUpdate,
    updateMessage,
  };
};
