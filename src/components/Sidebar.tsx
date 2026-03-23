import { NotebookPen, Briefcase, GraduationCap, HeartPulse, HelpCircle, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

const navItems = [
  { icon: NotebookPen, label: 'Journal', active: true },
  { icon: Briefcase, label: 'Job Tracker' },
  { icon: GraduationCap, label: 'Learning Hub' },
  { icon: HeartPulse, label: 'Wellness Tracker' },
];

export default function Sidebar() {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-white dark:bg-slate-900 flex flex-col py-6 px-4 pt-20 hidden lg:flex z-40">
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
              item.active
                ? 'text-primary font-semibold bg-surface-container-low border-r-4 border-primary'
                : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
            }`}
          >
            <item.icon size={20} className={item.active ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'} />
            <span className="font-headline text-sm tracking-wide">{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="mt-auto px-4 space-y-4">
        <div className="pt-4 border-t border-outline-variant space-y-2">
          <a href="#" className="flex items-center gap-3 py-2 text-on-surface-variant hover:text-primary text-sm transition-colors">
            <HelpCircle size={16} />
            Support
          </a>
          <a href="#" className="flex items-center gap-3 py-2 text-on-surface-variant hover:text-primary text-sm transition-colors">
            <LogOut size={16} />
            Sign Out
          </a>
        </div>
      </div>
    </aside>
  );
}
