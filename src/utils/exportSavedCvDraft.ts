import { SavedCvDraft } from '../types';
import { cvPageMarginsTwip, CV_SUMMARY_HEADING, extractCvHeaderContact, normalizeCvSectionTitle } from './cvDocumentFormat';

interface ExportSavedCvDraftInput {
  draft: SavedCvDraft;
  jobTitle: string;
  company: string;
  cvSources: Array<{ id: string; name: string; text: string }>;
}

const sanitizeFileName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'cv-draft';

export const exportSavedCvDraft = async ({ draft, jobTitle, company, cvSources }: ExportSavedCvDraftInput) => {
  const { Packer, Paragraph, TextRun, Document } = await import('docx');
  const cvHeaderContact = extractCvHeaderContact(cvSources, draft.sourceCvIds);
  const contactLine = [cvHeaderContact.phone, cvHeaderContact.linkedin, cvHeaderContact.github].filter(Boolean).join(' | ');

  const paragraphs = [
    new Paragraph({
      children: [
        new TextRun({
          text: cvHeaderContact.name,
          bold: true,
          size: 32,
          font: 'Arial',
          color: '111827',
        }),
      ],
      spacing: { after: contactLine ? 90 : 160 },
    }),
    ...(contactLine
      ? [
          new Paragraph({
            children: [new TextRun({ text: contactLine, font: 'Arial', size: 19, color: '374151' })],
            spacing: { after: 160 },
          }),
        ]
      : []),
    new Paragraph({
      children: [
        new TextRun({
          text: CV_SUMMARY_HEADING,
          allCaps: true,
          bold: true,
          size: 22,
          font: 'Arial',
          color: '1F2937',
        }),
      ],
      border: {
        bottom: {
          color: '1F2937',
          space: 1,
          style: 'single',
          size: 6,
        },
      },
      spacing: { before: 60, after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: draft.summary, font: 'Arial', size: 22, color: '111827' })],
      spacing: { after: 240 },
    }),
  ];

  draft.sections.forEach((section) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: normalizeCvSectionTitle(section.title),
            allCaps: true,
            bold: true,
            size: 22,
            font: 'Arial',
            color: '1F2937',
          }),
        ],
        border: {
          bottom: {
            color: '1F2937',
            space: 1,
            style: 'single',
            size: 6,
          },
        },
        spacing: { before: 120, after: 100 },
      })
    );

    section.lines.forEach((line) => {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line.text, font: 'Arial', size: 22, color: '111827' })],
          bullet: { level: 0 },
          indent: { left: 360, hanging: 180 },
          spacing: { after: 80, line: 320 },
        })
      );
    });

    paragraphs.push(new Paragraph({ text: '', spacing: { after: 60 } }));
  });

  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: cvPageMarginsTwip,
          },
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(document);
  const objectUrl = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = `${sanitizeFileName(jobTitle)}-${sanitizeFileName(company)}-${sanitizeFileName(draft.name)}.docx`;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};