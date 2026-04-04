import { X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { taskConfig } from '../taskConfig';
import { Task } from '../types';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTask: (task: { title: string; type: 'job' | 'learning' | 'wellness' }) => void;
  onDeleteSuggestion: (taskType: 'job' | 'learning' | 'wellness', title: string) => void;
  initialTask?: Task | null;
  suggestions: Record<'job' | 'learning' | 'wellness', string[]>;
}

export default function NewTaskModal({
  isOpen,
  onClose,
  onSubmitTask,
  onDeleteSuggestion,
  initialTask,
  suggestions,
}: NewTaskModalProps) {
  const selectedGroupStyles = {
    job: 'bg-[#f5b453] text-[#5b320c] shadow-sm',
    learning: 'bg-[#a996d1] text-[#35274f] shadow-sm',
    wellness: 'bg-[#9fbe63] text-[#294114] shadow-sm',
  } as const;

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'job' | 'learning' | 'wellness'>('job');
  const [isSuggestionMenuOpen, setIsSuggestionMenuOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const isEditing = Boolean(initialTask);

  const categoryOptions = [
    { value: 'job' as const, label: 'Work' },
    { value: 'learning' as const, label: 'Learn' },
    { value: 'wellness' as const, label: 'Wellness' },
  ];

  const filteredSuggestions = useMemo(() => {
    const normalizedTitle = title.trim().toLowerCase();

    if (!normalizedTitle) {
      return suggestions[type];
    }

    return suggestions[type].filter((suggestion) => suggestion.toLowerCase().includes(normalizedTitle));
  }, [suggestions, title, type]);

  useEffect(() => {
    if (!isOpen) return;

    setTitle(initialTask?.title ?? '');
    setType(initialTask?.type ?? 'job');
    setIsSuggestionMenuOpen(false);
  }, [initialTask, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    });
  }, [isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim()) return;

    onSubmitTask({ title: title.trim(), type });
    setTitle('');
    setType('job');
    onClose();
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
          <h2 className="text-2xl font-headline font-bold text-on-surface">{isEditing ? 'Edit Task' : 'New Task'}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-container transition-colors"
            aria-label="Close task modal"
          >
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-headline font-bold text-on-surface mb-3">
              Group
            </label>
            <div className="flex gap-3">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`py-2 px-3 rounded-lg font-headline font-bold text-sm transition-all ${
                    type === option.value
                      ? selectedGroupStyles[option.value]
                      : taskConfig[option.value].badgeInactive
                  } flex-1`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-headline font-bold text-on-surface mb-2">
              Task Title
            </label>
            <div className="relative">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  setIsSuggestionMenuOpen(true);
                }}
                onFocus={() => setIsSuggestionMenuOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setIsSuggestionMenuOpen(false), 100);
                }}
                placeholder={suggestions[type].length > 0 ? 'Choose or type a task...' : 'Enter task description...'}
                className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-low focus:bg-white focus:border-primary focus:outline-none transition-all"
              />

              {isSuggestionMenuOpen && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-10 overflow-hidden rounded-xl border border-outline-variant bg-white shadow-lg">
                  <div className="max-h-48 overflow-y-auto py-1 custom-scrollbar">
                    {filteredSuggestions.map((suggestion) => (
                      <div key={suggestion} className="flex items-center gap-2 px-2 py-1">
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            setTitle(suggestion);
                            setIsSuggestionMenuOpen(false);
                          }}
                          className="flex-1 rounded-lg px-2 py-1.5 text-left text-sm text-on-surface transition-colors hover:bg-surface-container-low hover:text-primary"
                        >
                          {suggestion}
                        </button>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => onDeleteSuggestion(type, suggestion)}
                          className="rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-red-500"
                          aria-label={`Remove suggested task ${suggestion}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {suggestions[type].length > 0 && (
              <p className="mt-2 text-xs text-on-surface-variant">
                Suggestions show the most frequently repeated {taskConfig[type].label.toLowerCase()} tasks. Use the dropdown to select or remove them.
              </p>
            )}
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
              {isEditing ? 'Save Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
