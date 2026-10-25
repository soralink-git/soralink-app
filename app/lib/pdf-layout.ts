export type PdfRatios = Record<number, number>;
export type PdfAnchor = { page: number; fraction: number };
export function pdfPageHeight(page: number, width: number, zoom: number, ratios: PdfRatios) {
  const ratio = ratios[page];
  return (
    Math.max(0, width) * zoom * (Number.isFinite(ratio) && ratio > 0 ? ratio : Math.SQRT2) +
    12 * zoom
  );
}
export function pdfPageTop(page: number, width: number, zoom: number, ratios: PdfRatios) {
  let top = 0;
  for (let n = 1; n < page; n++) top += pdfPageHeight(n, width, zoom, ratios);
  return top;
}
export function pdfAnchor(
  top: number,
  count: number,
  width: number,
  zoom: number,
  ratios: PdfRatios,
): PdfAnchor {
  let page = 1,
    offset = Math.max(0, top);
  while (page < count && offset >= pdfPageHeight(page, width, zoom, ratios)) {
    offset -= pdfPageHeight(page, width, zoom, ratios);
    page++;
  }
  const height = pdfPageHeight(page, width, zoom, ratios);
  return { page, fraction: Math.min(1, height > 0 ? offset / height : 0) };
}
export function pdfAnchorTop(anchor: PdfAnchor, width: number, zoom: number, ratios: PdfRatios) {
  return (
    pdfPageTop(anchor.page, width, zoom, ratios) +
    anchor.fraction * pdfPageHeight(anchor.page, width, zoom, ratios)
  );
}
