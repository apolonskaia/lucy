import dotenv from 'dotenv';
import express from 'express';

dotenv.config({ path: '.env.local' });
dotenv.config();

interface CvAnalysisRequestBody {
  jobTitle: string;
  company: string;
  cvText: string;
  jobDescription: string;
}

interface CvBuilderRequestBody {
  jobTitle: string;
  company: string;
  jobDescription: string;
  cvSources: Array<{
    id: string;
    name: string;
    text: string;
  }>;
}

interface CvAnalysisResponseBody {
  summary: string;
  overallFit: string;
  matchScore: number;
  strengths: string[];
  missingKeywords: string[];
  suggestedChanges: string[];
  sectionSuggestions: Array<{
    section: string;
    rationale: string;
    suggestedRewrite: string;
  }>;
}

interface CvBuilderResponseBody {
  summary: string;
  matchScore: number;
  sourceCvIds: string[];
  notes: string[];
  sections: Array<{
    id: string;
    title: string;
    lines: Array<{
      id: string;
      text: string;
      status: 'accepted' | 'suggested';
      sourceCvIds: string[];
      rationale: string;
    }>;
  }>;
}

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
const fallbackModels = (process.env.GEMINI_FALLBACK_MODELS ?? '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .filter((entry, index, allEntries) => allEntries.indexOf(entry) === index && entry !== model);
const port = Number(process.env.API_PORT ?? 8787);

const app = express();
app.use(express.json({ limit: '5mb' }));

const retryableGeminiStatuses = new Set([429, 500, 503]);

const delay = (durationMs: number) => new Promise((resolve) => setTimeout(resolve, durationMs));

const requestGeminiText = async (prompt: string, temperature: number) => {
  const candidateModels = [model, ...fallbackModels];
  let lastErrorText = 'Unknown Gemini error.';
  let lastStatus = 502;

  for (let modelIndex = 0; modelIndex < candidateModels.length; modelIndex += 1) {
    const currentModel = candidateModels[modelIndex];

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature,
            },
          }),
        }
      );

      if (geminiResponse.ok) {
        const data = (await geminiResponse.json()) as {
          candidates?: Array<{
            content?: {
              parts?: Array<{ text?: string }>;
            };
          }>;
        };

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          throw new Error('Gemini returned an empty response.');
        }

        return text;
      }

      lastStatus = geminiResponse.status;
      lastErrorText = await geminiResponse.text();

      if (!retryableGeminiStatuses.has(geminiResponse.status)) {
        break;
      }

      const isLastAttemptForModel = attempt === 2;
      const hasNextModel = modelIndex < candidateModels.length - 1;

      if (!isLastAttemptForModel) {
        await delay(400 * (attempt + 1));
        continue;
      }

      if (hasNextModel) {
        break;
      }
    }
  }

  const demandSpikeMessage =
    lastStatus === 503 || lastStatus === 429
      ? 'Gemini is temporarily overloaded. Please try again in a minute.'
      : null;

  const invalidModelMessage =
    lastStatus === 404 && /not found|not supported for generatecontent/i.test(lastErrorText)
      ? 'Configured Gemini model is unavailable for this API version. Check GEMINI_MODEL and GEMINI_FALLBACK_MODELS.'
      : null;

  const error = new Error(
    demandSpikeMessage
      ? `${demandSpikeMessage} Provider response: ${lastErrorText}`
      : invalidModelMessage
        ? `${invalidModelMessage} Provider response: ${lastErrorText}`
        : `Gemini request failed: ${lastErrorText}`
  );
  (error as Error & { status?: number }).status = lastStatus === 429 || lastStatus === 503 ? 503 : 502;
  throw error;
};

const parseJsonResponse = (text: string): CvAnalysisResponseBody => {
  const normalizedText = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(normalizedText) as Partial<CvAnalysisResponseBody>;

  return {
    summary: parsed.summary ?? 'No summary returned.',
    overallFit: parsed.overallFit ?? 'Unknown',
    matchScore: Math.max(0, Math.min(100, Number(parsed.matchScore ?? 0))),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
    missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords.map(String) : [],
    suggestedChanges: Array.isArray(parsed.suggestedChanges) ? parsed.suggestedChanges.map(String) : [],
    sectionSuggestions: Array.isArray(parsed.sectionSuggestions)
      ? parsed.sectionSuggestions.map((entry) => ({
          section: String(entry?.section ?? 'Unknown'),
          rationale: String(entry?.rationale ?? ''),
          suggestedRewrite: String(entry?.suggestedRewrite ?? ''),
        }))
      : [],
  };
};

