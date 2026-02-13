import React, { useEffect, useState } from 'react';

const LazyMediaImage = ({
  src,
  alt,
  className = '',
  skeletonClassName = '',
  containerClassName = '',
  loading = 'lazy',
  decoding = 'async',
  fetchPriority = 'auto',
  onError,
  fallback = null,
}) => {
  const [isLoading, setIsLoading] = useState(Boolean(src));
  const [isErrored, setIsErrored] = useState(false);

  useEffect(() => {
    setIsLoading(Boolean(src));
    setIsErrored(false);
  }, [src]);

  if (!src || isErrored) {
    return fallback;
  }

  return (
    <div className={`relative h-full w-full ${containerClassName}`.trim()}>
      {isLoading && (
        <div
          className={`absolute inset-0 animate-pulse bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 ${skeletonClassName}`.trim()}
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        className={`${className} transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`.trim()}
        onLoad={() => setIsLoading(false)}
        onError={(event) => {
          setIsErrored(true);
          setIsLoading(false);
          if (onError) onError(event);
        }}
      />
    </div>
  );
};

export default LazyMediaImage;
