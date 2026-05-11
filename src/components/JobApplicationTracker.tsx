import { ArrowDown, ArrowUp, Download, ExternalLink, LoaderCircle, Plus, Save, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { CvAnalysis, CvBuilderDraft, CvBuilderLine, CvBuilderSection, CvSource, JobApplication, JobApplicationStatus, JobApplicationType, JobStrategyNote, SavedCvDraft } from '../types';
import JobStrategyNotes from './JobStrategyNotes';
import { exportSavedCvDraft } from '../utils/exportSavedCvDraft';
import CvDraftEditor from './CvDraftEditor';

type JobTrackerTab = 'applications' | 'cv-drafts';

const typeOptions: Array<{ value: JobApplicationType; label: string }> = [
  { value: 'tech', label: 'Tech' },
  { value: 'biotech', label: 'Biotech' },
];

const statusOptions: Array<{ value: JobApplicationStatus; label: string }> = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'rejected-after-interview', label: 'Rejected After Interview' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const statusStyles: Record<JobApplicationStatus, string> = {
  saved: 'bg-slate-100 text-slate-700',
  applied: 'bg-amber-100 text-amber-700',
  interview: 'bg-violet-100 text-violet-700',
  offer: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  'rejected-after-interview': 'bg-fuchsia-100 text-fuchsia-700',
  withdrawn: 'bg-stone-100 text-stone-700',
};

const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
});

const getDaysInMonth = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

interface JobApplicationTrackerProps {
  applications: JobApplication[];
  cvSources: CvSource[];
  strategyNotes: JobStrategyNote[];
  strategyMonth: Date;
  onAddApplication: (application: Omit<JobApplication, 'id'>) => void;
  onUpdateApplication: (applicationId: string, application: Omit<JobApplication, 'id'>) => void;
  onDeleteApplication: (applicationId: string) => void;
  onAddCvSource: (source: Omit<CvSource, 'id'>) => void;
  onUpdateCvSource: (sourceId: string, source: Omit<CvSource, 'id'>) => void;
  onDeleteCvSource: (sourceId: string) => void;
  onPrevStrategyMonth: () => void;
  onNextStrategyMonth: () => void;
  onAddStrategyNote: (note: { title: string }) => void;
  onUpdateStrategyNote: (noteId: string, note: { title: string }) => void;
  onDeleteStrategyNote: (noteId: string) => void;
}

interface JobApplicationFormState {
  jobTitle: string;
  company: string;
  type: JobApplicationType;
  applicationDate: string;
  status: JobApplicationStatus;
  link: string;
  selectedCvSourceId: string;
}

interface AnalysisDraftState {
  cvFileName: string;
  cvText: string;
  jobDescription: string;
}

const getEmptyForm = (): JobApplicationFormState => ({
  jobTitle: '',
  company: '',
  type: 'tech',
  applicationDate: new Date().toISOString().slice(0, 10),
  status: 'applied',
  link: '',
  selectedCvSourceId: '',
});

const getDraftNameFromFile = (fileName: string) => fileName.replace(/\.[^.]+$/, '') || fileName;

const createSavedDraftName = (jobTitle: string) => `${jobTitle} CV ${new Date().toLocaleDateString()}`;

const rolePatterns: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /product manager/i, label: 'Product manager' },
  { pattern: /research scientist|scientist/i, label: 'Research scientist' },
  { pattern: /data scientist/i, label: 'Data scientist' },
  { pattern: /machine learning engineer|ml engineer/i, label: 'ML engineer' },
  { pattern: /software engineer|developer/i, label: 'Software engineer' },
  { pattern: /bioinformatician|bioinformatics/i, label: 'Bioinformatics specialist' },
  { pattern: /computational biologist/i, label: 'Computational biologist' },
  { pattern: /designer|architect/i, label: 'Design technologist' },
  { pattern: /researcher/i, label: 'Research professional' },
];

const skillPatterns: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /python/i, label: 'Python' },
  { pattern: /typescript|javascript/i, label: 'TypeScript' },
  { pattern: /react/i, label: 'React' },
  { pattern: /node/i, label: 'Node' },
  { pattern: /sql/i, label: 'SQL' },
  { pattern: /aws|amazon web services/i, label: 'AWS' },
  { pattern: /docker/i, label: 'Docker' },
  { pattern: /kubernetes/i, label: 'Kubernetes' },
  { pattern: /genomics/i, label: 'genomics' },
  { pattern: /bioinformatics/i, label: 'bioinformatics' },
  { pattern: /machine learning|artificial intelligence|ai\b/i, label: 'AI' },
  { pattern: /data analysis|analytics/i, label: 'analytics' },
];

const clampSummaryWords = (summary: string) => {
  const normalizedWords = summary.trim().split(/\s+/).filter(Boolean);

  if (normalizedWords.length > 10) {
    return normalizedWords.slice(0, 10).join(' ');
  }

  if (normalizedWords.length >= 5) {
    return normalizedWords.join(' ');
  }

  return [...normalizedWords, 'with', 'broad', 'technical', 'experience'].slice(0, 10).join(' ');
};

