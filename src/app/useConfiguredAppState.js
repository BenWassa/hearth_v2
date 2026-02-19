import { useAppState } from './useAppState.js';
import { useTemplateAppState } from '../template/useTemplateAppState.js';

const envMode = String(
  import.meta?.env?.VITE_HEARTH_MODE || import.meta?.env?.VITE_APP_MODE || '',
)
  .toLowerCase()
  .trim();

const isTruthyFlag = (value) => {
  const normalized = String(value || '').toLowerCase().trim();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

const getQueryMode = () => {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  const mode = String(params.get('mode') || '').toLowerCase().trim();
  const demoParam = params.get('demo');

  if (mode === 'demo' || mode === 'template') return 'template';
  if (demoParam !== null && isTruthyFlag(demoParam)) return 'template';
  return '';
};

const resolvedMode = envMode === 'template' ? 'template' : getQueryMode();

export const isTemplateMode = resolvedMode === 'template';

export const useConfiguredAppState = isTemplateMode
  ? useTemplateAppState
  : useAppState;
