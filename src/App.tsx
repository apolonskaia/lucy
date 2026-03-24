import { Plus } from 'lucide-react';
import { useState, useEffect, type DragEvent } from 'react';
import { motion } from 'motion/react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import TaskItem from './components/TaskItem';
import Calendar from './components/Calendar';
import ProgressMatrix from './components/ProgressMatrix';
import NewTaskModal from './components/NewTaskModal';
import MonthlyGoals from './components/MonthlyGoals';
import { MonthlyGoal, ProgressItem, Task } from './types';
import { taskConfig } from './taskConfig';

const mockTasks: Task[] = [
  {
    id: '1',
    date: '2026-03-19',
    title: 'Review Lead Architect role at Aethel',
    category: 'Job Search',
    priority: 'High',
    status: 'pending',
    type: 'job',
  },
  {
    id: '2',
    date: '2026-03-19',
    title: 'Finish Advanced Parametric Design Module',
    category: 'Learning',
    status: 'pending',
    type: 'learning',
  },
  {
    id: '3',
    date: '2026-03-19',
    title: 'Morning Mindfulness (Breathwork)',
    category: 'Wellness',
    status: 'completed',
    type: 'wellness',
  },
  {
    id: '4',
    date: '2026-03-19',
    title: 'Sketching conceptual frames for Portfolio',
    category: 'Learning',
    status: 'pending',
    type: 'learning',
  },
];

const STORAGE_KEY = 'lucy-tasks-v1';
const MONTHLY_GOALS_STORAGE_KEY = 'lucy-monthly-goals-v1';

const getToday = () => new Date();

const formatMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const loadTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return mockTasks;
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return mockTasks;

    return parsed.map((task) => {
      if (task?.type === 'growth') {
        return {
          ...task,
          category: 'Learning',
          type: 'learning',
        } satisfies Task;
      }

      return task as Task;
    });
  } catch {
    return mockTasks;
  }
};

const createMockMonthlyGoals = (): MonthlyGoal[] => {
  const month = formatMonthKey(getToday());

  return [
    {
      id: 'goal-1',
      month,
      title: 'Submit 8 tailored applications',
      type: 'job',
    },
    {
      id: 'goal-2',
      month,
      title: 'Finish one full certification module',
      type: 'learning',
    },
    {
      id: 'goal-3',
      month,
      title: 'Keep a 20-day mindfulness streak',
      type: 'wellness',
    },
  ];
};

