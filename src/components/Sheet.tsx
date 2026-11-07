"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/** Hoja inferior (en móvil) / diálogo centrado (en escritorio) con <dialog>. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
      className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-3xl bg-cream p-0 text-ink shadow-xl backdrop:bg-black/40 md:m-auto md:max-w-lg md:rounded-3xl"
    >
      <div className="sticky top-0 flex items-center justify-between border-b border-brand-900/10 bg-cream px-5 py-4">
        <h2 className="font-serif text-xl font-semibold text-brand-800">{title}</h2>
        <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-brand-50">
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">{children}</div>
    </dialog>
  );
}
