import { CvBuilderDraft, CvSource } from '../types';

interface BuildCvDraftInput {
  jobTitle: string;
  company: string;
  jobDescription: string;
  cvSources: CvSource[];
}

const parseResponsePayload = async (response: Response) => {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as CvBuilderDraft | { error?: string };
  } catch {
    if (!response.ok) {
      throw new Error(`CV builder request failed with status ${response.status}.`);
    }

    throw new Error('The CV builder service returned an invalid response.');
  }
};

const isCvBuilderDraft = (payload: CvBuilderDraft | { error?: string } | null): payload is CvBuilderDraft => {
  if (!payload || typeof payload !== 'object' || 'error' in payload) {
    return false;
  }

  const candidate = payload as Record<string, unknown>;

  return Boolean(
    typeof candidate.summary === 'string' &&
      typeof candidate.matchScore === 'number' &&
      Array.isArray(candidate.sourceCvIds) &&
      Array.isArray(candidate.notes) &&
      Array.isArray(candidate.sections)
  );
};

export const buildCvDraft = async (input: BuildCvDraftInput): Promise<CvBuilderDraft> => {
  const response = await fetch('/api/cv-builder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jobTitle: input.jobTitle,
      company: input.company,
      jobDescription: input.jobDescription,
      cvSources: input.cvSources.map((source) => ({
        id: source.id,
        name: source.name,
        text: source.text,
      })),
    }),
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    if (payload && 'error' in payload && payload.error) {
      throw new Error(payload.error);
    }

    throw new Error(
      response.status >= 500
        ? 'The CV builder server failed. Check that `npm run dev:api` is running and the Gemini key is configured.'
        : 'CV builder request failed.'
    );
  }

  if (!isCvBuilderDraft(payload)) {
    throw new Error('The CV builder service returned an empty response.');
  }

  return payload;
};