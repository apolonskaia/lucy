export interface Task {
  id: string;
  date: string; // YYYY-MM-DD format
  time: string;
  title: string;
  category: string;
  priority?: string;
  status: 'pending' | 'completed';
  type: 'job' | 'learning' | 'wellness' | 'growth';
}

export interface ProgressItem {
  label: string;
  value: number;
  description: string;
  color: string;
}
