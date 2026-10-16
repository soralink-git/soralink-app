'use client';
import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

export function PhotoViewer({
  src,
  ar,
  onClose,
}: {
  src: string;
  ar: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [space, setSpace] = useState({ width: 0, height: 0 });
  const [failed, setFailed] = useState(false);
  const t = (fr: string, da: string) => (ar ? da : fr);
  useEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element.showModal();
    const observer = new ResizeObserver(([entry]) =>
      setSpace({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(stage.current!);
    return () => {
      observer.disconnect();
      element.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  const fit =
    natural.width && space.width
      ? Math.min(space.width / natural.width, space.height / natural.height, 1)
      : 1;
  return (
    <dialog
      ref={dialog}
      className="photo-viewer"
      aria-label={t('Aperçu de la photo', 'معاينة التصويرة')}
      dir={ar ? 'rtl' : 'ltr'}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="photo-viewer-toolbar">
        <button
          type="button"
          aria-label={t('Réduire', 'صغّر')}
          disabled={zoom <= 1}
          onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
        >
          <ZoomOut />
        </button>
        <span role="status">{Math.round(zoom * 100)} %</span>
        <button
          type="button"
          aria-label={t('Agrandir', 'كبّر')}
          disabled={zoom >= 4 || failed}
          onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
        >
          <ZoomIn />
        </button>
        <button
          type="button"
          className="photo-viewer-close"
          aria-label={t('Fermer', 'سدّ')}
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      <div ref={stage} className="photo-viewer-stage" dir="ltr">
        {failed ? (
          <p role="alert">
            {t('Cette photo ne peut pas être chargée.', 'ما قدرناش نحمّلو هاد التصويرة.')}
          </p>
        ) : (
          <div className="photo-viewer-canvas">
            <img
              src={src}
              alt={t('Réalisation agrandie', 'الخدمة مكبّرة')}
              draggable={false}
              onError={() => setFailed(true)}
              onLoad={(e) =>
                setNatural({
                  width: e.currentTarget.naturalWidth,
                  height: e.currentTarget.naturalHeight,
                })
              }
              style={
                natural.width && space.width
                  ? { width: natural.width * fit * zoom, height: natural.height * fit * zoom }
                  : undefined
              }
            />
          </div>
        )}
      </div>
      <p className="photo-viewer-hint">
        {t(
          'Agrandissez avec +, puis faites défiler pour voir les détails.',
          'كبّر بعلامة + وحرّك التصويرة باش تشوف التفاصيل.',
        )}
      </p>
    </dialog>
  );
}

export default function PhotoGallery({ photos, ar }: { photos: string[]; ar: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <>
      <div className="gallery photo-gallery">
        {photos.map((src, index) => (
          <button
            type="button"
            key={src}
            aria-label={ar ? `كبّر التصويرة ${index + 1}` : `Agrandir la photo ${index + 1}`}
            onClick={() => setSelected(src)}
          >
            <img src={src} alt={ar ? 'خدمة منجزة' : 'Réalisation'} loading="lazy" />
          </button>
        ))}
      </div>
      {selected && photos.includes(selected) && (
        <PhotoViewer key={selected} src={selected} ar={ar} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
