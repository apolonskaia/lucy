import { Plus, X } from 'lucide-react';
import { Suspense, lazy, useEffect, useState, type DragEvent, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import TaskItem from './components/TaskItem';
import Calendar from './components/Calendar';
import ProgressMatrix from './components/ProgressMatrix';
import NewTaskModal from './components/NewTaskModal';
import MonthlyGoals from './components/MonthlyGoals';
import { AppPage, JobApplication, JobStrategyNote, LearningResource, MonthlyGoal, ProgressItem, Task } from './types';
import { taskConfig } from './taskConfig';

const JobApplicationTracker = lazy(() => import('./components/JobApplicationTracker'));
const LearningResourcesTracker = lazy(() => import('./components/LearningResourcesTracker'));
const WellnessMeditationTimer = lazy(() => import('./components/WellnessMeditationTimer'));

type SheetValue = string | number;
type DropPosition = 'before' | 'after';

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
const JOB_APPLICATIONS_STORAGE_KEY = 'lucy-job-applications-v1';
const JOB_STRATEGY_NOTES_STORAGE_KEY = 'lucy-job-strategy-notes-v1';
const LEARNING_RESOURCES_STORAGE_KEY = 'lucy-learning-resources-v1';
const HIDDEN_TASK_SUGGESTIONS_STORAGE_KEY = 'lucy-hidden-task-suggestions-v1';
const BLOCKED_TASK_SUGGESTIONS_STORAGE_KEY = 'lucy-blocked-task-suggestions-v1';
const CITATION_STORAGE_KEY = 'lucy-citation-v1';
const appPages: AppPage[] = ['journal', 'job-search', 'learning-hub', 'wellness-tracker'];
type TaskType = 'job' | 'learning' | 'wellness';
type HiddenTaskSuggestionsByDate = Record<string, Record<TaskType, string[]>>;
type BlockedTaskSuggestions = Record<TaskType, Record<string, number>>;
type PendingBlockedSuggestion = { title: string; type: TaskType } | null;

const pageConfig: Record<AppPage, { title: string; description: string; taskType?: Task['type'] }> = {
  journal: {
    title: 'Journal',
    description: 'Your daily planning view for tasks, calendar, monthly goals, and progress.',
  },
  'job-search': {
    title: 'Job Search',
    description: 'Keep applications, interview prep, and outreach in one place.',
    taskType: 'job',
  },
  'learning-hub': {
    title: 'Learning Hub',
    description: 'Track study sessions, courses, and repeated learning habits.',
    taskType: 'learning',
  },
  'wellness-tracker': {
    title: 'Wellness Tracker',
    description: 'Review routines, recovery habits, and monthly wellness goals.',
    taskType: 'wellness',
  },
};

const getToday = () => new Date();

const getPageFromHash = (): AppPage => {
  if (typeof window === 'undefined') return 'journal';

  const hash = window.location.hash.replace('#', '');
  return appPages.includes(hash as AppPage) ? (hash as AppPage) : 'journal';
};

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

const createMockJobApplications = (): JobApplication[] => [
  {
    id: 'job-1',
    jobTitle: 'Senior Computational Biologist',
    company: 'Helix Forge',
    type: 'biotech',
    applicationDate: '2026-03-18',
    status: 'interview',
    link: 'https://example.com/jobs/helix-forge-computational-biologist',
  },
  {
    id: 'job-2',
    jobTitle: 'Applied AI Research Engineer',
    company: 'Astra North',
    type: 'tech',
    applicationDate: '2026-03-15',
    status: 'applied',
    link: 'https://example.com/jobs/astra-north-ai-research-engineer',
  },
];

const loadJobApplications = (): JobApplication[] => {
  try {
    const raw = localStorage.getItem(JOB_APPLICATIONS_STORAGE_KEY);
    if (!raw) return createMockJobApplications();
    const parsed: JobApplication[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : createMockJobApplications();
  } catch {
    return createMockJobApplications();
  }
};

const loadJobStrategyNotes = (): JobStrategyNote[] => {
  try {
    const raw = localStorage.getItem(JOB_STRATEGY_NOTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: JobStrategyNote[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const createMockLearningResources = (): LearningResource[] => [
  {
    id: 'learning-course-1',
    title: 'DeepLearning.AI: Generative AI for Everyone',
    link: 'https://www.deeplearning.ai/courses/generative-ai-for-everyone/',
    kind: 'course',
    status: 'in-progress',
  },
  {
    id: 'learning-course-2',
    title: 'Full Stack Deep Learning 2022',
    link: 'https://fullstackdeeplearning.com/course/2022/',
    kind: 'course',
    status: 'want-to-do',
  },
  {
    id: 'learning-paper-1',
    title: 'Attention Is All You Need',
    link: 'https://arxiv.org/abs/1706.03762',
    kind: 'paper',
    status: 'finished',
  },
  {
    id: 'learning-paper-2',
    title: 'The Illustrated AlphaFold',
    link: 'https://jalammar.github.io/illustrated-alphafold/',
    kind: 'paper',
    status: 'want-to-do',
  },
];

const loadLearningResources = (): LearningResource[] => {
  try {
    const raw = localStorage.getItem(LEARNING_RESOURCES_STORAGE_KEY);
    if (!raw) return createMockLearningResources();
    const parsed: LearningResource[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : createMockLearningResources();
  } catch {
    return createMockLearningResources();
  }
};

const createEmptyHiddenTaskSuggestionGroups = (): Record<TaskType, string[]> => ({
  job: [],
  learning: [],
  wellness: [],
});

const createEmptyBlockedTaskSuggestions = (): BlockedTaskSuggestions => ({
  job: {},
  learning: {},
  wellness: {},
});

const loadBlockedTaskSuggestions = (): BlockedTaskSuggestions => {
  try {
    const raw = localStorage.getItem(BLOCKED_TASK_SUGGESTIONS_STORAGE_KEY);

    if (!raw) {
      return createEmptyBlockedTaskSuggestions();
    }

    const parsed = JSON.parse(raw) as Partial<Record<TaskType, unknown>>;

    const normalizeBlockedGroup = (value: unknown) => {
      if (Array.isArray(value)) {
        return value.reduce<Record<string, number>>((accumulator, title) => {
          if (typeof title === 'string') {
            accumulator[title] = 2;
          }

          return accumulator;
        }, {});
      }

      if (!value || typeof value !== 'object') {
        return {};
      }

      return Object.entries(value).reduce<Record<string, number>>((accumulator, [title, count]) => {
        if (typeof count === 'number' && Number.isFinite(count)) {
          accumulator[title] = count;
        }

        return accumulator;
      }, {});
    };

    return {
      job: normalizeBlockedGroup(parsed.job),
      learning: normalizeBlockedGroup(parsed.learning),
      wellness: normalizeBlockedGroup(parsed.wellness),
    };
  } catch {
    return createEmptyBlockedTaskSuggestions();
  }
};

const loadHiddenTaskSuggestions = (): HiddenTaskSuggestionsByDate => {
  try {
    const raw = localStorage.getItem(HIDDEN_TASK_SUGGESTIONS_STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Record<string, Partial<Record<TaskType, unknown>>>;

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      return {};
    }

    return Object.entries(parsed).reduce<HiddenTaskSuggestionsByDate>((accumulator, [dateKey, hiddenTitles]) => {
      if (!hiddenTitles || Array.isArray(hiddenTitles) || typeof hiddenTitles !== 'object') {
        return accumulator;
      }

      accumulator[dateKey] = {
        job: Array.isArray(hiddenTitles.job)
          ? hiddenTitles.job.filter((item): item is string => typeof item === 'string')
          : [],
        learning: Array.isArray(hiddenTitles.learning)
          ? hiddenTitles.learning.filter((item): item is string => typeof item === 'string')
          : [],
        wellness: Array.isArray(hiddenTitles.wellness)
          ? hiddenTitles.wellness.filter((item): item is string => typeof item === 'string')
          : [],
      };

      return accumulator;
    }, {});
  } catch {
    return {};
  }
};

const loadCitation = (): string => {
  try {
    const raw = localStorage.getItem(CITATION_STORAGE_KEY);
    return typeof raw === 'string' ? raw : '';
  } catch {
    return '';
  }
};

const buildMonthlyApplicationSummary = (applications: JobApplication[]) => {
  const monthFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  });
  const summaryByMonth = new Map<
    string,
    {
      label: string;
      total: number;
      weeks: [number, number, number, number, number];
      hasWeekFive: boolean;
    }
  >();

  applications.forEach((application) => {
    if (application.status === 'saved' || !application.applicationDate) {
      return;
    }

    const appliedAt = new Date(`${application.applicationDate}T12:00:00`);

    if (Number.isNaN(appliedAt.getTime())) {
      return;
    }

    const monthKey = application.applicationDate.slice(0, 7);
    const weekIndex = Math.min(4, Math.floor((appliedAt.getDate() - 1) / 7));
    const existingMonth = summaryByMonth.get(monthKey);

    if (existingMonth) {
      existingMonth.total += 1;
      existingMonth.weeks[weekIndex] += 1;
      return;
    }

    const [year, month] = monthKey.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const weeks: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    weeks[weekIndex] = 1;

    summaryByMonth.set(monthKey, {
      label: monthFormatter.format(appliedAt),
      total: 1,
      weeks,
      hasWeekFive: daysInMonth > 28,
    });
  });

  return Array.from(summaryByMonth.entries())
    .sort(([firstMonth], [secondMonth]) => secondMonth.localeCompare(firstMonth))
    .map(([month, summary]) => ({ month, ...summary }));
};

const addSheetSection = (
  rows: SheetValue[][],
  title: string,
  headers: SheetValue[],
  dataRows: SheetValue[][],
  emptyMessage: string
) => {
  if (rows.length > 0) {
    rows.push([]);
  }

  rows.push([title]);
  rows.push(headers);

  if (dataRows.length === 0) {
    rows.push([emptyMessage]);
    return;
  }

  rows.push(...dataRows);
};

const startOfWeek = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const dayOfWeek = result.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  result.setDate(result.getDate() - daysFromMonday);
  return result;
};

const endOfWeek = (date: Date) => {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

export default function App() {
  const today = getToday();
  const taskTypes = ['job', 'learning', 'wellness'] as const;
  const [activePage, setActivePage] = useState<AppPage>(() => getPageFromHash());
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const selectedDateStr = formatDateToString(selectedDate);
  const [currentMonth, setCurrentMonth] = useState({ month: today.getMonth(), year: today.getFullYear() });
  const [monthlyGoalsMonth, setMonthlyGoalsMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>(() => loadMonthlyGoals());
  const [jobApplications, setJobApplications] = useState<JobApplication[]>(() => loadJobApplications());
  const [jobStrategyMonth, setJobStrategyMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [jobStrategyNotes, setJobStrategyNotes] = useState<JobStrategyNote[]>(() => loadJobStrategyNotes());
  const [learningResources, setLearningResources] = useState<LearningResource[]>(() => loadLearningResources());
  const [hiddenTaskSuggestions, setHiddenTaskSuggestions] = useState<HiddenTaskSuggestionsByDate>(() => loadHiddenTaskSuggestions());
  const [blockedTaskSuggestions, setBlockedTaskSuggestions] = useState<BlockedTaskSuggestions>(() => loadBlockedTaskSuggestions());
  const [citation, setCitation] = useState<string>(() => loadCitation());
  const [progressView, setProgressView] = useState<'day' | 'week' | 'month'>('day');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingBlockedSuggestion, setPendingBlockedSuggestion] = useState<PendingBlockedSuggestion>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<DropPosition | null>(null);
  const [isDraggingOverListEnd, setIsDraggingOverListEnd] = useState(false);

  const progressGroups = [
    { type: 'job' as const, label: taskConfig.job.label, color: taskConfig.job.progress },
    { type: 'learning' as const, label: taskConfig.learning.label, color: taskConfig.learning.progress },
    { type: 'wellness' as const, label: taskConfig.wellness.label, color: taskConfig.wellness.progress },
  ];
  const rollingWeekEnd = new Date(selectedDate);
  rollingWeekEnd.setHours(23, 59, 59, 999);
  const rollingWeekStart = new Date(selectedDate);
  rollingWeekStart.setHours(0, 0, 0, 0);
  rollingWeekStart.setDate(rollingWeekStart.getDate() - 6);
  const tasksForSelectedWeek = tasks.filter((task) => {
    const taskDate = new Date(`${task.date}T00:00:00`);
    return taskDate >= rollingWeekStart && taskDate <= rollingWeekEnd;
  });

  const currentMonthlyGoalsKey = formatMonthKey(monthlyGoalsMonth);
  const monthlyGoalsForSelectedMonth = monthlyGoals.filter((goal) => goal.month === currentMonthlyGoalsKey);
  const currentJobStrategyKey = formatMonthKey(jobStrategyMonth);
  const jobStrategyNotesForSelectedMonth = jobStrategyNotes.filter((note) => note.month === currentJobStrategyKey);
  const hiddenSuggestionsForSelectedDate = hiddenTaskSuggestions[selectedDateStr] ?? createEmptyHiddenTaskSuggestionGroups();
  const taskTitleSuggestions = taskTypes.reduce<Record<'job' | 'learning' | 'wellness', string[]>>(
    (accumulator, taskType) => {
      const titleCounts = tasksForSelectedWeek
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
        .filter(([title]) => !hiddenSuggestionsForSelectedDate[taskType].includes(title))
        .filter(([title, count]) => {
          const blockedAtCount = blockedTaskSuggestions[taskType][title];
          return blockedAtCount === undefined || count > blockedAtCount;
        })
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
  const suggestedTaskOutlineClasses = {
    job: 'border-[#fdecb0]',
    learning: 'border-violet-100',
    wellness: 'border-lime-100',
  } as const;
  const tasksForSelectedDate = tasks.filter((task) => task.date === selectedDateStr);
  const suggestedTasksForSelectedDate = taskTypes.flatMap((taskType) => {
    const titlesForSelectedDate = new Set(
      tasksForSelectedDate
        .filter((task) => task.type === taskType)
        .map((task) => task.title.trim().toLowerCase())
        .filter(Boolean)
    );

    return taskTitleSuggestions[taskType]
      .filter((title) => !titlesForSelectedDate.has(title.trim().toLowerCase()))
      .map((title) => ({
        title,
        type: taskType,
      }));
  });

  const formatDateDisplay = (date: Date): string => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();
    return `${dayName}, ${monthName} ${day}`;
  };

  const getTasksForSelectedDate = (): Task[] => {
    return tasksForSelectedDate;
  };

  const clearDragState = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDragOverPosition(null);
    setIsDraggingOverListEnd(false);
  };

  const reorderTasksForSelectedDate = (
    currentTasks: Task[],
    taskIdToMove: string,
    targetTaskId: string | null,
    dropPosition: DropPosition
  ) => {
    const selectedDateStr = formatDateToString(selectedDate);
    const dailyTasks = currentTasks.filter((task) => task.date === selectedDateStr);
    const taskMap = new Map(dailyTasks.map((task) => [task.id, task]));
    const reorderedTaskIds = dailyTasks.map((task) => task.id).filter((taskId) => taskId !== taskIdToMove);

    if (!taskMap.has(taskIdToMove)) {
      return currentTasks;
    }

    const insertionIndex =
      targetTaskId === null
        ? reorderedTaskIds.length
        : reorderedTaskIds.indexOf(targetTaskId) + (dropPosition === 'after' ? 1 : 0);

    if (insertionIndex < 0) {
      return currentTasks;
    }

    reorderedTaskIds.splice(insertionIndex, 0, taskIdToMove);

    const reorderedDailyTasks = reorderedTaskIds
      .map((taskId) => taskMap.get(taskId))
      .filter((task): task is Task => Boolean(task));

    let dailyTaskIndex = 0;

    return currentTasks.map((task) => {
      if (task.date !== selectedDateStr) {
        return task;
      }

      const nextTask = reorderedDailyTasks[dailyTaskIndex];
      dailyTaskIndex += 1;
      return nextTask;
    });
  };

  const handleSelectDate = (day: number) => {
    const newDate = new Date(currentMonth.year, currentMonth.month, day);
    setSelectedDate(newDate);
    setCurrentMonth({ month: newDate.getMonth(), year: newDate.getFullYear() });
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prevTasks) => {
      const taskToToggle = prevTasks.find((task) => task.id === taskId);

      if (!taskToToggle) {
        return prevTasks;
      }

      const nextStatus = taskToToggle.status === 'completed' ? 'pending' : 'completed';
      const updatedTask = { ...taskToToggle, status: nextStatus };
      const sameDateTasks = prevTasks.filter((task) => task.date === taskToToggle.date);
      const remainingSameDateTasks = sameDateTasks.filter((task) => task.id !== taskId);
      const pendingTasks = remainingSameDateTasks.filter((task) => task.status !== 'completed');
      const completedTasks = remainingSameDateTasks.filter((task) => task.status === 'completed');

      const reorderedSameDateTasks =
        nextStatus === 'completed'
          ? [...pendingTasks, ...completedTasks, updatedTask]
          : [...pendingTasks, updatedTask, ...completedTasks];

      let sameDateTaskIndex = 0;

      return prevTasks.map((task) => {
        if (task.date !== taskToToggle.date) {
          return task;
        }

        const nextTask = reorderedSameDateTasks[sameDateTaskIndex];
        sameDateTaskIndex += 1;
        return nextTask;
      });
    });
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, taskId: string) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    clearDragState();
  };

  const getDropPosition = (element: HTMLDivElement | null, clientY: number): DropPosition => {
    if (element === null) {
      return 'after';
    }

    const { top, height } = element.getBoundingClientRect();
    return clientY < top + height / 2 ? 'before' : 'after';
  };

  const handleDragEnterTask = (event: DragEvent<HTMLDivElement>, targetTaskId: string) => {
    event.preventDefault();

    if (draggedTaskId === null || draggedTaskId === targetTaskId) {
      return;
    }

    const dropPosition = getDropPosition(event.currentTarget, event.clientY);

    setDragOverTaskId(targetTaskId);
    setDragOverPosition(dropPosition);
    setIsDraggingOverListEnd(false);
  };

  const handleDragOverTask = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDragEnterListEnd = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (draggedTaskId === null) {
      return;
    }

    setDragOverTaskId(null);
    setDragOverPosition(null);
    setIsDraggingOverListEnd(true);
  };

  const handleDragOverListEnd = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDropOnTask = (event: DragEvent<HTMLDivElement>, targetTaskId: string) => {
    event.preventDefault();

    if (draggedTaskId === null || draggedTaskId === targetTaskId) {
      clearDragState();
      return;
    }

    const dropPosition = getDropPosition(event.currentTarget, event.clientY);

    setTasks((prevTasks) => reorderTasksForSelectedDate(prevTasks, draggedTaskId, targetTaskId, dropPosition));
    clearDragState();
  };

  const handleDropAtListEnd = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (draggedTaskId === null) {
      return;
    }

    setTasks((prevTasks) => reorderTasksForSelectedDate(prevTasks, draggedTaskId, null, 'after'));
    clearDragState();
  };

  const handleOpenNewTaskModal = () => {
    setIsModalOpen(true);
  };

  const handleSubmitTask = (taskData: { title: string; type: 'job' | 'learning' | 'wellness' }) => {
    const categoryMap = {
      job: 'Job Search',
      learning: 'Learning',
      wellness: 'Wellness',
    };

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

  const handleAddSuggestedTask = (taskData: { title: string; type: 'job' | 'learning' | 'wellness' }) => {
    const normalizedTitle = taskData.title.trim().toLowerCase();

    if (!normalizedTitle) {
      return;
    }

    const taskAlreadyExists = tasksForSelectedDate.some(
      (task) => task.type === taskData.type && task.title.trim().toLowerCase() === normalizedTitle
    );

    if (taskAlreadyExists) {
      return;
    }

    handleSubmitTask(taskData);
  };

  const handleSuggestedTaskKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    taskData: { title: string; type: 'job' | 'learning' | 'wellness' }
  ) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    handleAddSuggestedTask(taskData);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
  };

  const handleUpdateTask = (taskId: string, updates: Pick<Task, 'title'>) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...updates,
            }
          : task
      )
    );
  };

  const handleMoveTaskToNextDay = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        const nextDate = new Date(`${task.date}T12:00:00`);
        nextDate.setDate(nextDate.getDate() + 1);

        return {
          ...task,
          date: formatDateToString(nextDate),
        };
      })
    );
  };

  const handleCloseTaskModal = () => {
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

  useEffect(() => {
    try {
      localStorage.setItem(JOB_APPLICATIONS_STORAGE_KEY, JSON.stringify(jobApplications));
    } catch {
      // silent fail on unsupported environments
    }
  }, [jobApplications]);

  useEffect(() => {
    try {
      localStorage.setItem(JOB_STRATEGY_NOTES_STORAGE_KEY, JSON.stringify(jobStrategyNotes));
    } catch {
      // silent fail on unsupported environments
    }
  }, [jobStrategyNotes]);

  useEffect(() => {
    try {
      localStorage.setItem(LEARNING_RESOURCES_STORAGE_KEY, JSON.stringify(learningResources));
    } catch {
      // silent fail on unsupported environments
    }
  }, [learningResources]);

  useEffect(() => {
    try {
      localStorage.setItem(HIDDEN_TASK_SUGGESTIONS_STORAGE_KEY, JSON.stringify(hiddenTaskSuggestions));
    } catch {
      // silent fail on unsupported environments
    }
  }, [hiddenTaskSuggestions]);

  useEffect(() => {
    try {
      localStorage.setItem(BLOCKED_TASK_SUGGESTIONS_STORAGE_KEY, JSON.stringify(blockedTaskSuggestions));
    } catch {
      // silent fail on unsupported environments
    }
  }, [blockedTaskSuggestions]);

  useEffect(() => {
    try {
      localStorage.setItem(CITATION_STORAGE_KEY, citation);
    } catch {
      // silent fail on unsupported environments
    }
  }, [citation]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncPageFromHash = () => setActivePage(getPageFromHash());

    window.addEventListener('hashchange', syncPageFromHash);
    return () => window.removeEventListener('hashchange', syncPageFromHash);
  }, []);

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

  const handlePrevJobStrategyMonth = () => {
    setJobStrategyMonth((prevMonth) => new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1));
  };

  const handleNextJobStrategyMonth = () => {
    setJobStrategyMonth((prevMonth) => new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1));
  };

  const handleNavigate = (page: AppPage) => {
    setActivePage(page);

    if (typeof window !== 'undefined' && window.location.hash !== `#${page}`) {
      window.location.hash = page;
    }
  };

  const handleAddJobApplication = (application: Omit<JobApplication, 'id'>) => {
    setJobApplications((previousApplications) => [
      {
        id: Math.random().toString(36).slice(2, 11),
        ...application,
      },
      ...previousApplications,
    ]);
  };

  const handleUpdateJobApplication = (applicationId: string, updatedApplication: Omit<JobApplication, 'id'>) => {
    setJobApplications((previousApplications) =>
      previousApplications.map((application) =>
        application.id === applicationId
          ? { id: application.id, ...updatedApplication }
          : application
      )
    );
  };

  const handleDeleteJobApplication = (applicationId: string) => {
    setJobApplications((previousApplications) =>
      previousApplications.filter((application) => application.id !== applicationId)
    );
  };

  const handleAddJobStrategyNote = (note: { title: string }) => {
    setJobStrategyNotes((previousNotes) => [
      ...previousNotes,
      {
        id: Math.random().toString(36).slice(2, 11),
        month: currentJobStrategyKey,
        title: note.title,
      },
    ]);
  };

  const handleUpdateJobStrategyNote = (noteId: string, note: { title: string }) => {
    setJobStrategyNotes((previousNotes) =>
      previousNotes.map((currentNote) =>
        currentNote.id === noteId
          ? {
              ...currentNote,
              title: note.title,
            }
          : currentNote
      )
    );
  };

  const handleDeleteJobStrategyNote = (noteId: string) => {
    setJobStrategyNotes((previousNotes) => previousNotes.filter((note) => note.id !== noteId));
  };

  const handleAddLearningResource = (resource: Omit<LearningResource, 'id'>) => {
    setLearningResources((previousResources) => [
      {
        id: Math.random().toString(36).slice(2, 11),
        ...resource,
      },
      ...previousResources,
    ]);
  };

  const handleUpdateLearningResource = (resourceId: string, updatedResource: Omit<LearningResource, 'id'>) => {
    setLearningResources((previousResources) =>
      previousResources.map((resource) =>
        resource.id === resourceId ? { id: resource.id, ...updatedResource } : resource
      )
    );
  };

  const handleDeleteLearningResource = (resourceId: string) => {
    setLearningResources((previousResources) =>
      previousResources.filter((resource) => resource.id !== resourceId)
    );
  };

  const handleDeleteTaskSuggestion = (taskType: 'job' | 'learning' | 'wellness', title: string) => {
    setHiddenTaskSuggestions((previousSuggestions) => ({
      ...previousSuggestions,
      [selectedDateStr]: {
        ...(previousSuggestions[selectedDateStr] ?? createEmptyHiddenTaskSuggestionGroups()),
        [taskType]: (previousSuggestions[selectedDateStr]?.[taskType] ?? []).includes(title)
          ? previousSuggestions[selectedDateStr]?.[taskType] ?? []
          : [...(previousSuggestions[selectedDateStr]?.[taskType] ?? []), title],
      },
    }));
  };

  const handleBlockTaskSuggestionForever = (taskType: 'job' | 'learning' | 'wellness', title: string) => {
    const currentRepeatCount = tasksForSelectedWeek.filter(
      (task) => task.type === taskType && task.title.trim() === title
    ).length;

    setBlockedTaskSuggestions((previousSuggestions) => ({
      ...previousSuggestions,
      [taskType]: {
        ...previousSuggestions[taskType],
        [title]: Math.max(currentRepeatCount, 2),
      },
    }));
  };

  const handleOpenBlockSuggestionModal = (taskType: 'job' | 'learning' | 'wellness', title: string) => {
    setPendingBlockedSuggestion({ title, type: taskType });
  };

  const handleCloseBlockSuggestionModal = () => {
    setPendingBlockedSuggestion(null);
  };

  const handleConfirmBlockSuggestion = () => {
    if (!pendingBlockedSuggestion) {
      return;
    }

    handleBlockTaskSuggestionForever(pendingBlockedSuggestion.type, pendingBlockedSuggestion.title);
    setPendingBlockedSuggestion(null);
  };

  const handleExportData = async () => {
    const XLSX = await import('xlsx');
    const setSheetColumns = (sheet: { ['!cols']?: Array<{ wch: number }> }, widths: number[]) => {
      sheet['!cols'] = widths.map((wch) => ({ wch }));
    };

    const makeWorksheet = (rows: SheetValue[][], widths: number[]) => {
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      setSheetColumns(worksheet, widths);
      return worksheet;
    };

    const exportedAt = new Date().toISOString();
    const workbook = XLSX.utils.book_new();
    const todayKey = formatDateToString(today);
    const sortedApplications = [...jobApplications].sort((first, second) => second.applicationDate.localeCompare(first.applicationDate));
    const monthlyApplicationSummary = buildMonthlyApplicationSummary(jobApplications);
    const sortedTasks = [...tasks].sort((first, second) => first.date.localeCompare(second.date) || first.title.localeCompare(second.title));
    const sortedMonthlyGoals = [...monthlyGoals].sort((first, second) => first.month.localeCompare(second.month) || first.title.localeCompare(second.title));
    const sortedJobStrategyNotes = [...jobStrategyNotes].sort((first, second) => first.month.localeCompare(second.month) || first.title.localeCompare(second.title));

    const timelineStartCandidates = [
      ...sortedTasks.map((task) => new Date(`${task.date}T00:00:00`)),
      ...sortedMonthlyGoals.map((goal) => new Date(`${goal.month}-01T00:00:00`)),
      ...sortedJobStrategyNotes.map((note) => new Date(`${note.month}-01T00:00:00`)),
    ].filter((date) => !Number.isNaN(date.getTime()));

    const timelineStart = timelineStartCandidates.length > 0
      ? new Date(Math.min(...timelineStartCandidates.map((date) => date.getTime())))
      : new Date(today);

    const computeProgressForRange = (rangeStart: Date, rangeEnd: Date) =>
      progressGroups.map((group) => {
        const matchingTasks = tasks.filter((task) => {
          const taskDate = new Date(`${task.date}T00:00:00`);
          return task.type === group.type && taskDate >= rangeStart && taskDate <= rangeEnd;
        });
        const completedCount = matchingTasks.filter((task) => task.status === 'completed').length;
        const percentComplete = matchingTasks.length === 0 ? 0 : Math.round((completedCount / matchingTasks.length) * 100);

        return {
          label: group.label,
          value: percentComplete,
        };
      });

    const dailyJournalRows = sortedTasks.map((task, index) => [
      index + 1,
      task.date,
      task.time ?? '',
      task.title,
      task.category,
      task.priority ?? '',
      task.status,
      task.type,
    ]);

    const weeklyProgressRows: SheetValue[][] = [];
    for (let cursor = startOfWeek(timelineStart); cursor <= today; cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7)) {
      const weekStart = new Date(cursor);
      const weekEnd = endOfWeek(cursor);
      const progressByGroup = computeProgressForRange(weekStart, weekEnd);

      weeklyProgressRows.push([
        formatDateToString(weekStart),
        formatDateToString(weekEnd),
        progressByGroup[0].value,
        progressByGroup[1].value,
        progressByGroup[2].value,
      ]);
    }

    const monthlyProgressRows: SheetValue[][] = [];
    for (
      let cursor = startOfMonth(timelineStart);
      cursor <= today;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
    ) {
      const monthStart = new Date(cursor);
      const monthEnd = endOfMonth(cursor);
      const progressByGroup = computeProgressForRange(monthStart, monthEnd);

      monthlyProgressRows.push([
        formatMonthKey(monthStart),
        progressByGroup[0].value,
        progressByGroup[1].value,
        progressByGroup[2].value,
      ]);
    }

    const journalRows: SheetValue[][] = [
      ['Journal'],
      ['Exported At', exportedAt],
      ['Selected Date', formatDateToString(selectedDate)],
      ['First Saved Journal Date', formatDateToString(timelineStart)],
    ];
    addSheetSection(
      journalRows,
      isSelectedDateToday ? 'Today' : `Tasks for ${formatDateToString(selectedDate)}`,
      ['#', 'Date', 'Time', 'Title', 'Category', 'Priority', 'Status', 'Type'],
      getTasksForSelectedDate().map((task, index) => [
        index + 1,
        task.date,
        task.time ?? '',
        task.title,
        task.category,
        task.priority ?? '',
        task.status,
        task.type,
      ]),
      'No tasks for this date.'
    );
    addSheetSection(
      journalRows,
      'Date Goals History',
      ['#', 'Date', 'Time', 'Title', 'Category', 'Priority', 'Status', 'Type'],
      dailyJournalRows,
      'No date goals saved yet.'
    );
    addSheetSection(
      journalRows,
      `Monthly Goals (${currentMonthlyGoalsKey})`,
      ['#', 'Month', 'Title', 'Type'],
      monthlyGoalsForSelectedMonth.map((goal, index) => [index + 1, goal.month, goal.title, goal.type]),
      'No monthly goals for this month.'
    );
    addSheetSection(
      journalRows,
      'Monthly Goals History',
      ['#', 'Month', 'Title', 'Type'],
      sortedMonthlyGoals.map((goal, index) => [index + 1, goal.month, goal.title, goal.type]),
      'No monthly goals saved yet.'
    );
    addSheetSection(
      journalRows,
      `Progress (${progressView})`,
      ['Area', 'Completion %'],
      progressItems.map((item) => [item.label, item.value]),
      'No progress data available.'
    );
    addSheetSection(
      journalRows,
      'Weekly Progress History',
      ['Week Start', 'Week End', 'Work %', 'Learn %', 'Wellness %'],
      weeklyProgressRows,
      'No weekly progress history available.'
    );
    addSheetSection(
      journalRows,
      'Monthly Progress History',
      ['Month', 'Work %', 'Learn %', 'Wellness %'],
      monthlyProgressRows,
      'No monthly progress history available.'
    );
    XLSX.utils.book_append_sheet(workbook, makeWorksheet(journalRows, [18, 18, 14, 32, 18, 14, 14, 14]), 'Journal');

    const jobRows: SheetValue[][] = [];
    addSheetSection(
      jobRows,
      'Application Summary',
      ['Month', 'W1', 'W2', 'W3', 'W4', 'W5', 'Total'],
      monthlyApplicationSummary.map((summary) => [
        summary.label,
        summary.weeks[0],
        summary.weeks[1],
        summary.weeks[2],
        summary.weeks[3],
        summary.hasWeekFive ? summary.weeks[4] : 'NA',
        summary.total,
      ]),
      'No dated applications available.'
    );
    addSheetSection(
      jobRows,
      'Applications',
      ['#', 'Job Title', 'Company', 'Type', 'Application Date', 'Status', 'Link', 'CV File', 'Last Analyzed'],
      sortedApplications.map((application, index) => [
        index + 1,
        application.jobTitle,
        application.company,
        application.type,
        application.applicationDate,
        application.status,
        application.link,
        application.cvFileName ?? '',
        application.cvAnalyzedAt ?? '',
      ]),
      'No job applications logged yet.'
    );
    addSheetSection(
      jobRows,
      `Strategy Notes (${currentJobStrategyKey})`,
      ['#', 'Month', 'Note'],
      jobStrategyNotesForSelectedMonth.map((note, index) => [index + 1, note.month, note.title]),
      'No strategy notes for this month.'
    );
    addSheetSection(
      jobRows,
      'Strategy Notes History',
      ['#', 'Month', 'Note'],
      sortedJobStrategyNotes.map((note, index) => [index + 1, note.month, note.title]),
      'No strategy notes saved yet.'
    );
    XLSX.utils.book_append_sheet(workbook, makeWorksheet(jobRows, [24, 18, 16, 16, 18, 18, 18, 18, 24]), 'Job Search');

    const learningRows: SheetValue[][] = [];
    addSheetSection(
      learningRows,
      'Online Courses',
      ['#', 'Title', 'Status', 'Link'],
      learningResources
        .filter((resource) => resource.kind === 'course')
        .map((resource, index) => [index + 1, resource.title, resource.status, resource.link]),
      'No courses saved yet.'
    );
    addSheetSection(
      learningRows,
      'Papers',
      ['#', 'Title', 'Status', 'Link'],
      learningResources
        .filter((resource) => resource.kind === 'paper')
        .map((resource, index) => [index + 1, resource.title, resource.status, resource.link]),
      'No papers saved yet.'
    );
    XLSX.utils.book_append_sheet(workbook, makeWorksheet(learningRows, [24, 42, 18, 52]), 'Learning Hub');

    const wellnessRows: SheetValue[][] = [];
    XLSX.utils.book_append_sheet(workbook, makeWorksheet(wellnessRows, [24, 42, 18]), 'Wellness Tracker');

    XLSX.writeFile(workbook, `lucy-export-${exportedAt.slice(0, 10)}.xlsx`, {
      compression: true,
    });
  };

  const renderCompactTrackerSections = (taskType: Task['type']) => {
    const currentTrackerMonthKey = formatMonthKey(today);
    const todayTasks = tasks.filter(
      (task) => task.type === taskType && task.date === formatDateToString(today)
    );
    const relatedGoals = monthlyGoals.filter(
      (goal) => goal.type === taskType && goal.month === currentTrackerMonthKey
    );

    return (
      <section className="bg-white rounded-2xl p-3 shadow-sm">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          <section className="rounded-2xl border border-outline-variant/60 p-2.5">
            <div className="mb-2">
              <h2 className="text-base font-headline font-bold text-on-surface">Today</h2>
            </div>
            <div className="space-y-1.5">
              {todayTasks.length === 0 ? (
                <div className="h-8 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-3 py-1.5 text-sm text-on-surface-variant flex items-center">
                  No tasks for today in this section.
                </div>
              ) : (
                todayTasks.map((task) => (
                  <div key={task.id} className={`h-8 rounded-xl px-3 py-1.5 ${taskConfig[task.type].background}`}>
                    <div className="flex h-5 items-center justify-between gap-2">
                      <h3 className="flex-1 truncate text-sm text-on-surface leading-none">{task.title}</h3>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant leading-none">
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-outline-variant/60 p-2.5">
            <div className="mb-2">
              <h2 className="text-base font-headline font-bold text-on-surface">Monthly Goals</h2>
            </div>
            <div className="space-y-1.5">
              {relatedGoals.length === 0 ? (
                <div className="h-8 rounded-xl border border-dashed border-outline-variant bg-surface-container-low px-3 py-1.5 text-sm text-on-surface-variant flex items-center">
                  No goals saved yet.
                </div>
              ) : (
                relatedGoals.slice(0, 5).map((goal) => (
                  <div key={goal.id} className={`h-8 rounded-xl px-3 py-1.5 ${taskConfig[goal.type].background}`}>
                    <div className="flex h-5 items-center">
                      <h3 className="truncate text-sm text-on-surface leading-none">{goal.title}</h3>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </section>
    );
  };

  const renderTrackerPage = (page: Exclude<AppPage, 'journal'>) => {
    const fallback = (
      <div className="rounded-2xl bg-white p-6 shadow-sm text-sm text-on-surface-variant">Loading...</div>
    );

    if (page === 'job-search') {
      return (
        <main className="lg:ml-56 pt-20 pb-10 px-4 min-h-screen">
          <Suspense fallback={fallback}>
            <div className="max-w-7xl mx-auto space-y-4">
              {renderCompactTrackerSections('job')}
              <JobApplicationTracker
                applications={jobApplications}
                strategyNotes={jobStrategyNotesForSelectedMonth}
                strategyMonth={jobStrategyMonth}
                onAddApplication={handleAddJobApplication}
                onUpdateApplication={handleUpdateJobApplication}
                onDeleteApplication={handleDeleteJobApplication}
                onPrevStrategyMonth={handlePrevJobStrategyMonth}
                onNextStrategyMonth={handleNextJobStrategyMonth}
                onAddStrategyNote={handleAddJobStrategyNote}
                onUpdateStrategyNote={handleUpdateJobStrategyNote}
                onDeleteStrategyNote={handleDeleteJobStrategyNote}
              />
            </div>
          </Suspense>
        </main>
      );
    }

    if (page === 'learning-hub') {
      return (
        <main className="lg:ml-56 pt-20 pb-10 px-4 min-h-screen">
          <Suspense fallback={fallback}>
            <div className="max-w-7xl mx-auto space-y-4">
              {renderCompactTrackerSections('learning')}
              <LearningResourcesTracker
                resources={learningResources}
                onAddResource={handleAddLearningResource}
                onUpdateResource={handleUpdateLearningResource}
                onDeleteResource={handleDeleteLearningResource}
              />
            </div>
          </Suspense>
        </main>
      );
    }

    if (page === 'wellness-tracker') {
      return (
        <main className="lg:ml-56 pt-20 pb-10 px-4 min-h-screen">
          <Suspense fallback={fallback}>
            <div className="max-w-7xl mx-auto space-y-4">
              {renderCompactTrackerSections('wellness')}
              <WellnessMeditationTimer />
            </div>
          </Suspense>
        </main>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} onExportData={handleExportData} />
      <TopBar
        activePage={activePage}
        onNavigate={handleNavigate}
        citation={citation}
        onCitationChange={setCitation}
      />

      {activePage === 'journal' ? (
        <main className="lg:ml-56 pt-20 pb-10 px-4 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              <div className="lg:col-span-7 space-y-4">
                <section className="bg-white rounded-2xl p-8 shadow-sm relative pb-20">
                  <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-extrabold font-headline tracking-tight text-on-surface">
                      {isSelectedDateToday ? 'Today' : formatDateDisplay(selectedDate)}
                    </h1>
                    <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full">
                      {formatDateDisplay(selectedDate)}
                    </span>
                  </div>

                  <div className="space-y-4 custom-scrollbar overflow-y-auto max-h-[500px] pr-2">
                    {suggestedTasksForSelectedDate.length > 0 && (
                      <div className="space-y-3">
                        {suggestedTasksForSelectedDate.map((suggestedTask) => {
                          const palette = taskConfig[suggestedTask.type];
                          const Icon = palette.iconComponent;
                          const suggestedTaskOutlineClass = suggestedTaskOutlineClasses[suggestedTask.type];

                          return (
                            <div
                              key={`${suggestedTask.type}-${suggestedTask.title}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => handleAddSuggestedTask(suggestedTask)}
                              onKeyDown={(event) => handleSuggestedTaskKeyDown(event, suggestedTask)}
                              className={`flex h-8 cursor-pointer items-center gap-2 rounded-xl border ${suggestedTaskOutlineClass} bg-white px-3 py-1 opacity-75 shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30`}
                            >
                              <div
                                className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border border-on-surface-variant/20 bg-white ${palette.icon} transition-all hover:${palette.background}`}
                                aria-hidden="true"
                              >
                                <Plus size={12} />
                              </div>
                              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-on-surface">
                                {suggestedTask.title}
                              </p>
                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDeleteTaskSuggestion(suggestedTask.type, suggestedTask.title);
                                  }}
                                  onContextMenu={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleOpenBlockSuggestionModal(suggestedTask.type, suggestedTask.title);
                                  }}
                                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-on-surface-variant/50 transition-all hover:bg-red-50 hover:text-red-500"
                                  aria-label={`Dismiss suggested task ${suggestedTask.title}`}
                                  title="Click to hide today. Right-click to never suggest again."
                                >
                                  <X size={15} />
                                </button>
                                <Icon size={15} className={`shrink-0 ${palette.icon}`} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {getTasksForSelectedDate().map((task) => (
                      <div
                        key={task.id}
                        onDragEnter={(event) => handleDragEnterTask(event, task.id)}
                        onDragOver={handleDragOverTask}
                        onDrop={(event) => handleDropOnTask(event, task.id)}
                        className={[
                          'rounded-2xl transition-all duration-150',
                          dragOverTaskId === task.id && dragOverPosition === 'before'
                            ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-white'
                            : '',
                          dragOverTaskId === task.id && dragOverPosition === 'after'
                            ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-white translate-y-1'
                            : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <TaskItem
                          task={task}
                          onToggle={handleToggleTask}
                          onUpdate={handleUpdateTask}
                          onDelete={handleDeleteTask}
                          onMoveToNextDay={handleMoveTaskToNextDay}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedTaskId === task.id}
                          showMoveToNextDayAction
                        />
                      </div>
                    ))}

                    {getTasksForSelectedDate().length > 0 && (
                      <div
                        onDragEnter={handleDragEnterListEnd}
                        onDragOver={handleDragOverListEnd}
                        onDrop={handleDropAtListEnd}
                        className={`h-6 rounded-xl border border-dashed transition-all duration-150 ${
                          isDraggingOverListEnd
                            ? 'border-primary/70 bg-primary/10'
                            : 'border-transparent bg-transparent'
                        }`}
                        aria-hidden="true"
                      />
                    )}
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

              <aside className="lg:col-span-5 space-y-4">
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
      ) : (
        renderTrackerPage(activePage)
      )}

      {pendingBlockedSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-headline font-bold text-on-surface">Never Suggest Again</h2>
              <button
                type="button"
                onClick={handleCloseBlockSuggestionModal}
                className="p-2 rounded-lg hover:bg-surface-container transition-colors"
                aria-label="Close never suggest again dialog"
              >
                <X size={20} className="text-on-surface-variant" />
              </button>
            </div>

            <div className="space-y-6">
              <p className="text-sm font-bold text-on-surface">{pendingBlockedSuggestion.title}</p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseBlockSuggestionModal}
                  className="flex-1 py-2 px-4 rounded-lg font-headline font-bold text-sm bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBlockSuggestion}
                  className="flex-1 py-2 px-4 rounded-lg font-headline font-bold text-sm bg-primary text-on-primary hover:shadow-lg transition-all"
                >
                  Confirm
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <NewTaskModal
        isOpen={isModalOpen}
        onClose={handleCloseTaskModal}
        onSubmitTask={handleSubmitTask}
        suggestions={taskTitleSuggestions}
        onDeleteSuggestion={handleDeleteTaskSuggestion}
      />
    </div>
  );
}
