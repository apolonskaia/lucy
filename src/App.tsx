import { Plus } from 'lucide-react';
import { useEffect, useState, type DragEvent } from 'react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import TaskItem from './components/TaskItem';
import Calendar from './components/Calendar';
import ProgressMatrix from './components/ProgressMatrix';
import NewTaskModal from './components/NewTaskModal';
import MonthlyGoals from './components/MonthlyGoals';
import JobApplicationTracker from './components/JobApplicationTracker';
import LearningResourcesTracker from './components/LearningResourcesTracker';
import { AppPage, JobApplication, LearningResource, MonthlyGoal, ProgressItem, Task } from './types';
import { taskConfig } from './taskConfig';

type SheetValue = string | number;

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
const LEARNING_RESOURCES_STORAGE_KEY = 'lucy-learning-resources-v1';
const appPages: AppPage[] = ['journal', 'job-search', 'learning-hub', 'wellness-tracker'];

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

const setSheetColumns = (sheet: XLSX.WorkSheet, widths: number[]) => {
  sheet['!cols'] = widths.map((wch) => ({ wch }));
};

const makeWorksheet = (rows: SheetValue[][], widths: number[]) => {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  setSheetColumns(worksheet, widths);
  return worksheet;
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
  const [activePage, setActivePage] = useState<AppPage>(() => getPageFromHash());
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentMonth, setCurrentMonth] = useState({ month: today.getMonth(), year: today.getFullYear() });
  const [monthlyGoalsMonth, setMonthlyGoalsMonth] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>(() => loadMonthlyGoals());
  const [jobApplications, setJobApplications] = useState<JobApplication[]>(() => loadJobApplications());
  const [learningResources, setLearningResources] = useState<LearningResource[]>(() => loadLearningResources());
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

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, dropIndex: number) => {
    event.preventDefault();
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

  useEffect(() => {
    try {
      localStorage.setItem(JOB_APPLICATIONS_STORAGE_KEY, JSON.stringify(jobApplications));
    } catch {
      // silent fail on unsupported environments
    }
  }, [jobApplications]);

  useEffect(() => {
    try {
      localStorage.setItem(LEARNING_RESOURCES_STORAGE_KEY, JSON.stringify(learningResources));
    } catch {
      // silent fail on unsupported environments
    }
  }, [learningResources]);

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

  const handleExportData = () => {
    const exportedAt = new Date().toISOString();
    const workbook = XLSX.utils.book_new();
    const todayKey = formatDateToString(today);
    const sortedApplications = [...jobApplications].sort((first, second) => second.applicationDate.localeCompare(first.applicationDate));
    const monthlyApplicationSummary = buildMonthlyApplicationSummary(jobApplications);
    const sortedTasks = [...tasks].sort((first, second) => first.date.localeCompare(second.date) || first.title.localeCompare(second.title));
    const sortedMonthlyGoals = [...monthlyGoals].sort((first, second) => first.month.localeCompare(second.month) || first.title.localeCompare(second.title));

    const timelineStartCandidates = [
      ...sortedTasks.map((task) => new Date(`${task.date}T00:00:00`)),
      ...sortedMonthlyGoals.map((goal) => new Date(`${goal.month}-01T00:00:00`)),
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
    const todayTasks = tasks.filter(
      (task) => task.type === taskType && task.date === formatDateToString(today)
    );
    const relatedGoals = monthlyGoals.filter((goal) => goal.type === taskType);

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
                      <h3 className="flex-1 truncate text-sm font-headline font-bold text-on-surface leading-none">{task.title}</h3>
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
                      <h3 className="truncate text-sm font-headline font-bold text-on-surface leading-none">{goal.title}</h3>
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
    if (page === 'job-search') {
      return (
        <main className="lg:ml-64 pt-20 pb-10 px-4 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-4">
            {renderCompactTrackerSections('job')}
            <JobApplicationTracker
              applications={jobApplications}
              onAddApplication={handleAddJobApplication}
              onUpdateApplication={handleUpdateJobApplication}
              onDeleteApplication={handleDeleteJobApplication}
            />
          </div>
        </main>
      );
    }

    if (page === 'learning-hub') {
      return (
        <main className="lg:ml-64 pt-20 pb-10 px-4 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-4">
            {renderCompactTrackerSections('learning')}
            <LearningResourcesTracker
              resources={learningResources}
              onAddResource={handleAddLearningResource}
              onUpdateResource={handleUpdateLearningResource}
              onDeleteResource={handleDeleteLearningResource}
            />
          </div>
        </main>
      );
    }

    if (page === 'wellness-tracker') {
      return (
        <main className="lg:ml-64 pt-20 pb-10 px-4 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-4">
            {renderCompactTrackerSections('wellness')}
          </div>
        </main>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} onExportData={handleExportData} />
      <TopBar activePage={activePage} onNavigate={handleNavigate} />

      {activePage === 'journal' ? (
        <main className="lg:ml-64 pt-20 pb-10 px-4 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-7 space-y-6">
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
                    {getTasksForSelectedDate().map((task, index) => (
                      <div
                        key={task.id}
                        onDragOver={handleDragOver}
                        onDrop={(event) => handleDrop(event, index)}
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
      ) : (
        renderTrackerPage(activePage)
      )}

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
