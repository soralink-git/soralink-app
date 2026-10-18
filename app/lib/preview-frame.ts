export type PreviewFrame = { top: number; left: number; width: number; maxHeight: number };
// Geometry is relative to the window, independently of the form's scroll container.
export function previewFrame(
  rail: { top: number; left: number; width: number },
  viewport: { width: number; height: number; offsetTop?: number },
): PreviewFrame | null {
  if (
    ![
      rail.top,
      rail.left,
      rail.width,
      viewport.width,
      viewport.height,
      viewport.offsetTop ?? 0,
    ].every(Number.isFinite) ||
    rail.width <= 0 ||
    viewport.height <= 0
  )
    return null;
  const compact = viewport.width <= 1100;
  const gap = compact ? 8 : 16;
  const top = Math.max((viewport.offsetTop || 0) + gap, rail.top);
  const room = (viewport.offsetTop || 0) + viewport.height - top - gap;
  if (room <= 0) return null;
  return {
    top,
    left: rail.left,
    width: rail.width,
    maxHeight: compact ? Math.min(room, viewport.height * 0.38) : room,
  };
}
