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

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
const port = Number(process.env.API_PORT ?? 8787);

const app = express();
app.use(express.json({ limit: '5mb' }));

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
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
            temperature: 0.2,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      response.status(502).json({ error: `Gemini request failed: ${errorText}` });
      return;
    }

    const data = (await geminiResponse.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      response.status(502).json({ error: 'Gemini returned an empty response.' });
      return;
    }

    response.json(parseJsonResponse(text));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    response.status(500).json({ error: message });
  }
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'API route not found.' });
});

app.listen(port, () => {
  console.log(`Lucy CV analysis API listening on http://localhost:${port}`);
});
