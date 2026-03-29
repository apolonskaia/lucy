import { Briefcase, GraduationCap, Leaf } from 'lucide-react';

export const taskConfig = {
  job: {
    label: 'Work',
    iconComponent: Briefcase,
    background: 'bg-amber-100',
    hover: 'hover:bg-[#fdecb0] hover:saturate-125 hover:brightness-100',
    icon: 'text-amber-500',
    border: 'border-amber-500',
    badgeInactive: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    badgeActive: 'bg-amber-500 text-white shadow-md',
    progress: 'bg-[#fdecb0]',
  },
  learning: {
    label: 'Learn',
    iconComponent: GraduationCap,
    background: 'bg-violet-100',
    hover: 'hover:saturate-150 hover:brightness-95',
    icon: 'text-violet-500',
    border: 'border-violet-500',
    badgeInactive: 'bg-violet-50 text-violet-700 hover:bg-violet-100',
    badgeActive: 'bg-violet-500 text-white shadow-md',
    progress: 'bg-violet-200',
  },
  wellness: {
    label: 'Wellness',
    iconComponent: Leaf,
    background: 'bg-lime-100',
    hover: 'hover:saturate-150 hover:brightness-95',
    icon: 'text-lime-600',
    border: 'border-lime-300',
    badgeInactive: 'bg-lime-50 text-lime-700 hover:bg-lime-100',
    badgeActive: 'bg-lime-300 text-white shadow-md',
    progress: 'bg-lime-200',
  },
} as const;