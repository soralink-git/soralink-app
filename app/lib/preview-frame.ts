export type PreviewFrame = { top: number; left: number; width: number; maxHeight: number };
// Geometry is relative to the window, independently of the form's scroll container.
export function previewFrame(
  rail: { top: number; left: number; width: number },
  viewport: { width: number; height: number; offsetTop?: number; minTop?: number },
): PreviewFrame | null {
  if (
    ![
      rail.top,
      rail.left,
      rail.width,
      viewport.width,
      viewport.height,
      viewport.offsetTop ?? 0,
      viewport.minTop ?? 0,
    ].every(Number.isFinite) ||
    rail.width <= 0 ||
    viewport.height <= 0
  )
    return null;
  // Compact screens use a collapsible preview in document flow, never a fixed overlay.
  if (viewport.width <= 1100) return null;
  const gap = 16;
  const top = Math.max((viewport.offsetTop || 0) + gap, viewport.minTop || 0, rail.top);
  const room = (viewport.offsetTop || 0) + viewport.height - top - gap;
  if (room <= 0) return null;
  return {
    top,
    left: rail.left,
    width: rail.width,
    maxHeight: room,
  };
}
