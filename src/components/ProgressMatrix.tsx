import { ProgressItem } from '../types';

interface ProgressMatrixProps {
  view: 'day' | 'week' | 'month';
  onViewChange: (view: 'day' | 'week' | 'month') => void;
  items: ProgressItem[];
}

export default function ProgressMatrix({ view, onViewChange, items }: ProgressMatrixProps) {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-headline font-bold text-on-surface">Progress</h2>
        <div className="flex bg-surface-container p-1 rounded-xl">
          <button onClick={() => onViewChange('day')} className={`px-4 py-1 text-xs font-bold font-headline rounded-lg transition-colors ${view === 'day' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}>Day</button>
          <button onClick={() => onViewChange('week')} className={`px-4 py-1 text-xs font-bold font-headline rounded-lg transition-colors ${view === 'week' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}>Week</button>
          <button onClick={() => onViewChange('month')} className={`px-4 py-1 text-xs font-bold font-headline rounded-lg transition-colors ${view === 'month' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}>Month</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map((item) => (
          <div key={item.label} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-headline font-bold text-on-surface">{item.label}</span>
              <span className="text-xs font-bold text-primary">{item.value}%</span>
            </div>
            <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
