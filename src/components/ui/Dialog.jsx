import React from 'react';
import useDialog from './useDialog.js';

/**
 * Root element of a modal: dialog role, aria-modal, Escape, focus trap and
 * focus return (see useDialog). Mounts only while the dialog is open, so the
 * focus lifecycle lines up with it being on screen.
 *
 *   <Dialog onClose={close} aria-labelledby="title-id" className="fixed inset-0 z-50">
 *     <div aria-hidden="true" className="absolute inset-0 bg-stone-950/85" />
 *     ...
 *   </Dialog>
 *
 * Scrims are decorative siblings, never buttons in the tab order.
 */
const Dialog = ({ onClose, children, className = '', ...rest }) => {
  const dialogProps = useDialog({ onClose });
  return (
    <div
      {...dialogProps}
      {...rest}
      className={`focus:outline-none ${className}`}
    >
      {children}
    </div>
  );
};

export default Dialog;
