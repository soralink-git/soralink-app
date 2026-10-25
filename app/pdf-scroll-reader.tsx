'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  pdfPageHeight,
  pdfPageTop,
  pdfAnchor,
  pdfAnchorTop,
  type PdfAnchor,
} from './lib/pdf-layout';
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import { bindPdfGestures } from './lib/pdf-gestures';
export default function PdfScrollReader({
  src,
  ar,
  initialPage,
  onPage,
}: {
  src: string;
  ar: boolean;
  initialPage: number;
  onPage: (n: number) => void;
}) {
  const stage = useRef<HTMLDivElement>(null),
    strip = useRef<HTMLDivElement>(null),
    loadedAt = useRef(false),
    frame = useRef(0),
    currentRef = useRef(initialPage),
    callback = useRef(onPage),
    pagesCount = useRef(1);
  callback.current = onPage;
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null),
    [failed, setFailed] = useState(false),
    [attempt, setAttempt] = useState(0),
    [width, setWidth] = useState(0),
    [zoom, setZoom] = useState(1),
    [page, setPage] = useState(initialPage),
    [ratios, setRatios] = useState<Record<number, number>>({});
  const layout = useRef({ width, zoom, ratios });
  const pendingAnchor = useRef<PdfAnchor | null>(null);
  const t = (fr: string, a: string) => (ar ? a : fr);
  const rememberPosition = () => {
    const el = stage.current;
    const previous = layout.current;
    if (!pendingAnchor.current && el && pdf && loadedAt.current && previous.width)
      pendingAnchor.current = pdfAnchor(
        el.scrollTop,
        pdf.numPages,
        previous.width,
        previous.zoom,
        previous.ratios,
      );
  };
  useLayoutEffect(() => {
    if (pendingAnchor.current && stage.current && layout.current.zoom === zoom)
      stage.current.scrollTop = pdfAnchorTop(pendingAnchor.current, width, zoom, ratios);
    pendingAnchor.current = null;
    layout.current = { width, zoom, ratios };
  }, [width, zoom, ratios]);
  useEffect(() => {
    let gone = false;
    let task: ReturnType<typeof import('pdfjs-dist').getDocument> | undefined;
    setFailed(false);
    setPdf(null);
    loadedAt.current = false;
    void (async () => {
      try {
        const lib = await import('pdfjs-dist');
        if (gone) return;
        lib.GlobalWorkerOptions.workerSrc = '/assets/pdfjs/pdf.worker.min.mjs';
        task = lib.getDocument({
          url: src,
          cMapUrl: '/assets/pdfjs/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/assets/pdfjs/standard_fonts/',
          wasmUrl: '/assets/pdfjs/wasm/',
          isEvalSupported: false,
          disableAutoFetch: true,
          disableStream: true,
        });
        const doc = await task.promise;
        if (!gone) {
          pagesCount.current = doc.numPages;
          setPdf(doc);
        }
      } catch {
        if (!gone) setFailed(true);
      }
    })();
    return () => {
      gone = true;
      void task?.destroy();
    };
  }, [src, attempt]);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const resize = new ResizeObserver(([entry]) => {
      const previous = layout.current;
      if (loadedAt.current && previous.width)
        pendingAnchor.current = pdfAnchor(
          el.scrollTop,
          pagesCount.current,
          previous.width,
          previous.zoom,
          previous.ratios,
        );
      setWidth(Math.max(1, entry.contentRect.width - 16));
    });
    resize.observe(el);
    return () => resize.disconnect();
  }, []);
  const height = (n: number) => pdfPageHeight(n, width, zoom, ratios);
  function scrollTo(n: number) {
    const el = stage.current;
    if (!el || !pdf) return;
    const target = Math.min(pdf.numPages, Math.max(1, n));
    el.scrollTop = pdfPageTop(target, width, zoom, ratios);
    currentRef.current = target;
    setPage(target);
    callback.current(target);
  }
  useEffect(() => {
    if (pdf && width && !loadedAt.current) {
      loadedAt.current = true;
      scrollTo(initialPage);
    }
  }, [pdf, width, initialPage]);
  useEffect(() => {
    if (!stage.current || !strip.current || !pdf || !width) return;
    return bindPdfGestures(stage.current, strip.current, zoom, setZoom, (delta) =>
      scrollTo(currentRef.current + (ar ? -delta : delta)),
    );
  }, [pdf, width, zoom, ratios, ar]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  function track() {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = stage.current;
      if (!el || !pdf) return;
      let y = 0,
        n = 1;
      while (
        n < pdf.numPages &&
        y + height(n) < el.scrollTop + Math.min(el.clientHeight * 0.25, 120)
      ) {
        y += height(n);
        n++;
      }
      currentRef.current = n;
      setPage(n);
      callback.current(n);
    });
  }
  const pages = pdf ? Array.from({ length: pdf.numPages }, (_, i) => i + 1) : [];
  return (
    <div className="pdf-continuous">
      <div className="pdf-catalogue-controls">
        <label>
          {t('Page', 'الصفحة')}{' '}
          <input
            aria-label={t('Aller à la page', 'الانتقال للصفحة')}
            type="number"
            min={1}
            max={pdf?.numPages || 1}
            value={page}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (n >= 1 && n <= (pdf?.numPages || 1)) {
                setPage(n);
                scrollTo(n);
              }
            }}
          />{' '}
          / {pdf?.numPages || '…'}
        </label>
        <span>{Math.round(zoom * 100)} %</span>
      </div>
      <p className="pdf-gesture-hint">
        {t(
          'Défilez verticalement. Pincez avec deux doigts ou touchez deux fois pour zoomer.',
          'جرّ لفوق ولتحت. كبّر بجوج صبيعات ولا بلمستين.',
        )}
      </p>
      <div
        className="pdf-continuous-stage pdf-touch-reader"
        ref={stage}
        dir="ltr"
        tabIndex={0}
        onScroll={track}
        aria-label={t('Lecture du document', 'قراءة الوثيقة')}
      >
        {!pdf && !failed && (
          <p role="status">{t('Chargement du document…', 'جاري تحميل الوثيقة…')}</p>
        )}
        {failed ? (
          <div role="alert">
            <p>{t('Impossible de lire ce PDF. Réessayez.', 'تعذرت قراءة الملف. عاود جرّب.')}</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)}>
              {t('Réessayer', 'إعادة المحاولة')}
            </button>
          </div>
        ) : (
          <div
            ref={strip}
            className="pdf-page-strip"
            style={{
              width: width * zoom,
              height: pages.reduce((total, n) => total + height(n), 0),
            }}
          >
            {pdf &&
              pages.map((n) => (
                <LazyPage
                  key={n}
                  pdf={pdf}
                  page={n}
                  width={width * zoom}
                  ratio={ratios[n] || 1.41421356}
                  gap={12 * zoom}
                  root={stage.current}
                  ar={ar}
                  onRatio={(ratio) => {
                    if (layout.current.ratios[n] === ratio) return;
                    rememberPosition();
                    setRatios((old) => (old[n] === ratio ? old : { ...old, [n]: ratio }));
                  }}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
function LazyPage({
  pdf,
  page,
  width,
  ratio,
  gap,
  root,
  ar,
  onRatio,
}: {
  pdf: PDFDocumentProxy;
  page: number;
  width: number;
  ratio: number;
  gap: number;
  root: HTMLElement | null;
  ar: boolean;
  onRatio: (n: number) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    [near, setNear] = useState(false),
    [failed, setFailed] = useState(false),
    cb = useRef(onRatio);
  cb.current = onRatio;
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => setNear(e.isIntersecting), {
      root,
      rootMargin: '200px',
    });
    observer.observe(host.current!);
    return () => observer.disconnect();
  }, [root]);
  useEffect(() => {
    if (!near || !width) return;
    let gone = false,
      render: RenderTask | undefined,
      sheet: PDFPageProxy | undefined;
    setFailed(false);
    void (async () => {
      try {
        sheet = await pdf.getPage(page);
        if (gone) {
          sheet.cleanup();
          return;
        }
        const base = sheet.getViewport({ scale: 1 });
        cb.current(base.height / base.width);
        const viewport = sheet.getViewport({ scale: width / base.width });
        const output = Math.min(
          window.devicePixelRatio || 1,
          2,
          Math.sqrt(6000000 / (viewport.width * viewport.height)),
        );
        const el = canvas.current!;
        el.width = Math.max(1, Math.floor(viewport.width * output));
        el.height = Math.max(1, Math.floor(viewport.height * output));
        render = sheet.render({ canvas: el, viewport, transform: [output, 0, 0, output, 0, 0] });
        await render.promise;
      } catch {
        if (!gone) setFailed(true);
      }
    })();
    return () => {
      gone = true;
      render?.cancel();
      sheet?.cleanup();
    };
  }, [near, pdf, page, width]);
  return (
    <div
      ref={host}
      className="pdf-lazy-page"
      style={{ aspectRatio: String(1 / ratio), marginBottom: gap }}
      data-page={page}
    >
      {near && !failed ? (
        <canvas ref={canvas} role="img" aria-label={ar ? `الصفحة ${page}` : `Page ${page}`} />
      ) : (
        <span>
          {failed
            ? ar
              ? 'تعذر تحميل الصفحة'
              : 'Impossible de charger cette page'
            : ar
              ? `الصفحة ${page}`
              : `Page ${page}`}
        </span>
      )}
    </div>
  );
}
