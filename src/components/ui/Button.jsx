import React from 'react';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  ...rest
}) => {
  const baseStyle =
    'px-6 py-3 rounded-xl font-medium transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2';
  const variants = {
    primary:
      'bg-amber-600 text-stone-900 hover:bg-amber-500 shadow-lg shadow-amber-900/20',
    secondary:
      'bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700',
    ghost: 'bg-transparent text-stone-300 hover:text-amber-400',
    danger:
      'bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30',
    glass:
      'bg-stone-900/60 backdrop-blur-md border border-stone-800 text-stone-200 hover:bg-stone-800',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
