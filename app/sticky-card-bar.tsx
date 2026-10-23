'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
export default function StickyCardBar({
  ar,
  count,
  total,
  target,
  accent,
  foreground,
}: {
  ar: boolean;
  count: number;
  total: string;
  target: string;
  accent: string;
  foreground: string;
}) {
  const [mounted, setMounted] = useState(false),
    [visible, setVisible] = useState(true);
  useEffect(() => {
    setMounted(true);
    const el = document.getElementById(target);
    if (!el || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);
  if (!mounted || !visible || !count) return null;
  return createPortal(
    <aside
      className="sticky-card-bar"
      dir={ar ? 'rtl' : 'ltr'}
      aria-label={ar ? 'ملخص الاختيار' : 'Résumé de ma sélection'}
      style={
        { '--sticky-accent': accent, '--sticky-foreground': foreground } as React.CSSProperties
      }
    >
      <div aria-live="polite">
        <strong>
          {count} {ar ? 'منتج / خدمة' : count === 1 ? 'article' : 'articles'}
        </strong>
        <small>{total}</small>
      </div>
      <button
        type="button"
        onClick={() =>
          document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      >
        {ar ? 'شوف الاختيار' : 'Voir ma sélection'}
      </button>
    </aside>,
    document.body,
  );
}
