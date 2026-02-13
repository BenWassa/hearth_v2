import { useEffect, useState } from 'react';

/**
 * Hook to manage modal-specific side effects
 */
export const useModalEffects = (isOpen, rawItem) => {
  const [backdropMissing, setBackdropMissing] = useState(false);
  const [now, setNow] = useState(new Date());

  // Reset backdrop and editing state when modal opens
  useEffect(() => {
    if (isOpen) {
      setBackdropMissing(false);
    }
  }, [isOpen, rawItem?.id]);

  // Update clock every minute
  useEffect(() => {
    if (!isOpen) return undefined;
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Reset backdrop missing state when backdrop changes
  useEffect(() => {
    setBackdropMissing(false);
  }, [rawItem?.backdrop, rawItem?.backdrop_path, rawItem?.backdropPath]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  return { backdropMissing, setBackdropMissing, now };
};
