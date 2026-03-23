import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { MonthlyGoal } from '../types';
import { taskConfig } from '../taskConfig';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface MonthlyGoalsProps {
  goals: MonthlyGoal[];
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAddGoal: (goal: { title: string; type: 'job' | 'learning' | 'wellness' }) => void;
  onDeleteGoal: (goalId: string) => void;
}

export default function MonthlyGoals({
  goals,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onAddGoal,
  onDeleteGoal,
}: MonthlyGoalsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'job' | 'learning' | 'wellness'>('job');

  const handleAddGoal = () => {
    if (!title.trim()) return;
    onAddGoal({ title: title.trim(), type });
    setTitle('');
    setType('job');
    setIsModalOpen(false);
  };

  return (
    <>
      <section className="bg-white rounded-2xl p-5 shadow-sm relative">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <button onClick={onPrevMonth} className="p-1.5 rounded-lg hover:bg-surface-container transition-colors" aria-label="Previous month goals">
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-lg font-headline font-bold text-on-surface">
              {monthNames[currentMonth.getMonth()]} Goals
            </h2>
            <button onClick={onNextMonth} className="p-1.5 rounded-lg hover:bg-surface-container transition-colors" aria-label="Next month goals">
              <ChevronRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/80 text-on-primary shadow-md hover:shadow-lg transition-all"
            aria-label="Add monthly goal"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-2.5">
          {goals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-center text-sm text-on-surface-variant">
              No monthly goals yet for this month.
            </div>
          ) : (
            goals.map((goal) => {
              const palette = taskConfig[goal.type];
              const Icon = palette.iconComponent;

              return (
                <div
                  key={goal.id}
                  className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl ${palette.background} ${palette.hover} transition-all duration-300 shadow-sm hover:shadow-md`}
                >
                  <Icon size={15} className={palette.icon} />

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-headline font-bold leading-snug text-on-surface">{goal.title}</h3>
                  </div>

                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="text-on-surface-variant/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
                    aria-label="Delete monthly goal"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-headline font-bold text-on-surface">New Monthly Goal</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 hover:bg-surface-container transition-colors text-on-surface-variant"
                aria-label="Close monthly goal modal"
              >
                <Trash2 size={16} className="rotate-45" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-headline font-bold text-on-surface mb-2">Goal Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter monthly goal..."
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2 focus:bg-white focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-headline font-bold text-on-surface mb-3">Category</label>
                <div className="flex gap-3">
                  {(['job', 'learning', 'wellness'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setType(option)}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-headline font-bold transition-all ${
                        type === option ? taskConfig[option].badgeActive : taskConfig[option].badgeInactive
                      }`}
                    >
                      {taskConfig[option].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-headline font-bold bg-surface-container hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddGoal}
                  className="rounded-lg px-4 py-2 text-sm font-headline font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors"
                >
                  Add Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}