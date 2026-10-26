import React from 'react';

const Input = ({
  value,
  onChange,
  placeholder,
  autoFocus,
  className = '',
  ...rest
}) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    autoFocus={autoFocus}
    className={`w-full bg-stone-800/50 border border-stone-700 text-stone-100 placeholder-stone-400 px-4 py-4 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:border-amber-600/60 transition-opacity font-serif text-lg ${className}`}
    {...rest}
  />
);

export default Input;
