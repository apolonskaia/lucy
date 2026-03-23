import { GripVertical, Trash2 } from 'lucide-react';
import { Task } from '../types';
import { motion } from 'motion/react';
import { taskConfig } from '../taskConfig';

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onDragStart?: (taskId: string) => void;
  isDragging?: boolean;
}

export default function TaskItem({ task, onToggle, onDelete, onDragStart, isDragging }: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const palette = taskConfig[task.type];
  const Icon = palette.iconComponent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      draggable
      onDragStart={() => onDragStart?.(task.id)}
      className={`flex gap-4 group ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="w-12 flex-shrink-0 text-[10px] font-extrabold font-headline text-primary/40 pt-5 text-right">
        {task.time}
      </div>
      <div
        className={`flex-1 flex items-center gap-4 p-4 rounded-xl ${palette.background} ${palette.hover} transition-all duration-300 shadow-sm hover:shadow-md ${isCompleted ? 'filter grayscale-40 opacity-90' : ''}`}
      >
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={() => onToggle(task.id)}
            className={`w-5 h-5 rounded border-on-surface-variant/20 ${palette.icon} focus:ring-0 transition-all cursor-pointer`}
          />
        </div>

        <div className="flex-1">
          <h3 className={`text-sm font-headline font-bold ${isCompleted ? 'text-on-surface-variant/70' : 'text-on-surface'}`}>
            {task.title}
          </h3>
          {task.priority && (
            <p className={`text-xs ${isCompleted ? 'text-on-surface-variant/70' : 'text-on-surface-variant'}`}>
              Priority {task.priority}
            </p>
          )}
        </div>

        {Icon && <Icon size={18} className={`${palette.icon} ${isCompleted ? 'opacity-50' : ''}`} />}

        <button
          onClick={() => onDelete(task.id)}
          className="text-on-surface-variant/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 rounded hover:bg-red-50"
        >
          <Trash2 size={16} />
        </button>

        <GripVertical size={16} className="text-on-surface-variant/20 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
}
