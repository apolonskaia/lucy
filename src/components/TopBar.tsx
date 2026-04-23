import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppPage } from '../types';

interface TopBarProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  citation: string;
  onCitationChange: (value: string) => void;
}

export default function TopBar({ activePage, onNavigate, citation, onCitationChange }: TopBarProps) {
  const faviconSrc = `${import.meta.env.BASE_URL}favicon.svg`;
  const [isCitationFocused, setIsCitationFocused] = useState(false);
  const [citationWidthText, setCitationWidthText] = useState(citation);
  const [citationWidthPx, setCitationWidthPx] = useState(240);
  const citationMeasureRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!isCitationFocused) {
      setCitationWidthText(citation);
    }
  }, [citation, isCitationFocused]);

  useLayoutEffect(() => {
    const textForWidth = citationWidthText.trim() || 'Add a citation to keep in view...';
    const updateCitationWidth = () => {
      const measuredWidth = citationMeasureRef.current?.offsetWidth ?? 0;
      const horizontalChrome = 22;
      const minWidth = citationWidthText.trim() ? 120 : 240;
      const maxWidth = 420;

      setCitationWidthPx(Math.max(Math.min(Math.ceil(measuredWidth) + horizontalChrome, maxWidth), minWidth));
    };

    updateCitationWidth();

    if (typeof document !== 'undefined' && 'fonts' in document) {
      void document.fonts.ready.then(() => {
        updateCitationWidth();
      });
    }
  }, [citationWidthText]);

  const textForWidth = citationWidthText.trim() || 'Add a citation to keep in view...';
  const citationWidth = `${citationWidthPx}px`;

  return (
    <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl flex justify-between items-center px-8 h-16 shadow-sm">
      <span
        ref={citationMeasureRef}
        className="pointer-events-none absolute left-0 top-0 invisible whitespace-pre px-0 text-sm font-medium"
        aria-hidden="true"
      >
        {textForWidth}
      </span>

      <div className="flex items-center min-w-0">
        <div className="flex items-center gap-3">
          <img src={faviconSrc} alt="Lucy favicon" className="h-7 w-7 shrink-0" />
          <span className="text-2xl font-bold tracking-tighter text-primary font-headline">Lucy</span>
        </div>
      </div>

      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`hidden lg:flex h-8 items-center rounded-xl border pl-3 pr-2 transition-colors ${
            citation.trim() ? 'border-transparent bg-pink-100' : 'border-outline-variant bg-white/80'
          }`}
          style={{ width: citationWidth, maxWidth: '420px' }}
        >
          <input
            type="text"
            value={citation}
            onChange={(event) => {
              const nextValue = event.target.value;

              onCitationChange(nextValue);

              if (isCitationFocused && nextValue.trim().length <= citationWidthText.trim().length) {
                setCitationWidthText(nextValue);
              }
            }}
            onFocus={() => {
              setIsCitationFocused(true);
              setCitationWidthText(citation);
            }}
            onBlur={() => {
              setIsCitationFocused(false);
              setCitationWidthText(citation);
            }}
            placeholder="Add a citation to keep in view..."
            className={`min-w-0 flex-1 bg-transparent pr-0 text-sm text-on-surface-variant placeholder:text-slate-400 focus:outline-none ${
              citation.trim() ? 'text-left font-medium' : 'text-left font-medium'
            }`}
          />
        </div>

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
