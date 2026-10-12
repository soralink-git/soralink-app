export function cropRect(
  width: number,
  height: number,
  ratio: number,
  zoom: number,
  x: number,
  y: number,
) {
  const z = Math.max(1, Math.min(4, zoom));
  const baseWidth = Math.min(width, height * ratio),
    baseHeight = baseWidth / ratio;
  const sw = baseWidth / z,
    sh = baseHeight / z;
  return {
    sx: ((width - sw) * (Math.max(-1, Math.min(1, x)) + 1)) / 2,
    sy: ((height - sh) * (Math.max(-1, Math.min(1, y)) + 1)) / 2,
    sw,
    sh,
  };
}
