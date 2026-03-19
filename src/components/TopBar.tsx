import { Search, Bell, Settings } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 h-16 shadow-sm">
      <div className="flex items-center gap-8">
        <span className="text-2xl font-bold tracking-tighter text-primary font-headline lg:hidden">Lucy</span>
        <nav className="hidden md:flex gap-8">
          <a href="#" className="text-primary font-bold font-headline text-sm">Dashboard</a>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors font-headline text-sm">Job Tracker</a>
          <a href="#" className="text-on-surface-variant hover:text-primary transition-colors font-headline text-sm">Learning Hub</a>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative group hidden sm:block">
          <div className="flex items-center bg-surface-container px-4 py-1.5 rounded-full transition-all group-focus-within:bg-white group-focus-within:ring-1 ring-primary/20">
            <Search size={16} className="text-on-surface-variant mr-2" />
            <input
              type="text"
              placeholder="Search insights..."
              className="bg-transparent border-none focus:ring-0 text-sm w-48 font-sans"
            />
          </div>
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
