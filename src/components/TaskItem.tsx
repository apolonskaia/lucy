import { Pencil, Trash2 } from 'lucide-react';
import { Task } from '../types';
import { motion } from 'motion/react';
import { taskConfig } from '../taskConfig';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDragStart?: (taskId: string) => void;
  isDragging?: boolean;
}

export default function TaskItem({ task, onToggle, onEdit, onDelete, onDragStart, isDragging }: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const palette = taskConfig[task.type];
  const Icon = palette.iconComponent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      draggable
      onDragStart={() => onDragStart?.(task.id)}
      className={`flex gap-2 group ${isDragging ? 'opacity-50' : ''}`}
    >
      <div
        className={`flex-1 flex h-8 items-center gap-2 rounded-xl px-3 py-1.5 ${palette.background} ${palette.hover} transition-all duration-300 shadow-sm hover:shadow-md ${isCompleted ? 'filter grayscale-40 opacity-90' : ''}`}
      >
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => onToggle(task.id)}
            className={`h-4.5 w-4.5 rounded border-on-surface-variant/20 ${palette.icon} focus:ring-0 transition-all cursor-pointer`}
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h3 className={`min-w-0 flex-1 truncate text-sm font-headline font-bold leading-none ${isCompleted ? 'text-on-surface-variant/70' : 'text-on-surface'}`}>
            {task.title}
          </h3>
          {task.priority && (
            <span className={`shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] leading-none ${isCompleted ? 'text-on-surface-variant/70' : 'text-on-surface-variant'}`}>
              {task.priority}
            </span>
          )}
        </div>

        {Icon && <Icon size={15} className={`shrink-0 ${palette.icon} ${isCompleted ? 'opacity-50' : ''}`} />}

        <button
          onClick={() => onEdit(task)}
          className="h-7 w-7 shrink-0 rounded text-on-surface-variant/50 opacity-0 transition-opacity hover:bg-white/60 hover:text-on-surface group-hover:opacity-100"
          aria-label="Edit task"
        >
          <Pencil size={15} className="mx-auto" />
        </button>

        <button
          onClick={() => onDelete(task.id)}
          className="h-7 w-7 shrink-0 rounded text-on-surface-variant/50 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
        >
          <Trash2 size={15} className="mx-auto" />
        </button>
      </div>
    </motion.div>
  );
}
