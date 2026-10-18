'use client';
import { useEffect, useRef, useState } from 'react';
import { cropRect, cropSettings, type CropTarget } from './lib/crop-geometry';
import CardView from './card-view';
import { X } from 'lucide-react';
export default function ImageCropper({
  source,
  target,
  ar,
  circle,
  cardData,
  onLivePreview,
  onCancel,
  onApply,
  autosave = true,
}: {
  source: File | string;
  target: CropTarget;
  ar: boolean;
  autosave?: boolean;
  circle: boolean;
  cardData?: any;
  onLivePreview?: (dataUrl: string) => void;
  onCancel: () => void;
  onApply: (file: File) => Promise<void>;
}) {
  const t = (fr: string, da: string) => (ar ? da : fr),
    { ratio, maxWidth } = cropSettings(target);
  const previewCallback = useRef(onLivePreview);
  previewCallback.current = onLivePreview;
  const canvas = useRef<HTMLCanvasElement>(null),
    image = useRef<HTMLImageElement | null>(null),
    dialog = useRef<HTMLDivElement>(null),
    cardPreview = useRef<HTMLDivElement>(null),
    drag = useRef<any>(null);
  const [ready, setReady] = useState(false),
    [zoom, setZoom] = useState(1),
    [x, setX] = useState(0),
    [y, setY] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [livePreviewUrl, setLivePreviewUrl] = useState<string>('');
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
    setReady(false);
    setError('');
    setLivePreviewUrl('');
    setZoom(1);
    setX(0);
    setY(0);
    let live = true;
    let objectUrlToRevoke: string | null = null;

    async function loadImage() {
      try {
        let url: string;
        if (typeof source !== 'string') {
          url = URL.createObjectURL(source);
          objectUrlToRevoke = url;
        } else if (source.startsWith('data:') || source.startsWith('blob:')) {
          url = source;
        } else {
          try {
            const resp = await fetch(source, { mode: 'cors' });
            if (resp.ok) {
              const b = await resp.blob();
              url = URL.createObjectURL(b);
              objectUrlToRevoke = url;
            } else {
              url = source;
            }
          } catch {
            url = source;
          }
        }

        const img = new Image();
        img.crossOrigin = 'anonymous';
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
      } catch {
        if (live) {
          setError(
            t(
              'Image illisible. Choisissez une autre photo.',
              'ما قدرناش نقراو التصويرة. اختار وحدة أخرى.',
            ),
          );
        }
      }
    }

    loadImage();

    return () => {
      live = false;
      image.current = null;
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
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

    try {
      const pUrl = c.toDataURL('image/webp', 0.85);
      setLivePreviewUrl(pUrl);
      previewCallback.current?.(pUrl);
    } catch {}
  }, [ready, zoom, x, y, ratio]);
  useEffect(() => {
    const viewport = cardPreview.current;
    const avatar = viewport?.querySelector('.avatar');
    if (ready && target === 'avatar' && viewport && avatar) {
      viewport.scrollTop = Math.max(
        0,
        avatar.getBoundingClientRect().top - viewport.getBoundingClientRect().top - 12,
      );
    }
  }, [ready, target]);
  async function apply() {
    if (!image.current || busy) return;
    setBusy(true);
    setError('');
    const c = document.createElement('canvas');
    try {
      const img = image.current,
        r = cropRect(img.naturalWidth, img.naturalHeight, ratio, zoom, x, y);
      c.width = Math.max(1, Math.round(Math.min(maxWidth, r.sw)));
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
      'button:not(:disabled):not([inert] *),input:not(:disabled):not([inert] *),[tabindex="0"]:not([inert] *)',
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
        className={'crop-dialog ' + (cardData && target !== 'product' ? 'crop-with-card' : '')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-title"
        dir={ar ? 'rtl' : 'ltr'}
        onKeyDown={keyboard}
      >
        <header className="crop-header">
          <div>
            <h2 id="crop-title">
              {target === 'product'
                ? t('Recadrer la photo du catalogue', 'تأطير صورة الكاتالوگ')
                : target === 'backgroundPhoto'
                  ? t('Recadrer la photo de fond', 'قصّ تصويرة الخلفية')
                  : target === 'cover'
                    ? t('Recadrer la couverture', 'قصّ تصويرة الغلاف')
                    : t('Recadrer le portrait / logo', 'قصّ التصويرة / اللوگو')}
            </h2>
            <p>
              {t(
                'Déplacez l’image avec la souris ou le doigt, puis ajustez le zoom.',
                'حرّك التصويرة بالماوس ولا بالصبع، ومن بعد عدّل الزوم.',
              )}
            </p>
          </div>
          <button
            type="button"
            className="secondary crop-close"
            disabled={busy}
            onClick={onCancel}
            aria-label={t('Fermer le recadrage', 'سدّ نافذة القصّ')}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="crop-workspace">
          <section
            className="crop-adjustments"
            aria-label={t('Cadrage et ajustements', 'القصّ والتعديل')}
          >
            <div
              className={'crop-frame ' + (target === 'avatar' && circle ? 'crop-circle' : '')}
              style={{ aspectRatio: ratio, '--crop-ratio': ratio } as React.CSSProperties}
            >
              <canvas
                ref={canvas}
                width={440}
                height={Math.round(440 / ratio)}
                aria-label={t('Aperçu du recadrage', 'معاينة القصّ')}
                onPointerDown={(e) => {
                  if (!ready || busy || !e.isPrimary) return;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  drag.current = { px: e.clientX, py: e.clientY, x, y };
                }}
                onPointerMove={(e) => {
                  const d = drag.current,
                    img = image.current;
                  if (!d || !img || busy || !e.isPrimary) return;
                  const r = cropRect(img.naturalWidth, img.naturalHeight, ratio, zoom, d.x, d.y),
                    scale = e.currentTarget.getBoundingClientRect().width / r.sw;
                  const ox = (img.naturalWidth - r.sw) * scale,
                    oy = (img.naturalHeight - r.sh) * scale;
                  setX(Math.max(-1, Math.min(1, d.x - (ox ? (2 * (e.clientX - d.px)) / ox : 0))));
                  setY(Math.max(-1, Math.min(1, d.y - (oy ? (2 * (e.clientY - d.py)) / oy : 0))));
                }}
                onPointerUp={(e) => {
                  if (e.isPrimary) drag.current = null;
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
          </section>
          {cardData && target !== 'product' && (
            <section
              className="crop-live-preview"
              aria-label={t('Aperçu de votre carte', 'معاينة الكارط ديالك')}
            >
              <div className="crop-live-badge">
                <span className="live-dot" />
                {t('Votre carte en temps réel', 'الكارط ديالك مباشرة')}
              </div>
              <div
                className="crop-card-scroll"
                ref={cardPreview}
                tabIndex={0}
                aria-label={t('Faire défiler l’aperçu de la carte', 'مرّر معاينة الكارط')}
              >
                <div inert className="crop-real-card">
                  <CardView
                    d={{ ...cardData, ...(livePreviewUrl ? { [target]: livePreviewUrl } : {}) }}
                    ar={ar}
                    setAr={() => {}}
                    onMessage={() => {}}
                    onRequest={() => {}}
                    preview
                    withSections
                  />
                </div>
              </div>
            </section>
          )}
        </div>
        <footer className="crop-footer">
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
              target === 'product' || !autosave
                ? 'Appliquez le cadrage pour importer la photo.'
                : 'Appliquez le cadrage pour importer l’image. La carte sera enregistrée automatiquement.',
              target === 'product' || !autosave
                ? 'طبّق القصّ باش ترفع التصويرة.'
                : 'طبّق القصّ باش ترفع التصويرة. الكارط غادي تتسجّل بوحدها.',
            )}
          </p>
        </footer>
      </div>
    </div>
  );
}
