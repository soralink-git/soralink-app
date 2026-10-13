'use client';
import { useEffect, useRef, useState } from 'react';
import { cropRect } from './lib/crop-geometry';
export default function ImageCropper({
  source,
  target,
  ar,
  circle,
  onCancel,
  onApply,
}: {
  source: File | string;
  target: 'avatar' | 'cover';
  ar: boolean;
  circle: boolean;
  onCancel: () => void;
  onApply: (file: File) => Promise<void>;
}) {
  const t = (fr: string, da: string) => (ar ? da : fr),
    ratio = target === 'cover' ? 2 : 1;
  const canvas = useRef<HTMLCanvasElement>(null),
    image = useRef<HTMLImageElement | null>(null),
    dialog = useRef<HTMLDivElement>(null),
    drag = useRef<any>(null);
  const [ready, setReady] = useState(false),
    [zoom, setZoom] = useState(1),
    [x, setX] = useState(0),
    [y, setY] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    return () => {
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    let live = true;
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    const img = new Image();
    img.onload = () => {
      if (live) {
        image.current = img;
        setReady(true);
      }
    };
    img.onerror = () => {
      if (live)
        setError(
          t(
            'Image illisible. Choisissez une autre photo.',
            'ما قدرناش نقراو التصويرة. اختار وحدة أخرى.',
          ),
        );
    };
    img.src = url;
    return () => {
      live = false;
      image.current = null;
      img.onload = img.onerror = null;
      if (typeof source !== 'string') URL.revokeObjectURL(url);
    };
  }, [source]);
  useEffect(() => {
    const img = image.current,
      c = canvas.current;
    if (!ready || !img || !c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const r = cropRect(img.naturalWidth, img.naturalHeight, ratio, zoom, x, y);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, c.width, c.height);
  }, [ready, zoom, x, y, ratio]);
  async function apply() {
    if (!image.current || busy) return;
    setBusy(true);
    setError('');
    const c = document.createElement('canvas');
    try {
      const img = image.current,
        r = cropRect(img.naturalWidth, img.naturalHeight, ratio, zoom, x, y);
      c.width = Math.max(1, Math.round(Math.min(target === 'cover' ? 1600 : 600, r.sw)));
      c.height = Math.max(1, Math.round(c.width / ratio));
      const ctx = c.getContext('2d');
      if (!ctx) throw Error();
      ctx.drawImage(img, r.sx, r.sy, r.sw, r.sh, 0, 0, c.width, c.height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        c.toBlob((b) => (b ? resolve(b) : reject(Error())), 'image/webp', 0.9),
      );
      await onApply(new File([blob], target + '.webp', { type: blob.type }));
    } catch {
      setError(
        t(
          'Recadrage ou importation impossible. Réessayez.',
          'ما قدرناش نقصّو ولا نرفعو التصويرة. عاود جرّب.',
        ),
      );
    } finally {
      c.width = c.height = 0;
      setBusy(false);
    }
  }
  function keyboard(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape' && !busy) {
      onCancel();
      return;
    }
    if (e.key !== 'Tab') return;
    const nodes = dialog.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled),input:not(:disabled),[tabindex="0"]',
    );
    if (!nodes?.length) return;
    const first = nodes[0],
      last = nodes[nodes.length - 1];
    if (
      e.shiftKey &&
      (document.activeElement === first || document.activeElement === dialog.current)
    ) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
  return (
    <div className="crop-overlay">
      <div
        ref={dialog}
        tabIndex={-1}
        className="crop-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-title"
        dir={ar ? 'rtl' : 'ltr'}
        onKeyDown={keyboard}
      >
        <h2 id="crop-title">
          {target === 'cover'
            ? t('Recadrer la couverture', 'قصّ تصويرة الغلاف')
            : t('Recadrer le portrait / logo', 'قصّ التصويرة / اللوگو')}
        </h2>
        <p>
          {t(
            'Déplacez l’image avec la souris ou le doigt, puis ajustez le zoom.',
            'حرّك التصويرة بالماوس ولا بالصبع، ومن بعد عدّل الزوم.',
          )}
        </p>
        <div
          className={'crop-frame ' + (target === 'avatar' && circle ? 'crop-circle' : '')}
          style={{ aspectRatio: ratio }}
        >
          <canvas
            ref={canvas}
            width={400}
            height={400 / ratio}
            aria-label={t('Aperçu du recadrage', 'معاينة القصّ')}
            onPointerDown={(e) => {
              if (!ready || busy) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              drag.current = { px: e.clientX, py: e.clientY, x, y };
            }}
            onPointerMove={(e) => {
              const d = drag.current,
                img = image.current;
              if (!d || !img || busy) return;
              const r = cropRect(img.naturalWidth, img.naturalHeight, ratio, zoom, d.x, d.y),
                scale = e.currentTarget.getBoundingClientRect().width / r.sw;
              const ox = (img.naturalWidth - r.sw) * scale,
                oy = (img.naturalHeight - r.sh) * scale;
              setX(Math.max(-1, Math.min(1, d.x - (ox ? (2 * (e.clientX - d.px)) / ox : 0))));
              setY(Math.max(-1, Math.min(1, d.y - (oy ? (2 * (e.clientY - d.py)) / oy : 0))));
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          />
        </div>
        {!ready && !error && <p role="status">{t('Chargement…', 'كنحمّلو…')}</p>}
        <label>
          {t('Zoom', 'الزوم')}
          <input
            dir="ltr"
            type="range"
            min="1"
            max="4"
            step="0.01"
            value={zoom}
            disabled={!ready || busy}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        <label>
          {t('Position horizontale', 'الموضع الأفقي')}
          <input
            dir="ltr"
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={x}
            disabled={!ready || busy}
            onChange={(e) => setX(Number(e.target.value))}
          />
        </label>
        <label>
          {t('Position verticale', 'الموضع العمودي')}
          <input
            dir="ltr"
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={y}
            disabled={!ready || busy}
            onChange={(e) => setY(Number(e.target.value))}
          />
        </label>
        {error && (
          <p className="crop-error" role="alert">
            {error}
          </p>
        )}
        <div className="crop-actions">
          <button
            className="secondary"
            disabled={busy}
            onClick={() => {
              setZoom(1);
              setX(0);
              setY(0);
            }}
          >
            {t('Centrer', 'رجّع للوسط')}
          </button>
          <button className="secondary" disabled={busy} onClick={onCancel}>
            {t('Annuler', 'إلغاء')}
          </button>
          <button className="primary" disabled={!ready || busy} onClick={apply}>
            {busy ? t('Importation…', 'كنرفعو…') : t('Appliquer le recadrage', 'طبّق القصّ')}
          </button>
        </div>
        <p className="hint">
          {t(
            'Enregistrez ensuite votre carte pour publier la modification.',
            'من بعد سجّل الكارط باش تنشر التعديل.',
          )}
        </p>
      </div>
    </div>
  );
}
