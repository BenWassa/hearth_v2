import React, { useState } from 'react';
import { ArrowRight, Loader2, LogIn } from 'lucide-react';
import { APP_VERSION } from '../version';
import Dialog from '../components/ui/Dialog.jsx';
import hearthVector from '../assets/hearth_vector.webp';

const truncateUsername = (name, maxLength = 24) => {
  const trimmed = String(name || '').trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength - 1) + '…';
};

const Input = ({ className = '', ...props }) => (
  <input
    className={`
      w-full bg-stone-800/50 border border-stone-700
      text-stone-100 placeholder:text-stone-400
      rounded-xl px-4 py-4
      font-sans text-base tracking-wide
      focus:outline-none focus:border-amber-700/50 focus:ring-2 focus:ring-amber-900/50
      transition-opacity duration-200
      ${className}
    `}
    {...props}
  />
);

const Button = ({
  children,
  className = '',
  variant = 'primary',
  disabled,
  ...props
}) => {
  const variants = {
    primary: 'bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold',
    ghost:
      'bg-transparent hover:bg-stone-800/50 text-stone-400 hover:text-stone-200',
  };

  return (
    <button
      disabled={disabled}
      className={`
        relative overflow-hidden
        flex items-center justify-center gap-2
        px-6 py-4 rounded-xl
        font-sans tracking-wide text-sm uppercase
        transition-[opacity,transform] duration-200
        disabled:opacity-40 disabled:cursor-not-allowed
        min-h-[56px] touch-manipulation
        active:scale-[0.98] motion-reduce:active:scale-100
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

const OnboardingView = ({
  onCreate,
  onSignIn,
  joinError,
  isBusy,
  isSigningIn,
  user,
}) => {
  const [name, setName] = useState('');
  const trimmedName = name.trim();
  const isAuthenticated = Boolean(user);
  // Full-screen takeover with no dismiss path (no onClose); Dialog still gives
  // it dialog semantics and keeps focus inside.
  return (
    <Dialog
      aria-labelledby="onboarding-title"
      className="fixed inset-0 w-full h-dvh flex flex-col items-center justify-center gap-8 sm:gap-10 overflow-hidden bg-shell text-stone-200 font-sans selection:bg-amber-500/30 pt-[max(2rem,var(--safe-top))] pb-[calc(6rem+var(--safe-bottom))] sm:pb-[calc(7rem+var(--safe-bottom))] pl-[calc(1.5rem+var(--safe-left))] pr-[calc(1.5rem+var(--safe-right))] sm:pl-[calc(2rem+var(--safe-left))] sm:pr-[calc(2rem+var(--safe-right))]"
    >
      {/* Brand Header */}
      <div className="flex flex-col items-center mb-6 sm:mb-10 onboarding-fade-down">
        <img
          src={hearthVector}
          alt=""
          width="160"
          height="160"
          decoding="async"
          className="w-32 h-32 sm:w-40 sm:h-40 mb-6 sm:mb-8"
        />
        <h1
          id="onboarding-title"
          className="text-4xl sm:text-5xl font-serif font-normal text-stone-100 tracking-tight mb-2"
        >
          Hearth
        </h1>
        <p className="text-amber-500 font-medium tracking-[0.3em] uppercase text-xs">
          Gather Around
        </p>
      </div>

      {/* Content Section */}
      <div className="w-full max-w-sm onboarding-fade-up">
        <div className="rounded-3xl border border-stone-800 bg-stone-900">
          <div className="p-6 sm:p-8">
            {joinError && (
              <div
                role="alert"
                className="mb-4 sm:mb-6 p-4 rounded-xl bg-red-900/20 border border-red-900/30 text-red-400 text-sm font-semibold"
              >
                {joinError}
              </div>
            )}

            <div className="space-y-5 sm:space-y-6">
              {!isAuthenticated ? (
                <>
                  <div className="text-xs uppercase tracking-widest text-stone-400 font-bold ml-1">
                    Step 1 of 2 - Sign in
                  </div>
                  <Button
                    onClick={onSignIn}
                    disabled={isSigningIn}
                    aria-busy={isSigningIn}
                    className="w-full"
                  >
                    {isSigningIn ? (
                      <Loader2
                        className="w-5 h-5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <LogIn className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>
                      {isSigningIn
                        ? 'Signing in with Google…'
                        : 'Sign in with Google'}
                    </span>
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-xs uppercase tracking-widest text-stone-400 font-bold ml-1">
                    Step 2 of 2 - Name your space
                  </div>
                  <div
                    className="text-xs text-stone-400 uppercase tracking-widest font-semibold ml-1 truncate max-w-xs"
                    title={user.email || user.displayName || user.uid}
                  >
                    Signed in as{' '}
                    {truncateUsername(
                      user.email || user.displayName || user.uid,
                      28,
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="space-name"
                      className="block text-xs uppercase tracking-widest text-stone-400 font-bold ml-1"
                    >
                      Space Name
                    </label>
                    <Input
                      id="space-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="The Living Room..."
                      maxLength={100}
                      autoFocus
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        trimmedName &&
                        onCreate(trimmedName)
                      }
                      disabled={isBusy}
                      aria-describedby="space-name-hint"
                    />
                    <p
                      id="space-name-hint"
                      className="text-xs text-stone-400 ml-1"
                    >
                      Enter the name of an existing space to join it. A new name
                      creates a new space.
                    </p>
                  </div>
                  <Button
                    onClick={() => onCreate(trimmedName)}
                    disabled={!trimmedName || isBusy}
                    aria-busy={isBusy}
                    className="w-full"
                  >
                    {isBusy && (
                      <Loader2
                        className="w-5 h-5 animate-spin"
                        aria-hidden="true"
                      />
                    )}
                    <span>
                      {isBusy
                        ? 'Creating or joining space…'
                        : 'Create or Join Space'}
                    </span>
                    {!isBusy && (
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 flex justify-center onboarding-fade-in">
        <div className="flex items-center gap-4 px-4 py-2">
          <span className="text-label text-stone-400 font-bold uppercase tracking-widest italic">
            Beta Access
          </span>
          <div className="w-px h-3 bg-stone-700" />
          <span className="text-label text-stone-400 font-mono">
            {`BUILD_${APP_VERSION}`}
          </span>
        </div>
      </div>

      <style>{`
        .onboarding-fade-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .onboarding-fade-down { animation: fadeDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .onboarding-fade-in { animation: fadeIn 1s ease-out both; }

        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDown {
          0% { opacity: 0; transform: translateY(-30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .onboarding-fade-up,
          .onboarding-fade-down,
          .onboarding-fade-in { animation: none; }
        }
      `}</style>
    </Dialog>
  );
};

export default OnboardingView;
