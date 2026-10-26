import React from 'react';
import { HearthAppView } from '../App.jsx';
import { useTemplateAppState } from './useTemplateAppState.js';

/**
 * Template-mode entry. Lives in its own lazy chunk (together with the seed
 * library JSON) so real users never download it. The state hook is called
 * unconditionally here, so hook ordering is stable.
 */
export default function TemplateApp() {
  return <HearthAppView appState={useTemplateAppState()} />;
}
