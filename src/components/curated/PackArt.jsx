import React, { useState } from 'react';

// Decorative pack artwork. Renders the image when the file exists and the
// placeholder when it is missing or fails to load.
const PackArt = ({
  src,
  className = '',
  placeholder = null,
  onLoad,
  onError,
}) => {
  const [failed, setFailed] = useState(false);
  if (failed || !src) return placeholder;
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onLoad={onLoad}
      onError={() => {
        setFailed(true);
        onError?.();
      }}
      className={className}
    />
  );
};

export default PackArt;
