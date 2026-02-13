import React from 'react';

const Input = ({ value, onChange, placeholder, autoFocus, ...rest }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    autoFocus={autoFocus}
    className="w-full bg-stone-800/50 border border-stone-700 text-stone-100 placeholder-stone-400 px-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-900/50 focus:border-amber-700/50 transition-all font-serif text-lg"
    {...rest}
  />
);

export default Input;
