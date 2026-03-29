import { ExternalLink, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { LearningResource, LearningResourceKind, LearningResourceStatus } from '../types';

const statusOptions: Array<{ value: LearningResourceStatus; label: string }> = [
  { value: 'want-to-do', label: 'Want To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'finished', label: 'Finished' },
  { value: 'dropped', label: 'Dropped' },
];

const kindConfig: Record<LearningResourceKind, { title: string; description: string; empty: string; button: string }> = {
  course: {
    title: 'Online Courses',
    description: 'Track courses you want to start, are actively taking, or have already completed.',
    empty: 'No courses saved yet.',
    button: 'Add Course',
  },
  paper: {
    title: 'Papers',
    description: 'Keep a reading list of papers, articles, and technical writeups worth revisiting.',
    empty: 'No papers saved yet.',
    button: 'Add Paper',
  },
};

const statusStyles: Record<LearningResourceStatus, string> = {
  'want-to-do': 'bg-slate-100 text-slate-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  finished: 'bg-emerald-100 text-emerald-700',
  dropped: 'bg-rose-100 text-rose-700',
};

interface LearningResourcesTrackerProps {
  resources: LearningResource[];
  onAddResource: (resource: Omit<LearningResource, 'id'>) => void;
  onUpdateResource: (resourceId: string, resource: Omit<LearningResource, 'id'>) => void;
  onDeleteResource: (resourceId: string) => void;
}

interface ResourceFormState {
  title: string;
  link: string;
  status: LearningResourceStatus;
}

const getEmptyForm = (): ResourceFormState => ({
  title: '',
  link: '',
  status: 'want-to-do',
});

const normalizeLink = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) return '';
  if (trimmedValue.startsWith('http://') || trimmedValue.startsWith('https://')) return trimmedValue;
  return `https://${trimmedValue}`;
};

const createResourcePayload = (
  resource: LearningResource,
  overrides: Partial<Omit<LearningResource, 'id'>> = {}
): Omit<LearningResource, 'id'> => ({
  title: resource.title,
  link: resource.link,
  kind: resource.kind,
  status: resource.status,
  ...overrides,
});

export default function LearningResourcesTracker({
  resources,
  onAddResource,
  onUpdateResource,
  onDeleteResource,
}: LearningResourcesTrackerProps) {
  const [activeKind, setActiveKind] = useState<LearningResourceKind | null>(null);
  const [form, setForm] = useState<ResourceFormState>(getEmptyForm());

  const groupedResources = useMemo(
    () => ({
      course: resources.filter((resource) => resource.kind === 'course'),
      paper: resources.filter((resource) => resource.kind === 'paper'),
    }),
    [resources]
  );

  const openForm = (kind: LearningResourceKind) => {
    setActiveKind(kind);
    setForm(getEmptyForm());
  };

  const closeForm = () => {
    setActiveKind(null);
    setForm(getEmptyForm());
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!activeKind) return;

    const title = form.title.trim();
    const link = normalizeLink(form.link);

    if (!title || !link) return;

    onAddResource({
      title,
      link,
      kind: activeKind,
      status: form.status,
    });

    closeForm();
  };

  const renderSection = (kind: LearningResourceKind) => {
    const config = kindConfig[kind];
    const items = groupedResources[kind];

    return (
      <section className="rounded-2xl border border-outline-variant/60 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-headline font-bold text-on-surface">{config.title}</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant max-w-2xl">{config.description}</p>
          </div>

          <button
            type="button"
            onClick={() => openForm(kind)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-headline font-semibold text-on-primary shadow-sm transition-all hover:shadow-md"
          >
            <Plus size={16} />
            {config.button}
          </button>
        </div>

        {activeKind === kind && (
          <form onSubmit={handleSubmit} className="mb-3 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-3">
            <div className="grid gap-3 md:grid-cols-[1.4fr_1.2fr_0.8fr_auto] md:items-end">
              <label className="block">
                <span className="mb-2 block text-sm font-headline font-bold text-on-surface">Name</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, title: event.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                  placeholder={kind === 'course' ? 'Course name' : 'Paper title'}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-headline font-bold text-on-surface">Link</span>
                <input
                  type="url"
                  value={form.link}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, link: event.target.value }))}
                  className="w-full rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                  placeholder="https://..."
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-headline font-bold text-on-surface">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm((currentForm) => ({ ...currentForm, status: event.target.value as LearningResourceStatus }))}
                  className="w-full rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2 md:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-on-surface-variant transition-colors hover:bg-surface-container"
                  aria-label={`Close ${config.title} form`}
                >
                  <X size={16} />
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-headline font-semibold text-on-primary transition-colors hover:bg-primary/90"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="rounded-2xl border border-outline-variant/60 overflow-hidden">
          <div className="divide-y divide-outline-variant/50">
            {items.length === 0 ? (
              <div className="px-4 py-6 text-sm text-on-surface-variant text-center bg-surface-container-low/40">
                {config.empty}
              </div>
            ) : (
              items.map((resource, index) => (
                <div
                  key={resource.id}
                  className="grid gap-2 px-4 py-1.5 bg-white lg:grid-cols-[36px_1.4fr_1.2fr_0.8fr_40px] lg:items-center"
                >
                  <div className="flex items-center lg:justify-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">#</p>
                    <span className="text-sm font-headline font-semibold text-on-surface">{index + 1}</span>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">
                      {kind === 'course' ? 'Course' : 'Paper'}
                    </p>
                    <input
                      type="text"
                      value={resource.title}
                      onChange={(event) => onUpdateResource(resource.id, createResourcePayload(resource, { title: event.target.value }))}
                      className="w-full rounded-lg border border-transparent bg-transparent px-2 py-0.5 text-sm font-headline font-semibold text-on-surface transition-colors focus:border-outline-variant focus:bg-surface-container-low focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Link</p>
                    <input
                      type="url"
                      value={resource.link}
                      onChange={(event) => onUpdateResource(resource.id, createResourcePayload(resource, { link: event.target.value }))}
                      onBlur={(event) => onUpdateResource(resource.id, createResourcePayload(resource, { link: normalizeLink(event.target.value) }))}
                      className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-0.5 text-sm text-on-surface transition-colors focus:border-outline-variant focus:bg-surface-container-low focus:outline-none"
                      placeholder="https://..."
                    />
                    <a
                      href={normalizeLink(resource.link)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
                      aria-label={`Open ${resource.title}`}
                    >
                      <ExternalLink size={15} />
                    </a>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant lg:hidden">Status</p>
                    <select
                      value={resource.status}
                      onChange={(event) => onUpdateResource(resource.id, createResourcePayload(resource, { status: event.target.value as LearningResourceStatus }))}
                      className={`w-full rounded-lg border border-transparent px-2.5 py-1 text-xs font-semibold transition-colors focus:border-outline-variant focus:outline-none ${statusStyles[resource.status]}`}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center lg:justify-center">
                    <button
                      type="button"
                      onClick={() => onDeleteResource(resource.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label={`Delete ${resource.title}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    );
  };

  return (
    <section className="space-y-4">
      {renderSection('course')}
      {renderSection('paper')}
    </section>
  );
}