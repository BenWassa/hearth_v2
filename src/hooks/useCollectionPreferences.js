import { useCallback, useEffect, useRef, useState } from 'react';
import { getAppId, initializeFirebase } from '../services/firebase/client.js';
import {
  isCollectionPreferenceKey,
  saveCollectionPreference,
  subscribeCollectionPreferences,
} from '../services/firebase/collectionPreferences.js';

// Like the demo shelf, preferences survive view navigation but reset on refresh.
// A demo can never write preferences into a connected household.
const templatePreferences = new Map();
const EMPTY_PREFERENCES = {};

const useCollectionPreferences = ({
  spaceId,
  isTemplateSession = false,
} = {}) => {
  const scope = `${isTemplateSession ? 'template' : 'household'}:${
    spaceId || ''
  }`;
  const [state, setState] = useState(() => ({
    scope,
    preferences: isTemplateSession ? templatePreferences.get(scope) || {} : {},
    loading: Boolean(spaceId && !isTemplateSession),
    saving: false,
    error: null,
  }));
  const connection = useRef(null);
  const generation = useRef(0);

  useEffect(() => {
    const currentGeneration = ++generation.current;
    let unsubscribe;
    let attached = false;
    connection.current = null;
    const current = () => generation.current === currentGeneration;
    const update = (next) => {
      if (current()) setState((value) => ({ ...value, ...next, scope }));
    };
    setState({
      scope,
      preferences: {},
      loading: Boolean(spaceId && !isTemplateSession),
      saving: false,
      error: null,
    });
    if (isTemplateSession) {
      update({ preferences: templatePreferences.get(scope) || {} });
    } else if (spaceId) {
      const ready = ({ db }) => {
        if (!current() || attached) return;
        if (!db) {
          update({
            loading: false,
            error:
              'Household preferences are unavailable. Please check your connection.',
          });
          return;
        }
        attached = true;
        const appId = getAppId();
        connection.current = { db, appId, spaceId };
        unsubscribe = subscribeCollectionPreferences({
          db,
          appId,
          spaceId,
          onNext: (preferences) =>
            update({ preferences, loading: false, error: null }),
          onError: () => {
            if (!current()) return;
            connection.current = null;
            update({
              loading: false,
              error:
                'Could not load household collection preferences. Please try again.',
            });
          },
        });
      };
      const client = initializeFirebase(ready);
      // initializeFirebase can return an already-open client before its delayed callback.
      if (client?.db) ready(client);
    }
    return () => {
      generation.current++;
      unsubscribe?.();
      connection.current = null;
    };
  }, [scope, spaceId, isTemplateSession]);

  const setPreference = useCallback(
    async (key, visible) => {
      const currentGeneration = generation.current;
      const update = (next) => {
        if (generation.current === currentGeneration) {
          setState((value) => ({ ...value, ...next, scope }));
        }
      };
      if (
        !isCollectionPreferenceKey(key) ||
        (visible !== null && typeof visible !== 'boolean')
      ) {
        update({
          error: 'Choose Show, Hide, or Default for a valid collection.',
        });
        return false;
      }
      update({ saving: true, error: null });
      try {
        if (isTemplateSession) {
          const preferences = { ...(templatePreferences.get(scope) || {}) };
          if (visible === null) delete preferences[key];
          else preferences[key] = visible;
          templatePreferences.set(scope, preferences);
          update({ preferences });
        } else {
          if (!connection.current || !spaceId) throw new Error('unavailable');
          await saveCollectionPreference({
            ...connection.current,
            key,
            visible,
          });
        }
        return true;
      } catch (_error) {
        update({
          error: 'Could not save the household preference. Please try again.',
        });
        return false;
      } finally {
        update({ saving: false });
      }
    },
    [scope, spaceId, isTemplateSession],
  );

  const visibleState =
    state.scope === scope
      ? state
      : {
          preferences: EMPTY_PREFERENCES,
          loading: Boolean(spaceId && !isTemplateSession),
          saving: false,
          error: null,
        };
  return { ...visibleState, setPreference };
};

export default useCollectionPreferences;
