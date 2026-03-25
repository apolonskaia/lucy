import { CvAnalysis } from '../types';

interface AnalyzeCvMatchInput {
  jobTitle: string;
  company: string;
  cvText: string;
  jobDescription: string;
}

const parseResponsePayload = async (response: Response) => {
  const responseText = await response.text();

  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as CvAnalysis | { error?: string };
  } catch {
    if (!response.ok) {
      throw new Error(`CV analysis request failed with status ${response.status}.`);
    }

    throw new Error('The CV analysis service returned an invalid response.');
  }
};

const isCvAnalysis = (payload: CvAnalysis | { error?: string } | null): payload is CvAnalysis => {
  if (!payload || typeof payload !== 'object' || 'error' in payload) {
    return false;
  }

  const candidate = payload as Record<string, unknown>;

  return Boolean(
    typeof candidate.summary === 'string' &&
      typeof candidate.overallFit === 'string' &&
      typeof candidate.matchScore === 'number' &&
      Array.isArray(candidate.strengths) &&
      Array.isArray(candidate.missingKeywords) &&
      Array.isArray(candidate.suggestedChanges) &&
      Array.isArray(candidate.sectionSuggestions)
  );
};

export const analyzeCvMatch = async (input: AnalyzeCvMatchInput): Promise<CvAnalysis> => {
  const response = await fetch('/api/cv-analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    if (payload && 'error' in payload && payload.error) {
      throw new Error(payload.error);
    }

    throw new Error(
      response.status >= 500
        ? 'The CV analysis server failed. Check that `npm run dev:api` is running and the Gemini key is configured.'
        : 'CV analysis request failed.'
    );
  }

  if (!isCvAnalysis(payload)) {
    throw new Error('The CV analysis service returned an empty response.');
  }

  return payload;
};
