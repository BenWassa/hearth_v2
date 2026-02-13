import React, { useState } from 'react';
import { ArrowRight, Loader2, LogIn } from 'lucide-react';
import { APP_VERSION } from '../version';
import hearthVector from '../assets/hearth_vector.png';

const Input = ({ className = '', ...props }) => (
  <input
    className={`
      w-full bg-stone-900/50 border border-stone-800/80
      text-stone-100 placeholder:text-stone-600
      rounded-xl px-4 py-4
      font-sans text-base tracking-wide
      focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20
      transition-all duration-300 shadow-inner
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
    primary:
      'bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold shadow-[0_4px_14px_0_rgba(217,119,6,0.39)]',
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
        transition-all duration-300
        disabled:opacity-40 disabled:cursor-not-allowed
        min-h-[56px] touch-manipulation
        active:scale-[0.98]
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
  return (
    <div className="fixed inset-0 w-full h-screen flex flex-col items-center justify-center gap-8 sm:gap-10 overflow-hidden bg-[#0c0a09] text-stone-200 font-sans selection:bg-amber-500/30 px-6 pt-8 pb-24 sm:px-8 sm:pt-12 sm:pb-28">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Deep vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_transparent_0%,_rgba(12,10,9,0.8)_80%,_#0c0a09_100%)] z-10" />

        {/* Animated Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-900/10 blur-[120px] rounded-full animate-warm-glow" />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] bg-stone-900/20 blur-[100px] rounded-full animate-warm-glow-delay" />

        {/* Texture */}
        <div
          className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Brand Header */}
      <div className="relative z-20 flex flex-col items-center mb-6 sm:mb-10 onboarding-fade-down">
        <div className="relative mb-6 sm:mb-8">
          <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full scale-150 animate-pulse-slow" />
          <img
            src={hearthVector}
            alt="Hearth"
            className="w-32 h-32 sm:w-40 sm:h-40 relative z-10 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
          />
        </div>
        <h1 className="text-4xl sm:text-5xl font-serif font-black text-white tracking-tighter uppercase mb-2">
          Hearth
        </h1>
        <p className="text-amber-500/80 font-medium tracking-[0.3em] uppercase text-[10px] sm:text-xs">
          Gather Around
        </p>
      </div>

      {/* Content Section */}
      <div className="relative z-20 w-full max-w-sm onboarding-fade-up">
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />

          <div className="relative p-6 sm:p-8">
            {joinError && (
              <div className="mb-4 sm:mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-semibold flex items-center gap-3 animate-shake">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {joinError}
              </div>
            )}

            <div className="space-y-5 sm:space-y-6">
              {!user && (
                <Button
                  onClick={onSignIn}
                  disabled={isSigningIn}
                  className="w-full"
                >
                  {isSigningIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign in with Google</span>
                    </>
                  )}
                </Button>
              )}

              {user && (
                <div className="text-[11px] text-stone-500 uppercase tracking-widest font-semibold ml-1">
                  Signed in as {user.email || user.displayName || user.uid}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="space-name"
                  className="text-[10px] uppercase tracking-widest text-stone-500 font-bold ml-1"
                >
                  Space Name
                </label>
                <Input
                  id="space-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="The Living Room..."
                  maxLength={100} // increased to allow longer names
                  autoFocus
                  onKeyDown={(e) =>
                    e.key === 'Enter' && user && trimmedName && onCreate(trimmedName)
                  }
                  disabled={!user || isBusy}
                />
              </div>

              <Button
                onClick={() => onCreate(trimmedName)}
                disabled={!user || !trimmedName || isBusy}
                className="w-full"
              >
                {isBusy ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Create Your Space</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <div className="pt-2 sm:pt-4 text-center">
                <button className="text-[11px] text-stone-500 hover:text-amber-500/80 transition-colors uppercase tracking-widest font-bold">
                  Join with invite link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 z-20 flex justify-center onboarding-fade-in delay-700">
        <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-white/[0.02] border border-white/5 backdrop-blur-sm">
          <span className="text-[9px] text-stone-600 font-bold uppercase tracking-widest italic">
            Beta Access
          </span>
          <div className="w-px h-3 bg-white/10" />
          <span className="text-[9px] text-stone-500 font-mono tracking-tighter">
            {`BUILD_${APP_VERSION}`}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes warm-glow {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -10%) scale(1); }
          50% { opacity: 0.8; transform: translate(-45%, -5%) scale(1.1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-warm-glow { animation: warm-glow 15s ease-in-out infinite; }
        .animate-warm-glow-delay { animation: warm-glow 18s ease-in-out infinite reverse; opacity: 0.3; }
        .animate-pulse-slow { animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .onboarding-fade-up { animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .onboarding-fade-down { animation: fadeDown 0.8s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .onboarding-fade-in { animation: fadeIn 1s ease-out both; }
        .animate-shake { animation: shake 0.4s ease-in-out 3; }
        
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
      `}</style>
    </div>
  );
};

export default OnboardingView;
