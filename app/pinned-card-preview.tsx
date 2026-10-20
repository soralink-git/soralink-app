'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Eye, X } from 'lucide-react';
import { previewFrame, type PreviewFrame } from './lib/preview-frame';

export default function PinnedCardPreview({ ar, children }: { ar: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const previewId = useId();
  const rail = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ frame: PreviewFrame | null; height: number }>({
    frame: null,
    height: 0,
  });
  useEffect(() => {
    const anchor = rail.current!,
      element = panel.current!;
    let pending = 0;
    const measure = () => {
      pending = 0;
      const rect = anchor.getBoundingClientRect();
      const visible = window.visualViewport;
      const saveBar = anchor.closest('.workspace-main')?.querySelector('.workspace-save-action');
      const frame = previewFrame(rect, {
        width: window.innerWidth,
        height: visible?.height || window.innerHeight,
        offsetTop: visible?.offsetTop || 0,
        minTop: saveBar ? saveBar.getBoundingClientRect().bottom + 12 : undefined,
      });
      const height = element.getBoundingClientRect().height;
      setLayout((previous) => {
        const sameFrame =
          previous.frame === frame ||
          (previous.frame &&
            frame &&
            (['top', 'left', 'width', 'maxHeight'] as const).every(
              (key) => Math.abs(previous.frame![key] - frame[key]) < 0.5,
            ));
        return sameFrame && Math.abs(previous.height - height) < 0.5 ? previous : { frame, height };
      });
    };
    const schedule = () => {
      if (!pending) pending = window.requestAnimationFrame(measure);
    };
    // Capture also observes scrolling inside a containing dashboard pane.
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    observer?.observe(anchor);
    observer?.observe(element);
    observer?.observe(document.body);
    measure();
    return () => {
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      observer?.disconnect();
      if (pending) window.cancelAnimationFrame(pending);
    };
  }, []);
  return (
    <div
      className={'workspace-preview-rail' + (open ? ' preview-open' : '')}
      ref={rail}
      style={{
        minHeight: layout.frame ? layout.height || undefined : undefined,
        position: layout.frame ? 'static' : undefined,
      }}
    >
      <button
        type="button"
        className="secondary workspace-preview-toggle"
        aria-expanded={open}
        aria-controls={previewId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        {open ? (ar ? 'سدّ المعاينة' : 'Fermer l’aperçu') : ar ? 'شوف المعاينة' : 'Voir l’aperçu'}
      </button>
      <div
        id={previewId}
        ref={panel}
        className="workspace-card-preview"
        role="region"
        aria-label={ar ? 'معاينة الكارط ديالك' : 'Aperçu de votre carte'}
        style={layout.frame ? { position: 'fixed', ...layout.frame, zIndex: 10 } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
