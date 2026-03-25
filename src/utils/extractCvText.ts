import mammoth from 'mammoth';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorker;

const extractPdfText = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  const pageTexts = await Promise.all(
    Array.from({ length: pdf.numPages }, async (_entry, index) => {
      const page = await pdf.getPage(index + 1);
      const content = await page.getTextContent();
      return content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();
    })
  );

  return pageTexts.filter(Boolean).join('\n\n');
};

const extractDocxText = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
};

export const extractCvText = async (file: File) => {
  const fileName = file.name.toLowerCase();

  if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
    return extractPdfText(file);
  }

  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    return extractDocxText(file);
  }

  if (file.type.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
    return (await file.text()).trim();
  }

  throw new Error('Unsupported CV format. Please upload a PDF, DOCX, TXT, or Markdown file.');
};
