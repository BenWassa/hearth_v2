import React from 'react';

const TextArea = ({ value, onChange, placeholder }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={2}
    className="w-full bg-stone-800/50 border border-stone-700 text-stone-100 placeholder-stone-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-900/50 focus:border-amber-700/50 transition-all font-sans text-sm resize-none"
  />
);

export default TextArea;
