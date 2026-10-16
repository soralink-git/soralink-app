'use client';
import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

export default function PdfCatalogue({ src, ar }: { src: string; ar: boolean }) {
  return <PdfReader key={src} src={src} ar={ar} />;
}

function PdfReader({ src, ar }: { src: string; ar: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const t = (fr: string, da: string) => (ar ? da : fr);
  useEffect(() => {
    const element = host.current!;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    const size = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    size.observe(element);
    return () => {
      observer.disconnect();
      size.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!visible) return;
    let disposed = false;
    let task: ReturnType<typeof import('pdfjs-dist').getDocument> | undefined;
    setFailed(false);
    setBusy(true);
    setPdf(null);
    setPage(1);
    void (async () => {
      try {
        const lib = await import('pdfjs-dist');
        if (disposed) return;
        lib.GlobalWorkerOptions.workerSrc = '/assets/pdfjs/pdf.worker.min.mjs';
        task = lib.getDocument({
          url: src,
          cMapUrl: '/assets/pdfjs/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/assets/pdfjs/standard_fonts/',
          wasmUrl: '/assets/pdfjs/wasm/',
          isEvalSupported: false,
        });
        const document = await task.promise;
        if (!disposed) setPdf(document);
      } catch {
        if (!disposed) {
          setFailed(true);
          setBusy(false);
        }
      }
    })();
    return () => {
      disposed = true;
      void task?.destroy();
    };
  }, [src, visible, attempt]);
  useEffect(() => {
    if (!pdf || !width) return;
    let disposed = false;
    let rendering: RenderTask | undefined;
    setBusy(true);
    void (async () => {
      try {
        const sheet = await pdf.getPage(page);
        if (disposed) return;
        const base = sheet.getViewport({ scale: 1 });
        const cssScale = (Math.max(1, width - 16) / base.width) * zoom;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = sheet.getViewport({ scale: cssScale });
        const element = canvas.current!;
        // Bound memory use on phones, including large-format catalogues.
        const output = Math.min(ratio, Math.sqrt(8000000 / (viewport.width * viewport.height)));
        element.width = Math.max(1, Math.floor(viewport.width * output));
        element.height = Math.max(1, Math.floor(viewport.height * output));
        element.style.width = `${viewport.width}px`;
        element.style.height = `${viewport.height}px`;
        rendering = sheet.render({
          canvas: element,
          viewport,
          transform: [output, 0, 0, output, 0, 0],
        });
        await rendering.promise;
        if (!disposed) setBusy(false);
      } catch {
        if (!disposed) {
          setFailed(true);
          setBusy(false);
        }
      }
    })();
    return () => {
      disposed = true;
      rendering?.cancel();
    };
  }, [pdf, page, zoom, width]);
  return (
    <div className="pdf-catalogue" ref={host} dir={ar ? 'rtl' : 'ltr'}>
      <div
        className="pdf-catalogue-controls"
        aria-label={t('Lecture du catalogue', 'قراية الكاتالوگ')}
      >
        <button
          type="button"
          disabled={!pdf || busy || page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          {t('Précédente', 'السابقة')}
        </button>
        <span aria-live="polite">
          {t('Page', 'الصفحة')} {page}
          {pdf ? ` / ${pdf.numPages}` : ''}
        </span>
        <button
          type="button"
          disabled={!pdf || busy || page >= pdf.numPages}
          onClick={() => setPage((p) => p + 1)}
        >
          {t('Suivante', 'التالية')}
        </button>
        <button
          type="button"
          aria-label={t('Réduire', 'صغّر')}
          disabled={!pdf || busy || zoom <= 1}
          onClick={() => setZoom((z) => z - 0.5)}
        >
          −
        </button>
        <span>{Math.round(zoom * 100)} %</span>
        <button
          type="button"
          aria-label={t('Agrandir', 'كبّر')}
          disabled={!pdf || busy || zoom >= 3}
          onClick={() => setZoom((z) => z + 0.5)}
        >
          +
        </button>
      </div>
      {busy && !failed && (
        <p role="status">{t('Chargement du catalogue…', 'الكاتالوگ كيتحمّل…')}</p>
      )}
      {failed ? (
        <div role="alert">
          <p>
            {t(
              'Impossible de lire ce PDF. Vérifiez le fichier ou réessayez.',
              'ما قدرناش نقراو هاد الملف. تأكد من الملف ولا عاود جرّب.',
            )}
          </p>
          <button type="button" onClick={() => setAttempt((a) => a + 1)}>
            {t('Réessayer', 'عاود جرّب')}
          </button>
        </div>
      ) : (
        <div className="pdf-catalogue-page" aria-busy={busy} dir="ltr">
          <canvas
            ref={canvas}
            role="img"
            aria-label={t(`Catalogue, page ${page}`, `الكاتالوگ، الصفحة ${page}`)}
          />
        </div>
      )}
    </div>
  );
}
