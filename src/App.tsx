import { Plus, Target } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import TaskItem from './components/TaskItem';
import Calendar from './components/Calendar';
import ProgressMatrix from './components/ProgressMatrix';
import NewTaskModal from './components/NewTaskModal';
import { Task } from './types';

const mockTasks: Task[] = [
  {
    id: '1',
    date: '2026-03-19',
    time: '09:00',
    title: 'Review Lead Architect role at Aethel',
    category: 'Job Search',
    priority: 'High',
    status: 'pending',
    type: 'job',
  },
  {
    id: '2',
    date: '2026-03-19',
    time: '10:30',
    title: 'Finish Advanced Parametric Design Module',
    category: 'Learning',
    status: 'pending',
    type: 'learning',
  },
  {
    id: '3',
    date: '2026-03-19',
    time: '14:00',
    title: 'Morning Mindfulness (Breathwork)',
    category: 'Wellness',
    status: 'completed',
    type: 'wellness',
  },
  {
    id: '4',
    date: '2026-03-19',
    time: '16:30',
    title: 'Sketching conceptual frames for Portfolio',
    category: 'Growth',
    status: 'pending',
    type: 'growth',
  },
];

const STORAGE_KEY = 'lucy-tasks-v1';

const getToday = () => new Date();

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
    const parsed: Task[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : mockTasks;
  } catch {
    return mockTasks;
  }
};

export default function App() {
  const today = getToday();
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentMonth, setCurrentMonth] = useState({ month: today.getMonth(), year: today.getFullYear() });
  const [progressView, setProgressView] = useState<'day' | 'week' | 'month'>('day');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const formatDateDisplay = (date: Date): string => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
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

  const handleAddTask = (newTaskData: { title: string; time: string; type: 'job' | 'learning' | 'wellness' | 'growth' }) => {
    const categoryMap = {
      job: 'Job Search',
      learning: 'Learning',
      wellness: 'Wellness',
      growth: 'Growth',
    };

    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      date: formatDateToString(selectedDate),
      title: newTaskData.title,
      time: newTaskData.time,
      category: categoryMap[newTaskData.type],
      status: 'pending',
      type: newTaskData.type,
    };

    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // silent fail on unsupported environments
    }
  }, [tasks]);

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

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <TopBar />

      <main className="lg:ml-64 pt-24 pb-12 px-8 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Daily Blueprint */}
            <section className="lg:col-span-7 bg-white rounded-2xl p-8 shadow-sm relative pb-20">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-extrabold font-headline tracking-tight text-on-surface">Today</h1>
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
                      onDelete={handleDeleteTask}
                      onDragStart={handleDragStart}
                      isDragging={draggedTaskId === task.id}
                    />
                  </div>
                ))}
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                <motion.button
                  onClick={() => setIsModalOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center w-12 h-12 bg-primary text-on-primary rounded-full shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus size={24} />
                </motion.button>
              </div>
            </section>

            {/* Right Side: Calendar & Progress */}
            <aside className="lg:col-span-5 space-y-8">
              <Calendar currentMonth={currentMonth} onPrevMonth={handlePrevMonth} onNextMonth={handleNextMonth} selectedDate={selectedDate} onSelectDate={handleSelectDate} />
              <ProgressMatrix view={progressView} onViewChange={setProgressView} />
            </aside>
          </div>
        </div>
      </main>

      {/* Floating Focus Orb */}
      <div className="fixed bottom-8 right-8 z-50 group">
        <div className="flex flex-col items-center gap-2">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="bg-primary text-on-primary text-[10px] font-bold py-1.5 px-4 rounded-full shadow-lg pointer-events-none"
          >
            Start Session
          </motion.span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-on-primary shadow-2xl"
          >
            <Target size={32} />
          </motion.button>
        </div>
      </div>

      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTask={handleAddTask} />
    </div>
  );
}
