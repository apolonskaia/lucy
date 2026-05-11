export const CV_SUMMARY_HEADING = 'Professional Summary';

export const cvPageMarginsTwip = {
  top: 936,
  right: 936,
  bottom: 936,
  left: 936,
};

interface CvSourceLike {
  id: string;
  name: string;
  text: string;
}

export interface CvHeaderContact {
  name: string;
  phone: string;
  linkedin: string;
  github: string;
}

const phonePattern = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{3,4}(?:[\s.-]?\d{2,4})?/;
const linkedInPattern = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[A-Z0-9_\-/%+.]+/i;
const githubPattern = /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Z0-9_\-.]+/i;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

const normalizeUrl = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
};

export const normalizeCvSectionTitle = (title: string) => title.trim().toUpperCase();

const sanitizeNameFallback = (value: string) =>
  value
    .replace(/\.[^.]+$/, '')
    .replace(/^cv[-_\s]*/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const deriveNameFromText = (text: string, fallbackName: string) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12);

  const candidate = lines.find((line) => {
    if (line.length < 4 || line.length > 60) {
      return false;
    }

    if (phonePattern.test(line) || linkedInPattern.test(line) || githubPattern.test(line) || emailPattern.test(line)) {
      return false;
    }

    return /^[A-Za-z][A-Za-z .'-]+$/.test(line);
  });

  return candidate ?? (sanitizeNameFallback(fallbackName) || 'Applicant Name');
};

const extractMatch = (pattern: RegExp, text: string) => pattern.exec(text)?.[0]?.trim() ?? '';

export const extractCvHeaderContact = (
  cvSources: CvSourceLike[],
  preferredSourceIds: string[] = []
): CvHeaderContact => {
  const preferredIdSet = new Set(preferredSourceIds);
  const prioritizedSources = [
    ...cvSources.filter((source) => preferredIdSet.has(source.id)),
    ...cvSources.filter((source) => !preferredIdSet.has(source.id)),
  ];
  const primarySource = prioritizedSources.find((source) => source.text.trim()) ?? prioritizedSources[0];
  const combinedText = prioritizedSources.map((source) => source.text).join('\n');

  return {
    name: primarySource ? deriveNameFromText(primarySource.text, primarySource.name) : 'Applicant Name',
    phone: extractMatch(phonePattern, combinedText),
    linkedin: normalizeUrl(extractMatch(linkedInPattern, combinedText)),
    github: normalizeUrl(extractMatch(githubPattern, combinedText)),
  };
};