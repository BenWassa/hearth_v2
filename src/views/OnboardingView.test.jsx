import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { vi } from 'vitest';
import OnboardingView from './OnboardingView.jsx';

const mount = async (props) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <OnboardingView onCreate={vi.fn()} onSignIn={vi.fn()} {...props} />,
    );
  });
  return {
    container,
    cleanup: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
};

describe('OnboardingView loading actions', () => {
  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('keeps the Google sign-in action named while loading', async () => {
    const { container, cleanup } = await mount({ isSigningIn: true });
    try {
      const button = container.querySelector('button');
      expect(button.textContent).toContain('Signing in with Google…');
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.querySelector('svg').getAttribute('aria-hidden')).toBe(
        'true',
      );
    } finally {
      await cleanup();
    }
  });

  it('keeps the space action named while loading', async () => {
    const { container, cleanup } = await mount({
      isBusy: true,
      user: { uid: 'household-user', email: 'person@example.com' },
    });
    try {
      const button = container.querySelector('button');
      expect(button.textContent).toContain('Creating or joining space…');
      expect(button.disabled).toBe(true);
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.querySelector('svg').getAttribute('aria-hidden')).toBe(
        'true',
      );
    } finally {
      await cleanup();
    }
  });
});
