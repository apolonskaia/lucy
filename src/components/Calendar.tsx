import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  currentMonth: { month: number; year: number };
  onPrevMonth: () => void;
  onNextMonth: () => void;
  selectedDate: Date;
  onSelectDate: (day: number) => void;
}

export default function Calendar({ currentMonth, onPrevMonth, onNextMonth, selectedDate, onSelectDate }: CalendarProps) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[currentMonth.month];
  const days = Array.from({ length: 26 }, (_, i) => i + 1);
  const prevMonthDays = [29, 30];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-headline font-bold text-on-surface">{monthName} {currentMonth.year}</h2>
        <div className="flex gap-1">
          <button onClick={onPrevMonth} className="p-1.5 rounded-lg hover:bg-surface-container transition-colors">
            <ChevronLeft size={16} className="text-on-surface-variant" />
          </button>
          <button onClick={onNextMonth} className="p-1.5 rounded-lg hover:bg-surface-container transition-colors">
            <ChevronRight size={16} className="text-on-surface-variant" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
          <span key={day} className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {prevMonthDays.map((day) => (
          <div key={`prev-${day}`} className="h-8 flex items-center justify-center text-xs text-on-surface-variant/20">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const isSelected = day === selectedDate.getDate() && currentMonth.month === selectedDate.getMonth() && currentMonth.year === selectedDate.getFullYear();
          return (
            <button
              key={day}
              onClick={() => onSelectDate(day)}
              className={`h-8 flex items-center justify-center text-xs rounded-lg transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-primary text-on-primary font-bold shadow-md'
                  : 'text-on-surface-variant font-medium hover:bg-surface-container'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
