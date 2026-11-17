'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { openModalDialog } from './lib/dialog-lifecycle';

export default function ModalDialog({
  label,
  ar,
  busy = false,
  onClose,
  children,
}: {
  label: string;
  ar: boolean;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => openModalDialog(dialog.current!), []);
  return (
    <dialog
      ref={dialog}
      className="modal ux-dialog"
      aria-label={label}
      aria-modal="true"
      aria-busy={busy}
      dir={ar ? 'rtl' : 'ltr'}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
