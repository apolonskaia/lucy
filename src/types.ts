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

export interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  type: JobApplicationType;
  applicationDate: string;
  status: JobApplicationStatus;
  link: string;
  cvFileName?: string;
  cvText?: string;
  jobDescription?: string;
  cvAnalysis?: CvAnalysis | null;
  cvAnalyzedAt?: string;
}

export interface MonthlyGoal {
  id: string;
  month: string; // YYYY-MM format
  title: string;
  type: 'job' | 'learning' | 'wellness';
}
