import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_VERSION, BUILD_ID } from '../version';
import { isProductionBuild } from '../utils/env.js';

export const useVersionUpdates = () => {
  const [newVersionAvailable, setNewVersionAvailable] = useState(null);
  const [updateMessage, setUpdateMessage] = useState('');
  const [autoReloadCountdown, setAutoReloadCountdown] = useState(null);
  const autoReloadTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const updateInFlightRef = useRef(false);

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
    let countdown = 30;
    setAutoReloadCountdown(countdown);

    autoReloadTimerRef.current = setTimeout(() => {
      window.location.reload();
    }, 30000);

    countdownIntervalRef.current = setInterval(() => {
      countdown -= 1;
      setAutoReloadCountdown(countdown);
      if (countdown <= 0) {
        clearAutoReloadTimers();
      }
    }, 1000);
  }, [clearAutoReloadTimers]);

  const requestServiceWorkerActivation = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return false;

    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    try {
      await registration.update();
    } catch (error) {
      // ignore update polling errors
    }

    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    }

    if (registration.installing) {
      await new Promise((resolve) => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          resolve();
        };

        const timeoutId = setTimeout(finish, 4000);
        registration.installing.addEventListener('statechange', () => {
          if (
            registration.waiting ||
            registration.installing?.state === 'redundant'
          ) {
            clearTimeout(timeoutId);
            finish();
          }
        });
      });

      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return true;
      }
    }

    return false;
  }, []);

  const applyUpdate = useCallback(
    async ({ message, fallbackToBanner = true }) => {
      if (updateInFlightRef.current) return;
      updateInFlightRef.current = true;
      clearAutoReloadTimers();
      setAutoReloadCountdown(null);
      setUpdateMessage(message);

      try {
        const activationRequested = await requestServiceWorkerActivation();
        if (!activationRequested) {
          if (fallbackToBanner) {
            setNewVersionAvailable('manual-reload');
            setUpdateMessage(
              'Update ready. Reload to apply the latest version.',
            );
            scheduleAutoReload();
          } else {
            window.location.reload();
          }
        }
      } catch (error) {
        if (fallbackToBanner) {
          setNewVersionAvailable('manual-reload');
          setUpdateMessage('Update ready. Reload to apply the latest version.');
          scheduleAutoReload();
        } else {
          window.location.reload();
        }
      } finally {
        updateInFlightRef.current = false;
      }
    },
    [clearAutoReloadTimers, requestServiceWorkerActivation, scheduleAutoReload],
  );

  useEffect(() => {
    if (!isProductionBuild()) return undefined;

    let isMounted = true;

    const checkForUpdate = async () => {
      try {
        const response = await fetch('/version.json', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();

        const versionChanged = Boolean(
          data.version && data.version !== APP_VERSION,
        );
        const buildChanged = Boolean(data.buildId && data.buildId !== BUILD_ID);

        if (isMounted && (versionChanged || buildChanged)) {
          await applyUpdate({
            message: 'Updating to the latest version...',
            fallbackToBanner: false,
          });
        }
      } catch (err) {
        console.error('Error checking version:', err);
      }
    };

    const handleSWUpdate = () => {
      if (!isMounted) return;
      applyUpdate({
        message: 'Applying update...',
        fallbackToBanner: true,
      }).catch(() => {
        setNewVersionAvailable('manual-reload');
        setUpdateMessage('Update ready. Reload to apply the latest version.');
      });
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
  }, [applyUpdate, clearAutoReloadTimers]);

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
    setNewVersionAvailable(null);
    setUpdateMessage('Applying update...');
    await applyUpdate({
      message: 'Applying update...',
      fallbackToBanner: false,
    });
  }, [applyUpdate]);

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
