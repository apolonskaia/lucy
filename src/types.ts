export interface Task {
  id: string;
  date: string; // YYYY-MM-DD format
  time?: string;
  title: string;
  category: string;
  priority?: string;
  status: 'pending' | 'completed';
  type: 'job' | 'learning' | 'wellness';
}

export interface ProgressItem {
  label: string;
  value: number;
  color: string;
}

export type AppPage = 'journal' | 'job-search' | 'learning-hub' | 'wellness-tracker';

export type LearningResourceKind = 'course' | 'paper';

export type LearningResourceStatus = 'want-to-do' | 'in-progress' | 'finished' | 'dropped';

export interface LearningResource {
  id: string;
  title: string;
  link: string;
  kind: LearningResourceKind;
  status: LearningResourceStatus;
}

export type JobApplicationType = 'tech' | 'biotech';

export interface CvSource {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export type JobApplicationStatus =
  | 'saved'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'rejected-after-interview'
  | 'withdrawn';

export interface CvAnalysisSectionSuggestion {
  section: string;
  rationale: string;
  suggestedRewrite: string;
}

export interface CvAnalysis {
  summary: string;
  overallFit: string;
  matchScore: number;
  strengths: string[];
  missingKeywords: string[];
  suggestedChanges: string[];
  sectionSuggestions: CvAnalysisSectionSuggestion[];
}

export type CvBuilderLineStatus = 'accepted' | 'suggested';

export interface CvBuilderSuggestionRange {
  id: string;
  start: number;
  end: number;
  rationale: string;
  sourceCvIds: string[];
}

export interface CvBuilderLine {
  id: string;
  text: string;
  status: CvBuilderLineStatus;
  sourceCvIds: string[];
  rationale: string;
  suggestionRanges?: CvBuilderSuggestionRange[];
}

export interface CvBuilderSection {
  id: string;
  title: string;
  lines: CvBuilderLine[];
}

export interface CvBuilderDraft {
  summary: string;
  matchScore: number;
  sourceCvIds: string[];
  notes: string[];
  sections: CvBuilderSection[];
}

export interface SavedCvDraft {
  id: string;
  name: string;
  summary: string;
  sections: CvBuilderSection[];
  sourceCvIds: string[];
  savedAt: string;
}

export interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  type: JobApplicationType;
  applicationDate: string;
  status: JobApplicationStatus;
  link: string;
  selectedCvSourceId?: string;
  cvFileName?: string;
  cvText?: string;
  jobDescription?: string;
  cvAnalysis?: CvAnalysis | null;
  cvBuilderDraft?: CvBuilderDraft | null;
  savedCvDrafts?: SavedCvDraft[];
  cvAnalyzedAt?: string;
  cvBuilderGeneratedAt?: string;
}

export interface MonthlyGoal {
  id: string;
  month: string; // YYYY-MM format
  title: string;
  type: 'job' | 'learning' | 'wellness';
}

export interface JobStrategyNote {
  id: string;
  month: string; // YYYY-MM format
  title: string;
}