const summarizeCvText = (text: string) => {
  const normalizedText = text.replace(/\s+/g, ' ').trim();

  if (!normalizedText) {
    return 'General profile with broad technical experience';
  }

  const matchedRole = rolePatterns.find(({ pattern }) => pattern.test(normalizedText))?.label ?? 'General profile';
  const matchedSkills = skillPatterns
    .filter(({ pattern }) => pattern.test(normalizedText))
    .slice(0, 3)
    .map(({ label }) => label);

  const summary = matchedSkills.length > 0
    ? `${matchedRole} with ${matchedSkills.join(', ')} focus`
    : `${matchedRole} with broad technical experience`;

  return clampSummaryWords(summary);
};

const normalizeLink = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return '';
  if (trimmedValue.startsWith('http://') || trimmedValue.startsWith('https://')) return trimmedValue;
  return `https://${trimmedValue}`;
};

const createApplicationPayload = (
  application: JobApplication,
  overrides: Partial<Omit<JobApplication, 'id'>> = {}
): Omit<JobApplication, 'id'> => ({
  jobTitle: application.jobTitle,
  company: application.company,
  type: application.type,
  applicationDate: application.applicationDate,
  status: application.status,
  link: application.link,
  selectedCvSourceId: application.selectedCvSourceId,
  cvFileName: application.cvFileName,
  cvText: application.cvText,
  jobDescription: application.jobDescription,
  cvAnalysis: application.cvAnalysis ?? null,
  cvBuilderDraft: application.cvBuilderDraft ?? null,
  savedCvDrafts: application.savedCvDrafts ?? [],
  cvAnalyzedAt: application.cvAnalyzedAt,
  cvBuilderGeneratedAt: application.cvBuilderGeneratedAt,
  ...overrides,
});

const builderSuggestionColors = [
  'text-violet-700',
  'text-emerald-700',
  'text-amber-700',
  'text-sky-700',
];

