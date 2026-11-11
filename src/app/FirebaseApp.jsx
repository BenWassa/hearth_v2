import React from 'react';
import { HearthAppView } from '../App.jsx';
import { useAppState } from './useAppState.js';

export default function FirebaseApp() {
  return <HearthAppView appState={useAppState()} />;
}
