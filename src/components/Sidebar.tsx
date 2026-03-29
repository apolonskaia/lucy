import { Briefcase, Download, GraduationCap, HeartPulse, NotebookPen } from 'lucide-react';
import { AppPage } from '../types';

const navItems = [
  { icon: NotebookPen, label: 'Journal', page: 'journal' as AppPage },
  { icon: Briefcase, label: 'Job Search', page: 'job-search' as AppPage },
  { icon: GraduationCap, label: 'Learning Hub', page: 'learning-hub' as AppPage },
  { icon: HeartPulse, label: 'Wellness Tracker', page: 'wellness-tracker' as AppPage },
];

interface SidebarProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  onExportData: () => void;
}

export default function Sidebar({ activePage, onNavigate, onExportData }: SidebarProps) {
  return (
    <aside className="h-screen w-56 fixed left-0 top-0 bg-white dark:bg-slate-900 flex flex-col py-6 px-4 pt-[4.5rem] hidden lg:flex z-40">
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onNavigate(item.page)}
            className={`flex h-12 w-full items-center gap-3 px-4 rounded-xl transition-all duration-300 group text-left ${
              activePage === item.page
                ? 'text-primary bg-surface-container-low'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
            }`}
          >
            <item.icon size={20} className={`shrink-0 ${activePage === item.page ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'}`} />
            <span className="font-headline text-[15px] leading-none font-semibold tracking-[0.01em]">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto px-4">
        <button
          type="button"
          onClick={onExportData}
          className="flex items-center gap-3 py-2 text-on-surface-variant hover:text-primary text-sm transition-colors"
        >
          <Download size={16} />
          Export Spreadsheet
        </button>
      </div>
    </aside>
  );
}