const parseBuilderJsonResponse = (text: string): CvBuilderResponseBody => {
  const normalizedText = text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(normalizedText) as Partial<CvBuilderResponseBody>;

  return {
    summary: parsed.summary ?? 'Tailored CV draft created from saved CVs.',
    matchScore: Math.max(0, Math.min(100, Number(parsed.matchScore ?? 0))),
    sourceCvIds: Array.isArray(parsed.sourceCvIds) ? parsed.sourceCvIds.map(String) : [],
    notes: Array.isArray(parsed.notes) ? parsed.notes.map(String) : [],
    sections: Array.isArray(parsed.sections)
      ? parsed.sections.map((section, sectionIndex) => ({
          id: String(section?.id ?? `section-${sectionIndex + 1}`),
          title: String(section?.title ?? `Section ${sectionIndex + 1}`),
          lines: Array.isArray(section?.lines)
            ? section.lines.map((line, lineIndex) => ({
                id: String(line?.id ?? `section-${sectionIndex + 1}-line-${lineIndex + 1}`),
                text: String(line?.text ?? ''),
                status: line?.status === 'accepted' ? 'accepted' : 'suggested',
                sourceCvIds: Array.isArray(line?.sourceCvIds) ? line.sourceCvIds.map(String) : [],
                rationale: String(line?.rationale ?? ''),
              }))
            : [],
        }))
      : [],
  };
};

app.get('/api/health', (_request, response) => {
  response.json({ ok: true });
});

app.post('/api/cv-analysis', async (request, response) => {
  if (!apiKey) {
    response.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  const { jobTitle, company, cvText, jobDescription } = request.body as CvAnalysisRequestBody;

  if (!jobTitle?.trim() || !company?.trim() || !cvText?.trim() || !jobDescription?.trim()) {
    response.status(400).json({ error: 'jobTitle, company, cvText, and jobDescription are required.' });
    return;
  }

  const prompt = [
    'You are an expert technical recruiter and resume editor.',
    'Analyze the candidate CV against the job description and return ONLY valid JSON.',
    'Do not wrap the JSON in markdown fences.',
    'Use this exact schema:',
    JSON.stringify(
      {
        summary: 'string',
        overallFit: 'string',
        matchScore: 0,
        strengths: ['string'],
        missingKeywords: ['string'],
        suggestedChanges: ['string'],
        sectionSuggestions: [
          {
            section: 'string',
            rationale: 'string',
            suggestedRewrite: 'string',
          },
        ],
      },
      null,
      2
    ),
    `Job title: ${jobTitle}`,
    `Company: ${company}`,
    'Job description:',
    jobDescription,
    'CV text:',
    cvText,
  ].join('\n\n');

  try {
    const text = await requestGeminiText(prompt, 0.2);
    response.json(parseJsonResponse(text));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    const status = typeof error === 'object' && error && 'status' in error && typeof error.status === 'number' ? error.status : 500;
    response.status(status).json({ error: message });
  }
});

app.post('/api/cv-builder', async (request, response) => {
  if (!apiKey) {
    response.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    return;
  }

  const { jobTitle, company, jobDescription, cvSources } = request.body as CvBuilderRequestBody;

  const validCvSources = Array.isArray(cvSources)
    ? cvSources.filter((source) => source?.id?.trim() && source?.name?.trim() && source?.text?.trim())
    : [];

  if (!jobTitle?.trim() || !company?.trim() || !jobDescription?.trim() || validCvSources.length === 0) {
    response.status(400).json({ error: 'jobTitle, company, jobDescription, and at least one saved CV are required.' });
    return;
  }

  const prompt = [
    'You are an expert recruiter and resume writer building a tailored CV.',
    'Use ALL provided CVs as source material.',
    'Return ONLY valid JSON and do not use markdown fences.',
    'Build a concise, professional CV draft with section titles and bullet lines.',
    'Mark a line as suggested when it is newly synthesized or materially rewritten to fit the job description.',
    'Mark a line as accepted only when it can be used essentially as-is from the existing CV content.',
    'Every line must include sourceCvIds and rationale.',
    'Use this exact schema:',
    JSON.stringify(
      {
        summary: 'string',
        matchScore: 0,
        sourceCvIds: ['cv-id'],
        notes: ['string'],
        sections: [
          {
            id: 'summary',
            title: 'Professional Summary',
            lines: [
              {
                id: 'line-1',
                text: 'string',
                status: 'suggested',
                sourceCvIds: ['cv-id'],
                rationale: 'string',
              },
            ],
          },
        ],
      },
      null,
      2
    ),
    `Job title: ${jobTitle}`,
    `Company: ${company}`,
    'Job description:',
    jobDescription,
    'Available CV sources:',
    validCvSources
      .map((source, index) => [`CV ${index + 1}`, `id: ${source.id}`, `name: ${source.name}`, source.text].join('\n'))
      .join('\n\n'),
  ].join('\n\n');

  try {
    const text = await requestGeminiText(prompt, 0.25);
    response.json(parseBuilderJsonResponse(text));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    const status = typeof error === 'object' && error && 'status' in error && typeof error.status === 'number' ? error.status : 500;
    response.status(status).json({ error: message });
  }
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found.' });
});

app.listen(port, () => {
  console.log(`Lucy CV analysis API listening on http://localhost:${port}`);
});
