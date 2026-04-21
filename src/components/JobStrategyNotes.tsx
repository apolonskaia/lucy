import { useEffect, useState, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { JobStrategyNote } from '../types';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface JobStrategyNotesProps {
  notes: JobStrategyNote[];
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onAddNote: (note: { title: string }) => void;
  onUpdateNote: (noteId: string, note: { title: string }) => void;
  onDeleteNote: (noteId: string) => void;
}

export default function JobStrategyNotes({
  notes,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
}: JobStrategyNotesProps) {
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [pendingTitle, setPendingTitle] = useState('');
  const [isComposerActive, setIsComposerActive] = useState(false);

  useEffect(() => {
    setNoteDrafts((previousDrafts) => {
      const nextDrafts = { ...previousDrafts };

      notes.forEach((note) => {
        nextDrafts[note.id] = note.title;
      });

      Object.keys(nextDrafts).forEach((noteId) => {
        if (!notes.some((note) => note.id === noteId)) {
          delete nextDrafts[noteId];
        }
      });

      return nextDrafts;
    });
  }, [notes]);

  const commitExistingNote = (note: JobStrategyNote) => {
    const trimmedTitle = (noteDrafts[note.id] ?? note.title).trim();

    if (!trimmedTitle) {
      setNoteDrafts((previousDrafts) => ({
        ...previousDrafts,
        [note.id]: note.title,
      }));
      return;
    }

    if (trimmedTitle !== note.title) {
      onUpdateNote(note.id, { title: trimmedTitle });
    }
  };

  const addPendingNote = () => {
    const trimmedTitle = pendingTitle.trim();

    if (!trimmedTitle) {
      return false;
    }

    onAddNote({ title: trimmedTitle });
    setPendingTitle('');
    return true;
  };

  const handleExistingNoteKeyDown = (event: KeyboardEvent<HTMLInputElement>, note: JobStrategyNote) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitExistingNote(note);
      setIsComposerActive(true);
      return;
    }

    if (event.key === 'Escape') {
      setNoteDrafts((previousDrafts) => ({
        ...previousDrafts,
        [note.id]: note.title,
      }));
      event.currentTarget.blur();
    }
  };

  const handlePendingKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      setIsComposerActive(true);
      addPendingNote();
      return;
    }

    if (event.key === 'Escape') {
      setPendingTitle('');
      setIsComposerActive(false);
      event.currentTarget.blur();
    }
  };

  return (
    <section className="h-[126px] overflow-hidden rounded-2xl border border-outline-variant/60">
      <div className="flex h-[31px] items-center justify-between gap-2 bg-amber-100 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
        <div className="flex items-center gap-1">
          <button
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onPrevMonth}
            className="flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:bg-white/60"
            aria-label="Previous job strategy month"
          >
            <ChevronLeft size={14} />
          </button>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            {monthNames[currentMonth.getMonth()]} Strategy
          </h2>
          <button
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onNextMonth}
            className="flex h-5 w-5 items-center justify-center rounded-md transition-colors hover:bg-white/60"
            aria-label="Next job strategy month"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="max-h-[93px] overflow-y-auto custom-scrollbar">
        {notes.map((note, index) => (
          <div
            key={note.id}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              const input = event.currentTarget.querySelector('input');
              if (input instanceof HTMLInputElement) {
                input.focus();
                input.select();
              }
            }}
            className={`group flex h-[31px] items-center gap-2 border-t border-outline-variant/50 px-2 transition-colors ${
              index % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'
            }`}
          >
            <span className="shrink-0 text-sm font-bold leading-none text-on-surface">•</span>

            <input
              type="text"
              value={noteDrafts[note.id] ?? note.title}
              onChange={(event) =>
                setNoteDrafts((previousDrafts) => ({
                  ...previousDrafts,
                  [note.id]: event.target.value,
                }))
              }
              onBlur={() => commitExistingNote(note)}
              onKeyDown={(event) => handleExistingNoteKeyDown(event, note)}
              className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm font-sans font-normal text-on-surface transition-colors focus:border-outline-variant focus:bg-white focus:outline-none"
              aria-label="Strategy note"
            />

            <button
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onDeleteNote(note.id);
              }}
              className="h-7 w-7 shrink-0 rounded text-on-surface-variant/50 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              aria-label="Delete strategy note"
            >
              <Trash2 size={15} className="mx-auto" />
            </button>
          </div>
        ))}

        {isComposerActive ? (
          <div
            onMouseDown={(event) => event.stopPropagation()}
            className="flex h-[31px] items-center gap-2 border-t border-outline-variant/50 bg-white px-2"
          >
            <span className="shrink-0 text-sm font-bold leading-none text-on-surface">•</span>
            <input
              type="text"
              value={pendingTitle}
              onChange={(event) => setPendingTitle(event.target.value)}
              onBlur={() => {
                const wasAdded = addPendingNote();
                if (!wasAdded) {
                  setIsComposerActive(false);
                }
              }}
              onKeyDown={handlePendingKeyDown}
              className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-sm font-sans font-normal text-on-surface transition-colors focus:border-outline-variant focus:bg-white focus:outline-none"
              placeholder="Add a strategy bullet..."
              aria-label="New strategy note"
              autoFocus
            />
          </div>
        ) : notes.length === 0 ? (
          <div
            onClick={() => setIsComposerActive(true)}
            className="flex h-[31px] items-center border-t border-outline-variant/50 bg-white px-2 text-sm text-on-surface-variant"
          >
            Click here to add a strategy bullet for this month.
          </div>
        ) : (
          <div
            onClick={() => setIsComposerActive(true)}
            className="flex h-[31px] items-center border-t border-outline-variant/50 bg-white px-2 text-sm text-on-surface-variant"
          >
            Click here to add another strategy bullet.
          </div>
        )}
      </div>
    </section>
  );
}