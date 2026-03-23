import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { taskConfig } from '../taskConfig';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: { title: string; time: string; type: 'job' | 'learning' | 'wellness' | 'growth' }) => void;
}

export default function NewTaskModal({ isOpen, onClose, onAddTask }: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState<'job' | 'learning' | 'wellness' | 'growth'>('job');

  const categoryOptions = [
    { value: 'job' as const, label: 'Work' },
    { value: 'learning' as const, label: 'Learn' },
    { value: 'wellness' as const, label: 'Wellness' },
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAddTask({ title, time, type });
      setTitle('');
      setTime('09:00');
      setType('job');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-md mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-headline font-bold text-on-surface">New Task</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-container transition-colors"
          >
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-headline font-bold text-on-surface mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task description..."
              className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-low focus:bg-white focus:border-primary focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-headline font-bold text-on-surface mb-2">
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-low focus:bg-white focus:border-primary focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-headline font-bold text-on-surface mb-3">
              Category
            </label>
            <div className="flex gap-3">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`flex-1 py-2 px-3 rounded-lg font-headline font-bold text-sm transition-all ${
                    type === option.value
                      ? taskConfig[option.value].badgeActive
                      : taskConfig[option.value].badgeInactive
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 rounded-lg font-headline font-bold text-sm bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-lg font-headline font-bold text-sm bg-primary text-on-primary hover:shadow-lg transition-all"
            >
              Add Task
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
