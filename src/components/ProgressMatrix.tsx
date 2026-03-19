import { useState } from 'react';
import { ProgressItem } from '../types';

const progressDataDay: ProgressItem[] = [
  {
    label: 'Career Focus',
    value: 65,
    description: 'Applied to 12 roles this month. 3 follow-ups pending.',
    color: 'bg-primary',
  },
  {
    label: 'Skill Growth',
    value: 82,
    description: '8 modules completed. Ahead of schedule on certification.',
    color: 'bg-blue-600',
  },
  {
    label: 'Health & Mind',
    value: 40,
    description: '3 meditations today. Need more physical activity.',
    color: 'bg-secondary',
  },
];

const progressDataWeek: ProgressItem[] = [
  {
    label: 'Career Focus',
    value: 72,
    description: 'Applied to 15 roles this week. 5 follow-ups pending.',
    color: 'bg-primary',
  },
  {
    label: 'Skill Growth',
    value: 85,
    description: '12 modules completed. Certification on track.',
    color: 'bg-blue-600',
  },
  {
    label: 'Health & Mind',
    value: 55,
    description: '8 meditations this week. 3 gym sessions completed.',
    color: 'bg-secondary',
  },
];

const progressDataMonth: ProgressItem[] = [
  {
    label: 'Career Focus',
    value: 68,
    description: 'Applied to 40+ roles this month. 12 interviews scheduled.',
    color: 'bg-primary',
  },
  {
    label: 'Skill Growth',
    value: 78,
    description: '28 modules completed. LEED Certification 80% complete.',
    color: 'bg-blue-600',
  },
  {
    label: 'Health & Mind',
    value: 62,
    description: '24 meditations. 10 gym sessions. Monthly wellness goal met.',
    color: 'bg-secondary',
  },
];

interface ProgressMatrixProps {
  view: 'day' | 'week' | 'month';
  onViewChange: (view: 'day' | 'week' | 'month') => void;
}

export default function ProgressMatrix({ view, onViewChange }: ProgressMatrixProps) {
  const getProgressData = () => {
    switch (view) {
      case 'week':
        return progressDataWeek;
      case 'month':
        return progressDataMonth;
      default:
        return progressDataDay;
    }
  };

  const progressData = getProgressData();
  return (
    <section className="bg-white rounded-2xl p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-headline font-extrabold text-on-surface">Progress Matrix</h2>
        <div className="flex bg-surface-container p-1 rounded-xl">
          <button onClick={() => onViewChange('day')} className={`px-4 py-1 text-xs font-bold font-headline rounded-lg transition-colors ${view === 'day' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}>Day</button>
          <button onClick={() => onViewChange('week')} className={`px-4 py-1 text-xs font-bold font-headline rounded-lg transition-colors ${view === 'week' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}>Week</button>
          <button onClick={() => onViewChange('month')} className={`px-4 py-1 text-xs font-bold font-headline rounded-lg transition-colors ${view === 'month' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}>Month</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {progressData.map((item) => (
          <div key={item.label} className="space-y-4">
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
            <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
