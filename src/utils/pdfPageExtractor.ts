import { BookPreviewPage } from '../types';
import { toBanglaDigits } from './bookPreviewHelpers';

/**
 * Renders the first `maxPages` pages of an uploaded PDF file into compressed
 * JPEG data URLs suitable for Firestore storage and the interactive Book Page Reader.
 */
export async function extractPdfPreviewPages(
  file: File,
  maxPages: number = 5,
  maxWidth: number = 850,
  quality: number = 0.8
): Promise<BookPreviewPage[]> {
  const pdfjsLib = await import('pdfjs-dist');

  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    // Fallback if worker URL resolution differs
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;

  const numPagesToExtract = Math.min(pdfDocument.numPages, Math.max(1, maxPages));
  const extractedPages: BookPreviewPage[] = [];

  for (let pageNum = 1; pageNum <= numPagesToExtract; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = Math.min(2, maxWidth / Math.max(1, baseViewport.width));
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(viewport.width));
    canvas.height = Math.max(1, Math.round(viewport.height));

    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    } as any).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    extractedPages.push({
      id: `pdf-page-${Date.now()}-${pageNum}`,
      pageNumber: pageNum,
      title: `পৃষ্ঠা ${toBanglaDigits(pageNum)} (PDF প্রিভিউ)`,
      imageUrl: dataUrl,
    });
  }

  return extractedPages;
}