const BuilderResults = ({
  draft,
  cvSources,
  onAcceptLine,
  onDeclineLine,
  onUpdateSectionTitle,
  onMoveSection,
  onUpdateLineText,
  onMoveLine,
}: {
  draft: CvBuilderDraft;
  cvSources: CvSource[];
  onAcceptLine: (sectionId: string, lineId: string) => void;
  onDeclineLine: (sectionId: string, lineId: string) => void;
  onUpdateSectionTitle: (sectionId: string, title: string) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  onUpdateLineText: (sectionId: string, lineId: string, text: string) => void;
  onMoveLine: (sectionId: string, lineId: string, direction: 'up' | 'down') => void;
}) => {
  const sourceNames = new Map(cvSources.map((source) => [source.id, source.name]));

  return (
    <div className="space-y-5 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Draft Match</p>
          <p className="mt-1 text-3xl font-headline font-extrabold text-on-surface">{draft.matchScore}%</p>
        </div>
        <div className="max-w-sm text-right text-sm text-on-surface-variant">{draft.summary}</div>
      </div>

      {draft.notes.length > 0 && (
        <div>
          <h3 className="text-sm font-headline font-bold text-on-surface">AI Notes</h3>
          <ul className="mt-2 space-y-2 text-sm text-on-surface-variant">
            {draft.notes.map((note) => (
              <li key={note}>• {note}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {draft.sections.map((section, sectionIndex) => (
          <div key={section.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={section.title}
                onChange={(event) => onUpdateSectionTitle(section.id, event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-headline font-bold text-on-surface transition-colors focus:border-outline-variant focus:bg-surface-container-low focus:outline-none"
              />
              <button
                type="button"
                onClick={() => onMoveSection(section.id, 'up')}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                aria-label={`Move ${section.title} up`}
              >
                <ArrowUp size={15} />
              </button>
              <button
                type="button"
                onClick={() => onMoveSection(section.id, 'down')}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                aria-label={`Move ${section.title} down`}
              >
                <ArrowDown size={15} />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {section.lines.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No lines kept in this section.</p>
              ) : (
                section.lines.map((line) => {
                  const isSuggested = line.status === 'suggested';
                  const suggestionColor = builderSuggestionColors[sectionIndex % builderSuggestionColors.length];

                  return (
                    <div key={line.id} className="rounded-lg border border-outline-variant/50 bg-surface-container-low px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span className={`pt-2 text-sm ${isSuggested ? suggestionColor : 'text-on-surface'}`}>•</span>
                        <textarea
                          value={line.text}
                          onChange={(event) => onUpdateLineText(section.id, line.id, event.target.value)}
                          className={`min-h-[68px] flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm whitespace-pre-wrap transition-colors focus:border-outline-variant focus:bg-white focus:outline-none ${isSuggested ? suggestionColor : 'text-on-surface'}`}
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => onMoveLine(section.id, line.id, 'up')}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-white hover:text-on-surface"
                            aria-label="Move line up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onMoveLine(section.id, line.id, 'down')}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-white hover:text-on-surface"
                            aria-label="Move line down"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                        <span>{isSuggested ? 'Suggested rewrite' : 'Accepted line'}</span>
                        {line.sourceCvIds.length > 0 && (
                          <span>
                            Sources: {line.sourceCvIds.map((sourceId) => sourceNames.get(sourceId) ?? sourceId).join(', ')}
                          </span>
                        )}
                      </div>

                      {line.rationale && <p className="mt-2 text-xs text-on-surface-variant">{line.rationale}</p>}

                      {isSuggested && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onAcceptLine(section.id, line.id)}
                            className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-headline font-semibold text-emerald-800 transition-colors hover:bg-emerald-200"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeclineLine(section.id, line.id)}
                            className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-headline font-semibold text-rose-800 transition-colors hover:bg-rose-200"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalysisResults = ({ analysis }: { analysis: CvAnalysis }) => (
  <div className="space-y-5 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5">
    <div className="flex flex-wrap items-center gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Match Score</p>
        <p className="mt-1 text-3xl font-headline font-extrabold text-on-surface">{analysis.matchScore}%</p>
      </div>
      <div className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-on-surface shadow-sm">
        {analysis.overallFit}
      </div>
    </div>

    <div>
      <h3 className="text-sm font-headline font-bold text-on-surface">Summary</h3>
      <p className="mt-1 text-sm text-on-surface-variant">{analysis.summary}</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h3 className="text-sm font-headline font-bold text-on-surface">Strengths</h3>
        <ul className="mt-2 space-y-2 text-sm text-on-surface-variant">
          {analysis.strengths.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-headline font-bold text-on-surface">Missing Keywords</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {analysis.missingKeywords.map((keyword) => (
            <span key={keyword} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-on-surface shadow-sm">
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-sm font-headline font-bold text-on-surface">Suggested Changes</h3>
      <ul className="mt-2 space-y-2 text-sm text-on-surface-variant">
        {analysis.suggestedChanges.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>

    <div>
      <h3 className="text-sm font-headline font-bold text-on-surface">Section Rewrites</h3>
      <div className="mt-3 space-y-3">
        {analysis.sectionSuggestions.map((suggestion) => (
          <div key={`${suggestion.section}-${suggestion.suggestedRewrite}`} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm font-headline font-bold text-on-surface">{suggestion.section}</p>
            <p className="mt-1 text-sm text-on-surface-variant">{suggestion.rationale}</p>
            <p className="mt-3 text-sm text-on-surface whitespace-pre-wrap">{suggestion.suggestedRewrite}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function JobApplicationTracker({
  applications,
  cvSources,
  strategyNotes,
  strategyMonth,
  onAddApplication,
  onUpdateApplication,
  onDeleteApplication,
  onAddCvSource,
  onUpdateCvSource,
  onDeleteCvSource,
  onPrevStrategyMonth,
  onNextStrategyMonth,
  onAddStrategyNote,
  onUpdateStrategyNote,
  onDeleteStrategyNote,
}: JobApplicationTrackerProps) {
  const [activeTab, setActiveTab] = useState<JobTrackerTab>('applications');
  const [expandedCvSourceIds, setExpandedCvSourceIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisTargetId, setAnalysisTargetId] = useState<string | null>(null);
  const [analysisDraft, setAnalysisDraft] = useState<AnalysisDraftState>({
    cvFileName: '',
    cvText: '',
    jobDescription: '',
  });
  const [cvDraftError, setCvDraftError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploadingCvDraft, setIsUploadingCvDraft] = useState(false);
  const [form, setForm] = useState<JobApplicationFormState>(getEmptyForm());

  const sortedApplications = useMemo(
    () => [...applications].sort((first, second) => second.applicationDate.localeCompare(first.applicationDate)),
    [applications]
  );
  const cvSourceSummaries = useMemo(
    () =>
      new Map(
        cvSources.map((source) => [source.id, summarizeCvText(source.text)])
      ),
    [cvSources]
  );
  const monthlyApplicationSummary = useMemo(() => {
    const summaryByMonth = new Map<
      string,
      {
        label: string;
        total: number;
        weeks: [number, number, number, number, number];
        hasWeekFive: boolean;
      }
    >();

    applications.forEach((application) => {
      if (application.status === 'saved' || !application.applicationDate) {
        return;
      }

      const appliedAt = new Date(`${application.applicationDate}T12:00:00`);

      if (Number.isNaN(appliedAt.getTime())) {
        return;
      }

      const monthKey = application.applicationDate.slice(0, 7);
      const weekIndex = Math.min(4, Math.floor((appliedAt.getDate() - 1) / 7));
      const existingMonth = summaryByMonth.get(monthKey);

      if (existingMonth) {
        existingMonth.total += 1;
        existingMonth.weeks[weekIndex] += 1;
        return;
      }

      const weeks: [number, number, number, number, number] = [0, 0, 0, 0, 0];
      weeks[weekIndex] = 1;

      summaryByMonth.set(monthKey, {
        label: monthFormatter.format(appliedAt),
        total: 1,
        weeks,
        hasWeekFive: getDaysInMonth(monthKey) > 28,
      });
    });

    return Array.from(summaryByMonth.entries())
      .sort(([firstMonth], [secondMonth]) => secondMonth.localeCompare(firstMonth))
      .map(([month, summary]) => ({ month, ...summary }));
  }, [applications]);
  const analysisTarget = sortedApplications.find((application) => application.id === analysisTargetId) ?? null;

  const closeModal = () => {
    setIsModalOpen(false);
    setForm(getEmptyForm());
  };

  const openNewApplicationModal = () => {
    setForm(getEmptyForm());
    setIsModalOpen(true);
  };

  const handleInlineUpdate = (application: JobApplication, updates: Partial<Omit<JobApplication, 'id'>>) => {
    onUpdateApplication(application.id, createApplicationPayload(application, updates));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const selectedCvSource = cvSources.find((source) => source.id === form.selectedCvSourceId) ?? null;

    const nextApplication = {
      jobTitle: form.jobTitle.trim(),
      company: form.company.trim(),
      type: form.type,
      applicationDate: form.applicationDate,
      status: form.status,
      link: normalizeLink(form.link),
      selectedCvSourceId: selectedCvSource?.id,
      cvFileName: selectedCvSource?.fileName ?? '',
      cvText: selectedCvSource?.text ?? '',
      jobDescription: '',
      cvAnalysis: null,
      cvBuilderDraft: null,
      savedCvDrafts: [],
      cvAnalyzedAt: undefined,
      cvBuilderGeneratedAt: undefined,
    };

    if (!nextApplication.jobTitle || !nextApplication.company || !nextApplication.applicationDate || !nextApplication.link) {
      return;
    }

    onAddApplication(nextApplication);
    closeModal();
  };

  const handleCvDraftUpload = async (file: File) => {
    setIsUploadingCvDraft(true);
    setCvDraftError(null);

    try {
      const { extractCvText } = await import('../utils/extractCvText');
      const extractedText = await extractCvText(file);
      const timestamp = new Date().toISOString();

      onAddCvSource({
        name: getDraftNameFromFile(file.name),
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        text: extractedText,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      setActiveTab('cv-drafts');
    } catch (error) {
      setCvDraftError(error instanceof Error ? error.message : 'Failed to read CV file.');
    } finally {
      setIsUploadingCvDraft(false);
    }
  };

  const handleCvSourceFieldChange = (source: CvSource, updates: Partial<Omit<CvSource, 'id'>>) => {
    onUpdateCvSource(source.id, {
      name: source.name,
      fileName: source.fileName,
      fileType: source.fileType,
      text: source.text,
      createdAt: source.createdAt,
      updatedAt: new Date().toISOString(),
      ...updates,
    });
  };

  const toggleCvSourceExpanded = (sourceId: string) => {
    setExpandedCvSourceIds((currentIds) =>
      currentIds.includes(sourceId)
        ? currentIds.filter((currentId) => currentId !== sourceId)
        : [...currentIds, sourceId]
    );
  };

  const openAnalysisModal = (application: JobApplication) => {
    setAnalysisTargetId(application.id);
    setAnalysisDraft({
      cvFileName: application.cvFileName ?? '',
      cvText: application.cvText ?? '',
      jobDescription: application.jobDescription ?? '',
    });
    setAnalysisError(null);
  };

  const persistAnalysisDraft = (application: JobApplication, draft: AnalysisDraftState) => {
    onUpdateApplication(
      application.id,
      createApplicationPayload(application, {
        cvFileName: draft.cvFileName,
        cvText: draft.cvText,
        jobDescription: draft.jobDescription,
      })
    );
  };

  const closeAnalysisModal = () => {
    if (analysisTarget) {
      persistAnalysisDraft(analysisTarget, analysisDraft);
    }

    setAnalysisTargetId(null);
    setAnalysisDraft({ cvFileName: '', cvText: '', jobDescription: '' });
    setAnalysisError(null);
    setIsAnalyzing(false);
  };

  const handleAnalyze = async () => {
    if (!analysisTarget) return;

    const normalizedJobDescription = analysisDraft.jobDescription.trim();

    if (!normalizedJobDescription) {
      setAnalysisError('Paste the job description before generating a CV draft.');
      return;
    }

    const validCvSources = cvSources.filter((source) => source.text.trim());

    if (validCvSources.length === 0) {
      setAnalysisError('Upload at least one CV in the CV Drafts tab before building a tailored CV.');
      return;
    }

    const nextDraft = {
      ...analysisDraft,
      cvText: validCvSources.map((source) => source.text.trim()).join('\n\n'),
      jobDescription: normalizedJobDescription,
    };

    persistAnalysisDraft(analysisTarget, nextDraft);
    setAnalysisDraft(nextDraft);
    setAnalysisError(null);
    setIsAnalyzing(true);

    try {
      const { buildCvDraft } = await import('../utils/buildCvDraft');
      const draft = await buildCvDraft({
        jobTitle: analysisTarget.jobTitle,
        company: analysisTarget.company,
        jobDescription: normalizedJobDescription,
        cvSources: validCvSources,
      });

      onUpdateApplication(
        analysisTarget.id,
        createApplicationPayload(analysisTarget, {
          cvFileName: nextDraft.cvFileName,
          cvText: nextDraft.cvText,
          jobDescription: normalizedJobDescription,
          cvBuilderDraft: draft,
          cvAnalyzedAt: new Date().toISOString(),
          cvBuilderGeneratedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Failed to build CV draft.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateBuilderDraft = (application: JobApplication, transformDraft: (draft: CvBuilderDraft) => CvBuilderDraft) => {
    const currentDraft = application.cvBuilderDraft;

    if (!currentDraft) {
      return;
    }

    onUpdateApplication(
      application.id,
      createApplicationPayload(application, {
        cvBuilderDraft: transformDraft(currentDraft),
      })
    );
  };

  const handleReplaceBuilderDraft = (nextDraft: CvBuilderDraft) => {
    if (!analysisTarget) return;

    onUpdateApplication(
      analysisTarget.id,
      createApplicationPayload(analysisTarget, {
        cvBuilderDraft: nextDraft,
      })
    );
  };

  const moveItem = <T,>(items: T[], fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length) {
      return items;
    }

    const nextItems = [...items];
    const [movedItem] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, movedItem);
    return nextItems;
  };

  const updateBuilderLine = (
    application: JobApplication,
    sectionId: string,
    lineId: string,
    transformLine: (line: CvBuilderLine) => CvBuilderLine | null
  ) => {
    updateBuilderDraft(application, (currentDraft) => ({
      ...currentDraft,
      sections: currentDraft.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          lines: section.lines
            .map((line) => (line.id === lineId ? transformLine(line) : line))
            .filter((line): line is CvBuilderLine => Boolean(line)),
        };
      }),
    }));
  };

  const handleAcceptBuilderLine = (sectionId: string, lineId: string) => {
    if (!analysisTarget) return;

    updateBuilderLine(analysisTarget, sectionId, lineId, (line) => ({
      ...line,
      status: 'accepted',
    }));
  };

  const handleDeclineBuilderLine = (sectionId: string, lineId: string) => {
    if (!analysisTarget) return;

    updateBuilderLine(analysisTarget, sectionId, lineId, () => null);
  };

  const handleUpdateBuilderSectionTitle = (sectionId: string, title: string) => {
    if (!analysisTarget) return;

    updateBuilderDraft(analysisTarget, (currentDraft) => ({
      ...currentDraft,
      sections: currentDraft.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              title,
            }
          : section
      ),
    }));
  };

  const handleMoveBuilderSection = (sectionId: string, direction: 'up' | 'down') => {
    if (!analysisTarget) return;

    updateBuilderDraft(analysisTarget, (currentDraft) => {
      const currentIndex = currentDraft.sections.findIndex((section) => section.id === sectionId);
      const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      return {
        ...currentDraft,
        sections: moveItem(currentDraft.sections, currentIndex, nextIndex),
      };
    });
  };

  const handleUpdateBuilderLineText = (sectionId: string, lineId: string, text: string) => {
    if (!analysisTarget) return;

    updateBuilderLine(analysisTarget, sectionId, lineId, (line) => ({
      ...line,
      text,
      status: 'accepted',
    }));
  };

  const handleMoveBuilderLine = (sectionId: string, lineId: string, direction: 'up' | 'down') => {
    if (!analysisTarget) return;

    updateBuilderDraft(analysisTarget, (currentDraft) => ({
      ...currentDraft,
      sections: currentDraft.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        const currentIndex = section.lines.findIndex((line) => line.id === lineId);
        const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        return {
          ...section,
          lines: moveItem(section.lines, currentIndex, nextIndex),
        };
      }),
    }));
  };

  const handleSaveFinalCvDraft = () => {
    if (!analysisTarget || !analysisTarget.cvBuilderDraft) return;

    const currentDraft = analysisTarget.cvBuilderDraft;
    const savedDraft: SavedCvDraft = {
      id: Math.random().toString(36).slice(2, 11),
      name: createSavedDraftName(analysisTarget.jobTitle),
      summary: currentDraft.summary,
      sections: currentDraft.sections,
      sourceCvIds: currentDraft.sourceCvIds,
      savedAt: new Date().toISOString(),
    };

    onUpdateApplication(
      analysisTarget.id,
      createApplicationPayload(analysisTarget, {
        savedCvDrafts: [savedDraft, ...(analysisTarget.savedCvDrafts ?? [])],
      })
    );
  };

  const handleDeleteSavedCvDraft = (savedDraftId: string) => {
    if (!analysisTarget) return;

    onUpdateApplication(
      analysisTarget.id,
      createApplicationPayload(analysisTarget, {
        savedCvDrafts: (analysisTarget.savedCvDrafts ?? []).filter((draft) => draft.id !== savedDraftId),
      })
    );
  };

  const handleExportSavedCvDraft = async (savedDraft: SavedCvDraft) => {
    if (!analysisTarget) return;

    try {
      await exportSavedCvDraft({
        draft: savedDraft,
        jobTitle: analysisTarget.jobTitle,
        company: analysisTarget.company,
        cvSources,
      });
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Failed to export CV draft.');
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-outline-variant/60 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <h2 className="text-xl font-headline font-bold text-on-surface">Monthly Application Counts and Strategy</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)] xl:items-stretch">
        <div className="h-[126px] overflow-hidden rounded-2xl border border-outline-variant/60">
          {monthlyApplicationSummary.length === 0 ? (
            <div className="px-4 py-3 text-sm text-on-surface-variant text-center">
              Add dated applications to see monthly and weekly counts here.
            </div>
          ) : (
            <>
              <table className="min-w-[260px] w-full text-sm">
                <thead>
                  <tr className="h-[31px] bg-amber-100 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                    <th scope="col" className="px-2 py-0 text-left align-middle">Month</th>
                    <th scope="col" className="px-2 py-0 text-center align-middle">W1</th>
                    <th scope="col" className="px-2 py-0 text-center align-middle">W2</th>
                    <th scope="col" className="px-2 py-0 text-center align-middle">W3</th>
                    <th scope="col" className="px-2 py-0 text-center align-middle">W4</th>
                    <th scope="col" className="px-2 py-0 text-center align-middle">W5</th>
                    <th scope="col" className="px-2 py-0 text-center align-middle">Total</th>
                  </tr>
                </thead>
              </table>

              <div className="h-[95px] overflow-auto custom-scrollbar">
              <table className="min-w-[260px] w-full text-sm">
                <tbody>
                  {monthlyApplicationSummary.map((summary, index) => (
                    <tr key={summary.month} className={`border-t border-outline-variant/50 ${index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'}`}>
                      <th scope="row" className="px-2 py-1.5 text-left text-sm font-headline font-semibold text-on-surface">
                        {summary.label}
                      </th>
                      {summary.weeks.map((count, index) => (
                        <td
                          key={`${summary.month}-week-${index + 1}`}
                          className="px-1.5 py-1.5 text-center text-xs font-medium text-on-surface"
                        >
                          {index === 4 && !summary.hasWeekFive ? 'NA' : count}
                        </td>
                      ))}
                      <td className="px-1.5 py-1.5 text-center text-xs font-headline font-extrabold text-on-surface">
                        {summary.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </div>

        <JobStrategyNotes
          notes={strategyNotes}
          currentMonth={strategyMonth}
          onPrevMonth={onPrevStrategyMonth}
          onNextMonth={onNextStrategyMonth}
          onAddNote={onAddStrategyNote}
          onUpdateNote={onUpdateStrategyNote}
          onDeleteNote={onDeleteStrategyNote}
        />
        </div>
      </section>

      <section className="rounded-2xl border border-outline-variant/60 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-headline font-bold text-on-surface">Job Search Workspace</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Manage applications and keep reusable CV text drafts in one place.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('applications')}
            className={`rounded-xl px-4 py-2 text-sm font-headline font-semibold transition-colors ${
              activeTab === 'applications'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Applications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cv-drafts')}
            className={`rounded-xl px-4 py-2 text-sm font-headline font-semibold transition-colors ${
              activeTab === 'cv-drafts'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            CV Drafts
          </button>
          {activeTab === 'applications' ? (
            <button
              type="button"
              onClick={openNewApplicationModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-headline font-semibold text-on-primary shadow-sm transition-all hover:shadow-md"
            >
              <Plus size={16} />
              Add Application
            </button>
          ) : (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-headline font-semibold text-on-primary shadow-sm transition-all hover:shadow-md">
              {isUploadingCvDraft ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
              {isUploadingCvDraft ? 'Reading CV...' : 'Upload CV'}
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    void handleCvDraftUpload(file);
                  }

                  event.currentTarget.value = '';
                }}
              />
            </label>
          )}
        </div>
      </div>

      {activeTab === 'applications' ? (
      <div className="rounded-2xl border border-outline-variant/60 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[36px_1.2fr_1fr_0.72fr_0.95fr_1fr_1.15fr_40px_40px] gap-3 bg-surface-container-low px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
          <span className="text-center">#</span>
          <span>Job Title</span>
          <span>Company</span>
          <span>Type</span>
          <span>Date</span>
          <span>Status</span>
          <span>Link</span>
          <span className="text-center">AI</span>
          <span className="text-center">Delete</span>
        </div>

        <div className="max-h-[360px] overflow-y-auto divide-y divide-outline-variant/50 custom-scrollbar">
          {sortedApplications.length === 0 ? (
            <div className="px-4 py-8 text-sm text-on-surface-variant text-center">
              No job applications logged yet.
            </div>
          ) : (
            sortedApplications.map((application, index) => (
              <div
                key={application.id}
                className="grid gap-2 px-4 py-1.5 lg:grid-cols-[36px_1.2fr_1fr_0.72fr_0.95fr_1fr_1.15fr_40px_40px] lg:items-center"
              >
                <div className="flex items-center lg:justify-center">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">#</p>
                  <span className="text-sm font-headline font-semibold text-on-surface">{index + 1}</span>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Job Title</p>
                  <input
                    type="text"
                    value={application.jobTitle}
                    onChange={(event) => handleInlineUpdate(application, { jobTitle: event.target.value })}
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-0.5 text-sm font-headline font-semibold text-on-surface transition-colors focus:border-outline-variant focus:bg-surface-container-low focus:outline-none"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Company</p>
                  <input
                    type="text"
                    value={application.company}
                    onChange={(event) => handleInlineUpdate(application, { company: event.target.value })}
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-0.5 text-sm text-on-surface transition-colors focus:border-outline-variant focus:bg-surface-container-low focus:outline-none"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Type</p>
                  <select
                    value={application.type}
                    onChange={(event) => handleInlineUpdate(application, { type: event.target.value as JobApplicationType })}
                    className="w-full rounded-lg border border-transparent bg-surface-container px-2.5 py-1 text-xs font-semibold text-on-surface transition-colors focus:border-outline-variant focus:outline-none"
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Date</p>
                  <input
                    type="date"
                    value={application.applicationDate}
                    onChange={(event) => handleInlineUpdate(application, { applicationDate: event.target.value })}
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-0.5 text-sm text-on-surface transition-colors focus:border-outline-variant focus:bg-surface-container-low focus:outline-none"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Status</p>
                  <select
                    value={application.status}
                    onChange={(event) => handleInlineUpdate(application, { status: event.target.value as JobApplicationStatus })}
                    className={`w-full rounded-lg border border-transparent px-2.5 py-1 text-xs font-semibold transition-colors focus:border-outline-variant focus:outline-none ${statusStyles[application.status]}`}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 lg:justify-center">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Link</p>
                  <input
                    type="url"
                    value={application.link}
                    onChange={(event) => handleInlineUpdate(application, { link: event.target.value })}
                    onBlur={(event) => handleInlineUpdate(application, { link: normalizeLink(event.target.value) })}
                    className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-0.5 text-sm text-on-surface transition-colors focus:border-outline-variant focus:bg-surface-container-low focus:outline-none"
                    placeholder="https://..."
                  />
                  <a
                    href={normalizeLink(application.link)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                    aria-label={`Open ${application.jobTitle} posting`}
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>

                <div className="flex items-center gap-1 lg:justify-center">
                  <button
                    type="button"
                    onClick={() => openAnalysisModal(application)}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      application.cvBuilderDraft
                        ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                    }`}
                    aria-label={`Open ${application.jobTitle} CV builder`}
                  >
                    <Sparkles size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-1 lg:justify-center">
                  <button
                    type="button"
                    onClick={() => onDeleteApplication(application.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label={`Delete ${application.jobTitle}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      ) : (
      <div className="space-y-4">
        <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          Upload CV files once and keep only their extracted text locally in this browser.
        </div>

        {cvDraftError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {cvDraftError}
          </div>
        )}

        {cvSources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-5 py-12 text-center text-sm text-on-surface-variant">
            No CV drafts saved yet. Upload a CV to extract and store its text locally.
          </div>
        ) : (
          <div className="rounded-2xl border border-outline-variant/60 overflow-hidden">
            <div className="hidden lg:grid grid-cols-[minmax(0,1.1fr)_minmax(0,1.15fr)_180px_160px_48px] gap-3 bg-surface-container-low px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              <span>Draft</span>
              <span>Summary</span>
              <span>Updated</span>
              <span>Text</span>
              <span className="text-center">Delete</span>
            </div>

            <div className="divide-y divide-outline-variant/50">
              {cvSources.map((source) => {
                const isExpanded = expandedCvSourceIds.includes(source.id);

                return (
                  <div key={source.id} className="bg-white">
                    <div className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.15fr)_180px_160px_48px] lg:items-center">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Draft</p>
                        <input
                          type="text"
                          value={source.name}
                          onChange={(event) => handleCvSourceFieldChange(source, { name: event.target.value })}
                          className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-headline font-semibold text-on-surface transition-colors focus:border-outline-variant focus:bg-surface-container-low focus:outline-none"
                          placeholder="CV draft name"
                        />
                        <p className="px-2 text-xs text-on-surface-variant">{source.fileName}</p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Summary</p>
                        <p className="text-sm text-on-surface">{cvSourceSummaries.get(source.id)}</p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Updated</p>
                        <p className="text-sm text-on-surface-variant">{new Date(source.updatedAt).toLocaleString()}</p>
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Text</p>
                        <button
                          type="button"
                          onClick={() => toggleCvSourceExpanded(source.id)}
                          className="rounded-lg bg-surface-container px-3 py-1.5 text-xs font-headline font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
                        >
                          {isExpanded ? 'Hide full text' : 'Show full text'}
                        </button>
                      </div>

                      <div className="flex items-center lg:justify-center">
                        <button
                          type="button"
                          onClick={() => onDeleteCvSource(source.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label={`Delete ${source.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-outline-variant/50 bg-surface-container-low px-4 py-4">
                        <label className="block">
                          <span className="mb-2 block text-sm font-headline font-bold text-on-surface">Stored CV Text</span>
                          <textarea
                            value={source.text}
                            onChange={(event) => handleCvSourceFieldChange(source, { text: event.target.value })}
                            className="min-h-[240px] w-full rounded-xl border border-outline-variant bg-white px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none transition-all"
                            placeholder="Extracted CV text"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-headline font-bold text-on-surface">Add Application</h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
                aria-label="Close application modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-headline font-bold text-on-surface">Job Title</span>
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, jobTitle: event.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 focus:bg-white focus:border-primary focus:outline-none transition-all"
                  placeholder="Senior Scientist"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-headline font-bold text-on-surface">Company</span>
                <input
                  type="text"
                  value={form.company}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, company: event.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 focus:bg-white focus:border-primary focus:outline-none transition-all"
                  placeholder="Company name"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-headline font-bold text-on-surface">Type</span>
                <select
                  value={form.type}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, type: event.target.value as JobApplicationType }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 focus:bg-white focus:border-primary focus:outline-none transition-all"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-headline font-bold text-on-surface">Application Date</span>
                <input
                  type="date"
                  value={form.applicationDate}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, applicationDate: event.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 focus:bg-white focus:border-primary focus:outline-none transition-all"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-headline font-bold text-on-surface">Application Status</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, status: event.target.value as JobApplicationStatus }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 focus:bg-white focus:border-primary focus:outline-none transition-all"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-headline font-bold text-on-surface">Position Link</span>
                <input
                  type="url"
                  value={form.link}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, link: event.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 focus:bg-white focus:border-primary focus:outline-none transition-all"
                  placeholder="https://..."
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-headline font-bold text-on-surface">CV Draft</span>
                <select
                  value={form.selectedCvSourceId}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, selectedCvSourceId: event.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 focus:bg-white focus:border-primary focus:outline-none transition-all"
                >
                  <option value="">No CV selected yet</option>
                  {cvSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-on-surface-variant">
                  {cvSources.length === 0
                    ? 'Upload CVs in the CV Drafts tab first.'
                    : 'Selecting a draft copies its stored text into this application.'}
                </p>
              </label>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg bg-surface-container px-4 py-2 text-sm font-headline font-bold transition-colors hover:bg-surface-container-high"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-headline font-bold text-on-primary transition-colors hover:bg-primary/90"
                >
                  Add Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {analysisTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-6xl max-h-full overflow-y-auto rounded-2xl bg-white p-8 shadow-xl custom-scrollbar">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-headline font-bold text-on-surface">CV Builder</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {analysisTarget.jobTitle} at {analysisTarget.company}
                </p>
              </div>
              <button
                type="button"
                onClick={closeAnalysisModal}
                className="rounded-lg p-2 text-on-surface-variant transition-colors hover:bg-surface-container"
                aria-label="Close CV analysis modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <section className="space-y-5">
                <div className="rounded-2xl border border-outline-variant/60 p-5">
                  <div className="mb-4">
                    <div>
                      <h3 className="text-lg font-headline font-bold text-on-surface">Job Description</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">Paste the full job description, then generate a tailored CV draft from all saved CVs.</p>
                    </div>
                  </div>

                  <textarea
                    value={analysisDraft.jobDescription}
                    onChange={(event) => setAnalysisDraft((currentDraft) => ({ ...currentDraft, jobDescription: event.target.value }))}
                    onBlur={() => persistAnalysisDraft(analysisTarget, analysisDraft)}
                    className="min-h-[280px] w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:bg-white focus:border-primary focus:outline-none transition-all"
                    placeholder="Paste the job description here..."
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-on-surface-variant">
                    {analysisTarget.cvBuilderGeneratedAt
                      ? `Last draft built: ${new Date(analysisTarget.cvBuilderGeneratedAt).toLocaleString()}`
                      : 'No CV draft generated yet.'}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {analysisTarget.cvBuilderDraft && (
                      <button
                        type="button"
                        onClick={handleSaveFinalCvDraft}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2.5 text-sm font-headline font-semibold text-emerald-800 transition-colors hover:bg-emerald-200"
                      >
                        <Save size={16} />
                        Save As Final Draft
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleAnalyze()}
                      disabled={isAnalyzing}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-headline font-semibold text-on-primary shadow-sm transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isAnalyzing ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      {isAnalyzing ? 'Building...' : 'Build CV'}
                    </button>
                  </div>
                </div>

                {analysisError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {analysisError}
                  </div>
                )}

                <div className="rounded-2xl border border-outline-variant/60 p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-headline font-bold text-on-surface">Saved Final Drafts</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">Saved snapshots stay separate from the live AI draft.</p>
                    </div>
                    <div className="rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface">
                      {(analysisTarget.savedCvDrafts ?? []).length} saved
                    </div>
                  </div>

                  {(analysisTarget.savedCvDrafts ?? []).length === 0 ? (
                    <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-6 text-sm text-on-surface-variant text-center">
                      No final drafts saved yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(analysisTarget.savedCvDrafts ?? []).map((savedDraft) => (
                        <div key={savedDraft.id} className="rounded-xl bg-surface-container-low px-4 py-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-headline font-semibold text-on-surface">{savedDraft.name}</p>
                              <p className="mt-1 text-xs text-on-surface-variant">Saved {new Date(savedDraft.savedAt).toLocaleString()}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => void handleExportSavedCvDraft(savedDraft)}
                                className="inline-flex items-center gap-2 rounded-lg bg-sky-100 px-3 py-1.5 text-xs font-headline font-semibold text-sky-800 transition-colors hover:bg-sky-200"
                              >
                                <Download size={14} />
                                Export DOCX
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSavedCvDraft(savedDraft.id)}
                                className="inline-flex items-center gap-2 rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-headline font-semibold text-rose-800 transition-colors hover:bg-rose-200"
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section>
                {analysisTarget.cvBuilderDraft ? (
                  <CvDraftEditor
                    draft={analysisTarget.cvBuilderDraft}
                    cvSources={cvSources}
                    onDraftChange={handleReplaceBuilderDraft}
                    onMoveSection={handleMoveBuilderSection}
                    onMoveLine={handleMoveBuilderLine}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-5 py-10 text-sm text-on-surface-variant text-center">
                    Paste the job description and build a tailored CV from your saved CV drafts.
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
