type Point = { x: number; y: number };
export const limitPdfZoom = (zoom: number) => Math.min(4, Math.max(1, zoom));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Transform the existing canvas while fingers move; redraw sharply once released.
export function bindPdfGestures(
  stage: HTMLElement,
  canvas: HTMLCanvasElement,
  zoom: number,
  commit: (zoom: number) => void,
  turnPage: (direction: -1 | 1) => void = () => {},
) {
  const points = new Map<number, Point>();
  let shown = zoom;
  let moved = false;
  let pinched = false;
  let lastTap = 0;
  let start: Point | null = null;
  let pinch: { distance: number; zoom: number } | null = null;
  const baseWidth = parseFloat(canvas.style.width) / zoom;
  const baseHeight = parseFloat(canvas.style.height) / zoom;
  const local = (event: PointerEvent) => {
    const rect = stage.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const scale = (next: number, previousCenter: Point, center = previousCenter) => {
    next = limitPdfZoom(next);
    const ratio = next / shown;
    const left = (stage.scrollLeft + previousCenter.x - canvas.offsetLeft) * ratio;
    const top = (stage.scrollTop + previousCenter.y - canvas.offsetTop) * ratio;
    canvas.style.width = `${baseWidth * next}px`;
    canvas.style.height = `${baseHeight * next}px`;
    stage.scrollLeft = left + canvas.offsetLeft - center.x;
    stage.scrollTop = top + canvas.offsetTop - center.y;
    shown = next;
  };
  let center: Point | null = null;
  const down = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (points.size >= 2) return;
    points.set(event.pointerId, local(event));
    stage.setPointerCapture(event.pointerId);
    if (points.size === 1) {
      start = local(event);
      moved = false;
      pinched = false;
    }
    if (points.size === 2) {
      const [a, b] = [...points.values()];
      pinched = true;
      pinch = { distance: Math.max(distance(a, b), 1), zoom: shown };
      center = midpoint(a, b);
      moved = true;
    }
  };
  const move = (event: PointerEvent) => {
    const previous = points.get(event.pointerId);
    if (!previous) return;
    const next = local(event);
    points.set(event.pointerId, next);
    if (points.size >= 2 && pinch && center) {
      const [a, b] = [...points.values()];
      const nextCenter = midpoint(a, b);
      scale((pinch.zoom * distance(a, b)) / pinch.distance, center, nextCenter);
      center = nextCenter;
    } else if (points.size === 1) {
      if (start && distance(start, next) > 6) moved = true;
      stage.scrollLeft -= next.x - previous.x;
      stage.scrollTop -= next.y - previous.y;
    }
    event.preventDefault();
  };
  const end = (event: PointerEvent) => {
    if (!points.has(event.pointerId)) return;
    const point = points.get(event.pointerId)!;
    points.delete(event.pointerId);
    pinch = null;
    center = null;
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    if (points.size === 0) {
      if (!pinched && start && shown <= 1.01 && event.type !== 'pointercancel') {
        const dx = point.x - start.x;
        const dy = point.y - start.y;
        if (Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5) turnPage(dx < 0 ? 1 : -1);
      }

      if (!moved && event.type !== 'pointercancel') {
        const now = Date.now();
        if (now - lastTap < 300) {
          scale(shown > 1 ? 1 : 2, point);
          lastTap = 0;
        } else lastTap = now;
      }
      commit(shown);
    }
  };
  const key = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      turnPage(event.key === 'ArrowRight' ? 1 : -1);
    }

    if (['+', '=', '-', '0'].includes(event.key)) {
      event.preventDefault();
      scale(event.key === '0' ? 1 : shown + (event.key === '-' ? -0.5 : 0.5), {
        x: stage.clientWidth / 2,
        y: stage.clientHeight / 2,
      });
      commit(shown);
    }
  };
  stage.addEventListener('pointerdown', down);
  stage.addEventListener('pointermove', move);
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('keydown', key);
  return () => {
    for (const id of points.keys())
      if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id);
    stage.removeEventListener('pointerdown', down);
    stage.removeEventListener('pointermove', move);
    stage.removeEventListener('pointerup', end);
    stage.removeEventListener('pointercancel', end);
    stage.removeEventListener('keydown', key);
  };
}
