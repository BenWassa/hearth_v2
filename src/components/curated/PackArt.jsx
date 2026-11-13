import React, { useState } from 'react';

// Decorative pack artwork. Renders the image when the file exists and the
// placeholder when it is missing or fails to load.
const PackArt = ({ src, className = '', placeholder = null }) => {
  const [failed, setFailed] = useState(false);
  if (failed || !src) return placeholder;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export default PackArt;