const loadMonthlyGoals = (): MonthlyGoal[] => {
  try {
    const raw = localStorage.getItem(MONTHLY_GOALS_STORAGE_KEY);
    if (!raw) return createMockMonthlyGoals();
    const parsed: MonthlyGoal[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : createMockMonthlyGoals();
  } catch {
    return createMockMonthlyGoals();
  }
};

export default function App() {
  const today = getToday();
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentMonth, setCurrentMonth] = useState({ month: today.getMonth(), year: today.getFullYear() });
  const [monthlyGoalsMonth, setMonthlyGoalsMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>(() => loadMonthlyGoals());
  const [progressView, setProgressView] = useState<'day' | 'week' | 'month'>('day');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const progressGroups = [
    { type: 'job' as const, label: taskConfig.job.label, color: taskConfig.job.progress },
    { type: 'learning' as const, label: taskConfig.learning.label, color: taskConfig.learning.progress },
    { type: 'wellness' as const, label: taskConfig.wellness.label, color: taskConfig.wellness.progress },
  ];
  const taskTypes = ['job', 'learning', 'wellness'] as const;

  const currentMonthlyGoalsKey = formatMonthKey(monthlyGoalsMonth);
  const monthlyGoalsForSelectedMonth = monthlyGoals.filter((goal) => goal.month === currentMonthlyGoalsKey);
  const taskTitleSuggestions = taskTypes.reduce<Record<'job' | 'learning' | 'wellness', string[]>>(
    (accumulator, taskType) => {
      const titleCounts = tasks
        .filter((task) => task.type === taskType)
        .reduce<Record<string, number>>((counts, task) => {
          const trimmedTitle = task.title.trim();

          if (!trimmedTitle) {
            return counts;
          }

          counts[trimmedTitle] = (counts[trimmedTitle] ?? 0) + 1;
          return counts;
        }, {});

      accumulator[taskType] = Object.entries(titleCounts)
        .map(([title, count]) => [title, count] as [string, number])
        .filter(([, count]) => count > 1)
        .sort((firstEntry, secondEntry) => secondEntry[1] - firstEntry[1] || firstEntry[0].localeCompare(secondEntry[0]))
        .map(([title]) => title);

      return accumulator;
    },
    {
      job: [],
      learning: [],
      wellness: [],
    }
  );

  const getWeekRange = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const dayOfWeek = start.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start.setDate(start.getDate() - daysFromMonday);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end }; 
  };

  const isSameDay = (taskDate: Date, targetDate: Date) =>
    taskDate.getFullYear() === targetDate.getFullYear() &&
    taskDate.getMonth() === targetDate.getMonth() &&
    taskDate.getDate() === targetDate.getDate();

  const isSameMonth = (taskDate: Date, targetDate: Date) =>
    taskDate.getFullYear() === targetDate.getFullYear() && taskDate.getMonth() === targetDate.getMonth();

  const buildProgressItems = (range: 'day' | 'week' | 'month'): ProgressItem[] => {
    const selectedWeek = getWeekRange(selectedDate);

    const filteredTasks = tasks.filter((task) => {
      const taskDate = new Date(`${task.date}T00:00:00`);

      if (range === 'day') return isSameDay(taskDate, selectedDate);
      if (range === 'week') return taskDate >= selectedWeek.start && taskDate <= selectedWeek.end;
      return isSameMonth(taskDate, selectedDate);
    });

    return progressGroups.map((group) => {
      const groupTasks = filteredTasks.filter((task) => task.type === group.type);
      const completedTasks = groupTasks.filter((task) => task.status === 'completed');
      const value = groupTasks.length === 0 ? 0 : Math.round((completedTasks.length / groupTasks.length) * 100);

      return {
        label: group.label,
        value,
        color: group.color,
      };
    });
  };

  const progressItems = buildProgressItems(progressView);
  const isSelectedDateToday = isSameDay(selectedDate, today);

  const formatDateDisplay = (date: Date): string => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();
    return `${dayName}, ${monthName} ${day}`;
  };

  const getTasksForSelectedDate = (): Task[] => {
    const selectedDateStr = formatDateToString(selectedDate);
    return tasks.filter((task) => task.date === selectedDateStr);
  };

  const handleSelectDate = (day: number) => {
    const newDate = new Date(currentMonth.year, currentMonth.month, day);
    setSelectedDate(newDate);
    setCurrentMonth({ month: newDate.getMonth(), year: newDate.getFullYear() });
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
          : task
      )
    );
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedTaskId === null) return;

    const draggedIndex = tasks.findIndex((task) => task.id === draggedTaskId);
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedTaskId(null);
      return;
    }

    const newTasks = [...tasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(dropIndex, 0, draggedTask);
    setTasks(newTasks);
    setDraggedTaskId(null);
    setDragOverIndex(null);
  };

  const handleOpenNewTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSubmitTask = (taskData: { title: string; type: 'job' | 'learning' | 'wellness' }) => {
    const categoryMap = {
      job: 'Job Search',
      learning: 'Learning',
      wellness: 'Wellness',
    };

    if (editingTask) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === editingTask.id
            ? {
                ...task,
                title: taskData.title,
                category: categoryMap[taskData.type],
                type: taskData.type,
              }
            : task
        )
      );
      setEditingTask(null);
      return;
    }

    const newTask: Task = {
      id: Math.random().toString(36).slice(2, 11),
      date: formatDateToString(selectedDate),
      title: taskData.title,
      category: categoryMap[taskData.type],
      status: 'pending',
      type: taskData.type,
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  const handleCloseTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(false);
  };

  const handleAddMonthlyGoal = (goal: { title: string; type: 'job' | 'learning' | 'wellness' }) => {
    setMonthlyGoals((prevGoals) => [
      ...prevGoals,
      {
        id: Math.random().toString(36).slice(2, 11),
        month: currentMonthlyGoalsKey,
        title: goal.title,
        type: goal.type,
      },
    ]);
  };

  const handleUpdateMonthlyGoal = (goalId: string, updatedGoal: { title: string; type: 'job' | 'learning' | 'wellness' }) => {
    setMonthlyGoals((prevGoals) =>
      prevGoals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              title: updatedGoal.title,
              type: updatedGoal.type,
            }
          : goal
      )
    );
  };

  const handleDeleteMonthlyGoal = (goalId: string) => {
    setMonthlyGoals((prevGoals) => prevGoals.filter((goal) => goal.id !== goalId));
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // silent fail on unsupported environments
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(MONTHLY_GOALS_STORAGE_KEY, JSON.stringify(monthlyGoals));
    } catch {
      // silent fail on unsupported environments
    }
  }, [monthlyGoals]);

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) {
        return { month: 11, year: prev.year - 1 };
      }
      return { ...prev, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) {
        return { month: 0, year: prev.year + 1 };
      }
      return { ...prev, month: prev.month + 1 };
    });
  };

  const handlePrevGoalsMonth = () => {
    setMonthlyGoalsMonth((prevMonth) => new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1));
  };

  const handleNextGoalsMonth = () => {
    setMonthlyGoalsMonth((prevMonth) => new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1));
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <TopBar />

      <main className="lg:ml-64 pt-24 pb-12 px-8 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              {/* Daily Blueprint */}
              <section className="bg-white rounded-2xl p-8 shadow-sm relative pb-20">
                <div className="flex items-center justify-between mb-8">
                  <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">
                    {isSelectedDateToday ? 'Today' : formatDateDisplay(selectedDate)}
                  </h1>
                  <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full">
                    {formatDateDisplay(selectedDate)}
                  </span>
                </div>

                <div className="space-y-4 custom-scrollbar overflow-y-auto max-h-[500px] pr-2">
                  {getTasksForSelectedDate().map((task, index) => (
                    <div
                      key={task.id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={dragOverIndex === index ? 'opacity-50' : ''}
                    >
                      <TaskItem
                        task={task}
                        onToggle={handleToggleTask}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onDragStart={handleDragStart}
                        isDragging={draggedTaskId === task.id}
                      />
                    </div>
                  ))}
                </div>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <motion.button
                    onClick={handleOpenNewTaskModal}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center w-10 h-10 bg-primary/80 text-on-primary rounded-full shadow-md hover:shadow-lg transition-all"
                  >
                    <Plus size={20} />
                  </motion.button>
                </div>
              </section>
            </div>

            {/* Right Side: Calendar & Progress */}
            <aside className="lg:col-span-5 space-y-5">
              <Calendar currentMonth={currentMonth} onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} selectedDate={selectedDate} onSelectDate={handleSelectDate} />
              <MonthlyGoals
                goals={monthlyGoalsForSelectedMonth}
                currentMonth={monthlyGoalsMonth}
                onPrevMonth={handlePrevGoalsMonth}
                onNextMonth={handleNextGoalsMonth}
                onAddGoal={handleAddMonthlyGoal}
                onUpdateGoal={handleUpdateMonthlyGoal}
                onDeleteGoal={handleDeleteMonthlyGoal}
              />
              <ProgressMatrix view={progressView} onViewChange={setProgressView} items={progressItems} />
            </aside>
          </div>
        </div>
      </main>

      <NewTaskModal
        isOpen={isModalOpen}
        onClose={handleCloseTaskModal}
        onSubmitTask={handleSubmitTask}
        initialTask={editingTask}
        suggestions={taskTitleSuggestions}
      />
    </div>
  );
}
