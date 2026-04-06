import { Bell, Settings } from 'lucide-react';
import { AppPage } from '../types';

const navItems = [
  { label: 'Job Search', page: 'job-search' as AppPage },
  { label: 'Learning Hub', page: 'learning-hub' as AppPage },
  { label: 'Wellness Tracker', page: 'wellness-tracker' as AppPage },
];

interface TopBarProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  citation: string;
  onCitationChange: (value: string) => void;
}

export default function TopBar({ activePage, onNavigate, citation, onCitationChange }: TopBarProps) {
  const faviconSrc = `${import.meta.env.BASE_URL}favicon.svg`;
  const citationWidth = `${Math.max(Math.min(citation.trim().length + 2, 32), 24)}ch`;

  return (
    <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 h-16 shadow-sm">
      <div className="flex items-center gap-8 min-w-0">
        <div className="flex items-center gap-3">
          <img src={faviconSrc} alt="Lucy favicon" className="h-7 w-7 shrink-0" />
          <span className="text-2xl font-bold tracking-tighter text-primary font-headline">Lucy</span>
        </div>
        <nav className="hidden md:flex gap-8">
          {navItems.map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => onNavigate(item.page)}
              className={`h-10 transition-colors font-headline text-[15px] leading-none font-semibold tracking-[0.01em] ${
                activePage === item.page ? 'text-primary' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`hidden lg:flex h-8 items-center rounded-xl border px-3 transition-colors group ${
            citation.trim()
              ? 'border-outline-variant bg-white/80 hover:border-transparent hover:bg-[#fcfbe1] focus-within:border-transparent focus-within:bg-[#fcfbe1]'
              : 'border-outline-variant bg-white/80'
          }`}
          style={{ width: citationWidth, maxWidth: '42rem' }}
        >
          <input
            type="text"
            value={citation}
            onChange={(event) => onCitationChange(event.target.value)}
            placeholder="Add a citation to keep in view..."
            className={`min-w-0 flex-1 bg-transparent text-sm placeholder:text-slate-400 focus:outline-none ${
              citation.trim()
                ? 'text-left font-medium text-white/80 caret-transparent group-hover:text-on-surface-variant group-hover:caret-on-surface-variant focus:text-on-surface-variant focus:caret-on-surface-variant'
                : 'text-left font-medium text-on-surface-variant caret-on-surface-variant'
            }`}
          />
        </div>
        <button className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <Bell size={20} className="text-primary" />
        </button>
        <button className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <Settings size={20} className="text-primary" />
        </button>

        <div className="h-8 w-8 rounded-full overflow-hidden bg-surface-container-high border-2 border-white ml-2 shadow-sm">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOx4F8Sn18hHJ1UqN7DJmMuoka1sArH0h1yD4gdiNAdJ0q7cN0fWADa6LCMEt5BhEjySTYGwhbi5pV6AjVBM7j2-ouxCuw9M0OlOcdl61SidV-P-Nm5X85qbccEhlHj-OQ6PjisKGqOd8mh9JzQcR1zsIijToTog4oKRxTVWmm18NcuHKa5pmupiJdv1z984visuhJIa0kiypHGBffai0Bfg4dUd55GkkQdm-F6MAjDSAqjU3QgR01FkEBIGgmfDqKNVJB8Xd0My8"
            alt="User profile"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </header>
  );
}
