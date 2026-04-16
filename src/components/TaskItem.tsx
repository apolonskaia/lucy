import { GripVertical, Trash2 } from 'lucide-react';
import { useEffect, useState, type DragEvent, type KeyboardEvent } from 'react';
import { Task } from '../types';
import { motion } from 'motion/react';
import { taskConfig } from '../taskConfig';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onUpdate: (taskId: string, updates: Pick<Task, 'title'>) => void;
  onDelete: (taskId: string) => void;
  onDragStart?: (event: DragEvent<HTMLDivElement>, taskId: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export default function TaskItem({ task, onToggle, onUpdate, onDelete, onDragStart, onDragEnd, isDragging }: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const palette = taskConfig[task.type];
  const Icon = palette.iconComponent;
  const [titleDraft, setTitleDraft] = useState(task.title);

  useEffect(() => {
    setTitleDraft(task.title);
  }, [task.title]);

  const commitTitle = () => {
    const trimmedTitle = titleDraft.trim();

    if (!trimmedTitle) {
      setTitleDraft(task.title);
      return;
    }

    if (trimmedTitle !== task.title) {
      onUpdate(task.id, { title: trimmedTitle });
      return;
    }

    if (trimmedTitle !== titleDraft) {
      setTitleDraft(trimmedTitle);
    }
  };

  const handleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
      return;
    }

    if (event.key === 'Escape') {
      setTitleDraft(task.title);
      event.currentTarget.blur();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <div
        className={`flex h-8 items-center gap-2 rounded-xl px-3 py-1 ${palette.background} ${palette.hover} transition-all duration-300 shadow-sm hover:shadow-md ${isCompleted ? 'filter grayscale-40 opacity-90' : ''} ${isDragging ? 'opacity-50' : ''}`}
      >
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => onToggle(task.id)}
            className={`h-4.5 w-4.5 rounded border-on-surface-variant/20 bg-white ${palette.icon} focus:ring-0 transition-all cursor-pointer`}
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            type="text"
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={handleTitleKeyDown}
            className={`min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-0.5 text-sm font-headline font-bold leading-none transition-colors focus:border-outline-variant focus:bg-white/70 focus:outline-none ${isCompleted ? 'text-on-surface-variant/70' : 'text-on-surface'}`}
            aria-label="Task title"
          />

          {task.priority && (
            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] leading-none ${isCompleted ? 'text-on-surface-variant/70' : 'text-on-surface-variant'}`}>
              {task.priority}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => onDelete(task.id)}
            className="h-7 w-7 shrink-0 rounded text-on-surface-variant/50 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
          >
            <Trash2 size={15} className="mx-auto" />
          </button>

          <div
            draggable
            onDragStart={(event) => onDragStart?.(event, task.id)}
            onDragEnd={onDragEnd}
            className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-md text-on-surface-variant/50 opacity-0 transition-all hover:bg-white/60 hover:text-on-surface group-hover:opacity-100 active:cursor-grabbing"
            aria-label="Drag task"
          >
            <GripVertical size={15} />
          </div>

          {Icon && <Icon size={15} className={`shrink-0 ${palette.icon} ${isCompleted ? 'opacity-50' : ''}`} />}
        </div>
      </div>
    </motion.div>
  );
}
