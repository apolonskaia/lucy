import { ExternalLink, LoaderCircle, Plus, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { analyzeCvMatch } from '../utils/analyzeCvMatch';
import { extractCvText } from '../utils/extractCvText';
import { CvAnalysis, JobApplication, JobApplicationStatus, JobApplicationType } from '../types';

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

interface JobApplicationTrackerProps {
  applications: JobApplication[];
  onAddApplication: (application: Omit<JobApplication, 'id'>) => void;
  onUpdateApplication: (applicationId: string, application: Omit<JobApplication, 'id'>) => void;
  onDeleteApplication: (applicationId: string) => void;
}

interface JobApplicationFormState {
  jobTitle: string;
  company: string;
  type: JobApplicationType;
  applicationDate: string;
  status: JobApplicationStatus;
  link: string;
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
});

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
  cvFileName: application.cvFileName,
  cvText: application.cvText,
  jobDescription: application.jobDescription,
  cvAnalysis: application.cvAnalysis ?? null,
  cvAnalyzedAt: application.cvAnalyzedAt,
  ...overrides,
});

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
  onAddApplication,
  onUpdateApplication,
  onDeleteApplication,
}: JobApplicationTrackerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analysisTargetId, setAnalysisTargetId] = useState<string | null>(null);
  const [analysisDraft, setAnalysisDraft] = useState<AnalysisDraftState>({
    cvFileName: '',
    cvText: '',
    jobDescription: '',
  });
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtractingCv, setIsExtractingCv] = useState(false);
  const [form, setForm] = useState<JobApplicationFormState>(getEmptyForm());

  const sortedApplications = useMemo(
    () => [...applications].sort((first, second) => second.applicationDate.localeCompare(first.applicationDate)),
    [applications]
  );
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

    const nextApplication = {
      jobTitle: form.jobTitle.trim(),
      company: form.company.trim(),
      type: form.type,
      applicationDate: form.applicationDate,
      status: form.status,
      link: normalizeLink(form.link),
      cvFileName: '',
      cvText: '',
      jobDescription: '',
      cvAnalysis: null,
      cvAnalyzedAt: undefined,
    };

    if (!nextApplication.jobTitle || !nextApplication.company || !nextApplication.applicationDate || !nextApplication.link) {
      return;
    }

    onAddApplication(nextApplication);
    closeModal();
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
    setIsExtractingCv(false);
  };

  const handleCvUpload = async (file: File) => {
    if (!analysisTarget) return;

    setIsExtractingCv(true);
    setAnalysisError(null);

    try {
      const extractedText = await extractCvText(file);
      const nextDraft = {
        ...analysisDraft,
        cvFileName: file.name,
        cvText: extractedText,
      };
      setAnalysisDraft(nextDraft);
      persistAnalysisDraft(analysisTarget, nextDraft);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Failed to read CV file.');
    } finally {
      setIsExtractingCv(false);
    }
  };

  const handleAnalyze = async () => {
    if (!analysisTarget) return;

    const normalizedCvText = analysisDraft.cvText.trim();
    const normalizedJobDescription = analysisDraft.jobDescription.trim();

    if (!normalizedCvText || !normalizedJobDescription) {
      setAnalysisError('Upload a CV and add the job description before running analysis.');
      return;
    }

    const nextDraft = {
      ...analysisDraft,
      cvText: normalizedCvText,
      jobDescription: normalizedJobDescription,
    };

    persistAnalysisDraft(analysisTarget, nextDraft);
    setAnalysisDraft(nextDraft);
    setAnalysisError(null);
    setIsAnalyzing(true);

    try {
      const analysis = await analyzeCvMatch({
        jobTitle: analysisTarget.jobTitle,
        company: analysisTarget.company,
        cvText: normalizedCvText,
        jobDescription: normalizedJobDescription,
      });

      onUpdateApplication(
        analysisTarget.id,
        createApplicationPayload(analysisTarget, {
          cvFileName: nextDraft.cvFileName,
          cvText: normalizedCvText,
          jobDescription: normalizedJobDescription,
          cvAnalysis: analysis,
          cvAnalyzedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze CV.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl p-8 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">Job Search</h1>
          <p className="mt-2 text-sm text-on-surface-variant max-w-2xl">
            Track every role, company, application date, status update, and posting link in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewApplicationModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-headline font-semibold text-on-primary shadow-sm transition-all hover:shadow-md"
        >
          <Plus size={16} />
          Add Application
        </button>
      </div>

      <div className="rounded-2xl border border-outline-variant/60 overflow-hidden">
        <div className="hidden lg:grid grid-cols-[1.2fr_1fr_0.72fr_0.95fr_1fr_1.15fr_44px_44px] gap-3 bg-surface-container-low px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
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
            sortedApplications.map((application) => (
              <div
                key={application.id}
                className="grid gap-2.5 px-4 py-2.5 lg:grid-cols-[1.2fr_1fr_0.72fr_0.95fr_1fr_1.15fr_44px_44px] lg:items-center"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Job Title</p>
                  <input
                    type="text"
                    value={application.jobTitle}
                    onChange={(event) => handleInlineUpdate(application, { jobTitle: event.target.value })}
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-headline font-semibold text-on-surface transition-colors focus:border-outline-variant focus:bg-surface-container-low focus:outline-none"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Company</p>
                  <input
                    type="text"
                    value={application.company}
                    onChange={(event) => handleInlineUpdate(application, { company: event.target.value })}
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-on-surface transition-colors focus:border-outline-variant focus:bg-surface-container-low focus:outline-none"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Type</p>
                  <select
                    value={application.type}
                    onChange={(event) => handleInlineUpdate(application, { type: event.target.value as JobApplicationType })}
                    className="w-full rounded-lg border border-transparent bg-surface-container px-2.5 py-1.5 text-xs font-semibold text-on-surface transition-colors focus:border-outline-variant focus:outline-none"
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
                    className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-on-surface transition-colors focus:border-outline-variant focus:bg-surface-container-low focus:outline-none"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Status</p>
                  <select
                    value={application.status}
                    onChange={(event) => handleInlineUpdate(application, { status: event.target.value as JobApplicationStatus })}
                    className={`w-full rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-semibold transition-colors focus:border-outline-variant focus:outline-none ${statusStyles[application.status]}`}
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
                    className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-on-surface transition-colors focus:border-outline-variant focus:bg-surface-container-low focus:outline-none"
                    placeholder="https://..."
                  />
                  <a
                    href={normalizeLink(application.link)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                    aria-label={`Open ${application.jobTitle} posting`}
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>

                <div className="flex items-center gap-1 lg:justify-center">
                  <button
                    type="button"
                    onClick={() => openAnalysisModal(application)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                      application.cvAnalysis
                        ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                    }`}
                    aria-label={`Analyze ${application.jobTitle} CV match`}
                  >
                    <Sparkles size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-1 lg:justify-center">
                  <button
                    type="button"
                    onClick={() => onDeleteApplication(application.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label={`Delete ${application.jobTitle}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

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
          <div className="w-full max-w-5xl max-h-full overflow-y-auto rounded-2xl bg-white p-8 shadow-xl custom-scrollbar">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-headline font-bold text-on-surface">CV Match Analysis</h2>
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
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-headline font-bold text-on-surface">CV</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">Upload a PDF, DOCX, TXT, or Markdown CV for this position.</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-surface-container px-3 py-2 text-sm font-headline font-semibold text-on-surface hover:bg-surface-container-high transition-colors">
                      <Upload size={16} />
                      Upload CV
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt,.md,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void handleCvUpload(file);
                          }
                          event.currentTarget.value = '';
                        }}
                      />
                    </label>
                  </div>

                  <div className="mb-3 text-sm text-on-surface-variant">
                    {analysisDraft.cvFileName ? `Current file: ${analysisDraft.cvFileName}` : 'No CV uploaded yet.'}
                  </div>

                  <textarea
                    value={analysisDraft.cvText}
                    onChange={(event) => setAnalysisDraft((currentDraft) => ({ ...currentDraft, cvText: event.target.value }))}
                    onBlur={() => persistAnalysisDraft(analysisTarget, analysisDraft)}
                    className="min-h-[240px] w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:bg-white focus:border-primary focus:outline-none transition-all"
                    placeholder="Extracted CV text will appear here. You can also paste and edit manually."
                  />
                </div>

                <div className="rounded-2xl border border-outline-variant/60 p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-headline font-bold text-on-surface">Job Description</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">Paste the full job description to compare it with the uploaded CV.</p>
                  </div>

                  <textarea
                    value={analysisDraft.jobDescription}
                    onChange={(event) => setAnalysisDraft((currentDraft) => ({ ...currentDraft, jobDescription: event.target.value }))}
                    onBlur={() => persistAnalysisDraft(analysisTarget, analysisDraft)}
                    className="min-h-[240px] w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:bg-white focus:border-primary focus:outline-none transition-all"
                    placeholder="Paste the job description here..."
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm text-on-surface-variant">
                    {analysisTarget.cvAnalyzedAt
                      ? `Last analyzed: ${new Date(analysisTarget.cvAnalyzedAt).toLocaleString()}`
                      : 'No analysis run yet.'}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleAnalyze()}
                    disabled={isAnalyzing || isExtractingCv}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-headline font-semibold text-on-primary shadow-sm transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing || isExtractingCv ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    {isAnalyzing ? 'Analyzing...' : isExtractingCv ? 'Reading CV...' : 'Suggest CV Improvements'}
                  </button>
                </div>

                {analysisError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {analysisError}
                  </div>
                )}
              </section>

              <section>
                {analysisTarget.cvAnalysis ? (
                  <AnalysisResults analysis={analysisTarget.cvAnalysis} />
                ) : (
                  <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low px-5 py-10 text-sm text-on-surface-variant text-center">
                    Upload a CV, paste the job description, and run analysis to get targeted resume suggestions.
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
