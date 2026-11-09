export function drawLogoBadge(
  canvas: HTMLCanvasElement,
  picture: HTMLImageElement | null,
  isBrandIcon = false,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const area = Math.round(canvas.width * 0.22);
  const radius = Math.round(area * 0.24);
  const x = Math.round((canvas.width - area) / 2);
  const y = Math.round((canvas.height - area) / 2);

  // 1. White rounded container
  ctx.save();
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, area, area, radius);
  } else {
    ctx.rect(x, y, area, area);
  }
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = Math.round(canvas.width * 0.015);
  ctx.shadowOffsetY = Math.round(canvas.width * 0.005);
  ctx.fill();
  ctx.restore();

  // 2. Subtle crisp border
  ctx.save();
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, area, area, radius);
  } else {
    ctx.rect(x, y, area, area);
  }
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = Math.max(1, Math.round(canvas.width * 0.003));
  ctx.stroke();
  ctx.restore();

  // 3. Draw image or brand emblem
  if (picture) {
    const padding = Math.round(area * 0.12);
    const maxW = area - padding * 2;
    const maxH = area - padding * 2;
    const scale = Math.min(maxW / picture.naturalWidth, maxH / picture.naturalHeight);
    const width = picture.naturalWidth * scale;
    const height = picture.naturalHeight * scale;
    const imgX = x + (area - width) / 2;
    const imgY = y + (area - height) / 2;

    ctx.save();
    ctx.beginPath();
    const clipRadius = Math.max(0, radius - padding / 2);
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x + padding / 2, y + padding / 2, area - padding, area - padding, clipRadius);
      ctx.clip();
    }
    ctx.drawImage(picture, imgX, imgY, width, height);
    ctx.restore();
  } else if (isBrandIcon) {
    // SoraLink orange icon emblem
    const cx = x + area / 2;
    const cy = y + area / 2;
    const r = area * 0.28;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ff9125';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.44, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
}
