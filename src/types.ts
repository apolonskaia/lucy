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

export interface MonthlyGoal {
  id: string;
  month: string; // YYYY-MM format
  title: string;
  type: 'job' | 'learning' | 'wellness';
}
