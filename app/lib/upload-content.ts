import { ApiInputError } from './api-validation';
export async function checkFileContent(
  file: File,
  maxPages: number,
): Promise<Record<string, string>> {
  const bytes = new Uint8Array(await file.slice(0, 32).arrayBuffer());
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  const starts = (values: number[]) => values.every((v, i) => bytes[i] === v);
  const valid =
    file.type === 'image/jpeg'
      ? starts([255, 216, 255])
      : file.type === 'image/png'
        ? starts([137, 80, 78, 71, 13, 10, 26, 10])
        : file.type === 'image/webp'
          ? ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP'
          : file.type === 'application/pdf'
            ? ascii(0, 5) === '%PDF-'
            : file.type === 'video/webm'
              ? starts([26, 69, 223, 163])
              : ['video/mp4', 'video/quicktime'].includes(file.type)
                ? ascii(4, 8) === 'ftyp' ||
                  (file.type === 'video/quicktime' &&
                    ['moov', 'mdat', 'wide'].includes(ascii(4, 8)))
                : false;
  if (!valid) throw new ApiInputError('Le contenu du fichier ne correspond pas à son format.');
  if (file.type !== 'application/pdf') return {};
  try {
    const { PDFDocument } = await import('pdf-lib');
    const doc = await PDFDocument.load(await file.arrayBuffer(), {
      updateMetadata: false,
      throwOnInvalidObject: true,
    });
    const pages = doc.getPageCount();
    if (pages < 1 || pages > maxPages) throw Error();
    return { pages: String(pages) };
  } catch {
    throw new ApiInputError(
      `Choisissez un PDF lisible, sans mot de passe, de ${maxPages} pages maximum.`,
    );
  }
}
