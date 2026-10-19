'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function FormDialog({ children, label, onClose, busy = false }) {
  const dialogRef = useRef(null);
  const close = useEffectEvent(() => {
    if (!busy) onClose();
  });

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    dialog.querySelector('input, select, textarea, button')?.focus();

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll('button, input, select, textarea, [tabindex="0"]')]
        .filter((element) => !element.disabled && element.getClientRects().length);
      const first = controls[0];
      const last = controls.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      style={{ colorScheme: 'light' }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/60 p-2 text-slate-900 backdrop-blur-xs sm:p-4"
    >
      {children}
    </div>,
    document.body,
  );
}
