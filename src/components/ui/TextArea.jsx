import React from 'react';

const TextArea = ({
  value,
  onChange,
  placeholder,
  className = '',
  ...rest
}) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={2}
    className={`w-full bg-stone-800/50 border border-stone-700 text-stone-100 placeholder-stone-400 px-4 py-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:border-amber-600/60 transition-opacity font-sans text-sm resize-none ${className}`}
    {...rest}
  />
);

export default TextArea;
