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
  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentMonth.year, currentMonth.month, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.year, currentMonth.month, 1);
  const firstDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  const prevMonthDays = Array.from({ length: firstDayIndex }, (_, index) => {
    return daysInPrevMonth - firstDayIndex + index + 1;
  });

  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const totalVisibleDays = prevMonthDays.length + days.length;
  const nextMonthDaysCount = (7 - (totalVisibleDays % 7)) % 7;
  const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, index) => index + 1);

  return (
    <div className="bg-white rounded-2xl px-5 py-3 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-headline font-bold text-on-surface">{monthName} {currentMonth.year}</h2>
        <div className="flex gap-1">
          <button onClick={onPrevMonth} className="rounded-lg hover:bg-surface-container transition-colors">
            <ChevronLeft size={14} className="text-on-surface-variant" />
          </button>
          <button onClick={onNextMonth} className="rounded-lg hover:bg-surface-container transition-colors">
            <ChevronRight size={14} className="text-on-surface-variant" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <span key={day} className="text-[9px] font-bold text-on-surface-variant/40 uppercase tracking-widest">
            {day}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {prevMonthDays.map((day) => (
          <div key={`prev-${day}`} className="h-5 flex items-center justify-center text-[11px] text-on-surface-variant/20">
            {day}
          </div>
        ))}
        {days.map((day) => {
          const isSelected = day === selectedDate.getDate() && currentMonth.month === selectedDate.getMonth() && currentMonth.year === selectedDate.getFullYear();
          return (
            <button
              key={day}
              onClick={() => onSelectDate(day)}
              className={`h-5 flex items-center justify-center text-[11px] rounded-lg transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-primary text-on-primary font-bold shadow-md'
                  : 'text-on-surface-variant font-medium hover:bg-surface-container'
              }`}
            >
              {day}
            </button>
          );
        })}
        {nextMonthDays.map((day) => (
          <div key={`next-${day}`} className="h-5 flex items-center justify-center text-[11px] text-on-surface-variant/20">
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}
