import { useEffect, useMemo, useState } from 'react';
import { EditorContent, JSONContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Mark, mergeAttributes, Node } from '@tiptap/core';
import { Check, X } from 'lucide-react';
import { CvBuilderDraft, CvBuilderLine, CvBuilderSuggestionRange, CvSource } from '../types';
import { CV_SUMMARY_HEADING, extractCvHeaderContact, normalizeCvSectionTitle } from '../utils/cvDocumentFormat';

interface CvDraftEditorProps {
  draft: CvBuilderDraft;
  cvSources: CvSource[];
  onDraftChange: (draft: CvBuilderDraft) => void;
  onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
  onMoveLine: (sectionId: string, lineId: string, direction: 'up' | 'down') => void;
}

type SelectionContext =
  | {
      type: 'section';
      sectionId: string;
      sectionTitle: string;
    }
  | {
      type: 'line';
      sectionId: string;
      lineId: string;
      lineStatus: 'accepted' | 'suggested';
      activeSuggestion: {
        id: string;
        rationale: string;
        sourceCvIds: string[];
      } | null;
    }
  | null;

const SuggestionMark = Mark.create({
  name: 'suggestionMark',

  addAttributes() {
    return {
      suggestionId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-suggestion-id'),
        renderHTML: (attributes) => ({ 'data-suggestion-id': attributes.suggestionId }),
      },
      rationale: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-rationale') ?? '',
        renderHTML: (attributes) => ({ 'data-rationale': attributes.rationale }),
      },
      sourceCvIds: {
        default: [],
        parseHTML: (element) => {
          const rawValue = element.getAttribute('data-source-cv-ids');

          if (!rawValue) {
            return [];
          }

          try {
            return JSON.parse(rawValue) as string[];
          } catch {
            return [];
          }
        },
        renderHTML: (attributes) => ({ 'data-source-cv-ids': JSON.stringify(attributes.sourceCvIds ?? []) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-suggestion-id]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'cv-doc-suggestion-mark',
      }),
      0,
    ];
  },
});

const CvSectionHeading = Node.create({
  name: 'cvSectionHeading',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      sectionId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-section-id'),
        renderHTML: (attributes) => ({ 'data-section-id': attributes.sectionId }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'h2[data-node-type="cv-section-heading"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'h2',
      mergeAttributes(HTMLAttributes, {
        'data-node-type': 'cv-section-heading',
        class: 'cv-doc-section-heading',
      }),
      0,
    ];
  },
});

const CvDraftLineNode = Node.create({
  name: 'cvDraftLine',
  group: 'block',
  content: 'inline*',
  defining: true,

  addAttributes() {
    return {
      lineId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-line-id'),
        renderHTML: (attributes) => ({ 'data-line-id': attributes.lineId }),
      },
      sectionId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-section-id'),
        renderHTML: (attributes) => ({ 'data-section-id': attributes.sectionId }),
      },
      lineStatus: {
        default: 'accepted',
        parseHTML: (element) => element.getAttribute('data-line-status') ?? 'accepted',
        renderHTML: (attributes) => ({ 'data-line-status': attributes.lineStatus }),
      },
      rationale: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-rationale') ?? '',
        renderHTML: (attributes) => ({ 'data-rationale': attributes.rationale }),
      },
      hasSuggestion: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-has-suggestion') === 'true',
        renderHTML: (attributes) => ({ 'data-has-suggestion': attributes.hasSuggestion ? 'true' : 'false' }),
      },
      suggestionCount: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute('data-suggestion-count') ?? 0),
        renderHTML: (attributes) => ({ 'data-suggestion-count': String(attributes.suggestionCount ?? 0) }),
      },
      sourceCvIds: {
        default: [],
        parseHTML: (element) => {
          const rawValue = element.getAttribute('data-source-cv-ids');

          if (!rawValue) {
            return [];
          }

          try {
            return JSON.parse(rawValue) as string[];
          } catch {
            return [];
          }
        },
        renderHTML: (attributes) => ({ 'data-source-cv-ids': JSON.stringify(attributes.sourceCvIds ?? []) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'p[data-node-type="cv-draft-line"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const isSuggested = HTMLAttributes.hasSuggestion || HTMLAttributes.lineStatus === 'suggested';

    return [
      'p',
      mergeAttributes(HTMLAttributes, {
        'data-node-type': 'cv-draft-line',
        class: `cv-doc-line ${isSuggested ? 'has-suggestion is-suggested' : 'is-accepted'}`,
      }),
      0,
    ];
  },
});

const getNodeText = (node: JSONContent | undefined): string => {
  if (!node) {
    return '';
  }

  if (node.type === 'text') {
    return node.text ?? '';
  }

  return (node.content ?? []).map((childNode) => getNodeText(childNode)).join('');
};

const lineTextToContent = (line: CvBuilderLine): JSONContent[] => {
  const suggestionRanges = [...(line.suggestionRanges ?? [])]
    .filter((range) => range.end > range.start)
    .sort((firstRange, secondRange) => firstRange.start - secondRange.start);

  if (suggestionRanges.length === 0) {
    if (!line.text) {
      return [];
    }

    if (line.status === 'suggested') {
      return [
        {
          type: 'text',
          text: line.text,
          marks: [
            {
              type: 'suggestionMark',
              attrs: {
                suggestionId: `${line.id}-suggestion`,
                rationale: line.rationale,
                sourceCvIds: line.sourceCvIds,
              },
            },
          ],
        },
      ];
    }

    return [{ type: 'text', text: line.text }];
  }

  const content: JSONContent[] = [];
  let cursor = 0;

  suggestionRanges.forEach((range) => {
    if (range.start > cursor) {
      content.push({
        type: 'text',
        text: line.text.slice(cursor, range.start),
      });
    }

    content.push({
      type: 'text',
      text: line.text.slice(range.start, range.end),
      marks: [
        {
          type: 'suggestionMark',
          attrs: {
            suggestionId: range.id,
            rationale: range.rationale,
            sourceCvIds: range.sourceCvIds,
          },
        },
      ],
    });

    cursor = range.end;
  });

  if (cursor < line.text.length) {
    content.push({
      type: 'text',
      text: line.text.slice(cursor),
    });
  }

  return content;
};

const draftToEditorContent = (draft: CvBuilderDraft): JSONContent => ({
  type: 'doc',
  content: draft.sections.flatMap((section) => [
    {
      type: 'cvSectionHeading',
      attrs: {
        sectionId: section.id,
      },
      content: section.title ? [{ type: 'text', text: section.title }] : [],
    },
    ...section.lines.map((line) => ({
      type: 'cvDraftLine',
      attrs: {
        lineId: line.id,
        sectionId: section.id,
        lineStatus: line.status,
        rationale: line.rationale,
        hasSuggestion: (line.suggestionRanges?.length ?? 0) > 0 || line.status === 'suggested',
        suggestionCount: line.suggestionRanges?.length ?? (line.status === 'suggested' ? 1 : 0),
        sourceCvIds: line.sourceCvIds,
      },
      content: lineTextToContent(line),
    })),
  ]),
});

const getSuggestionRangesFromLineNode = (node: JSONContent | undefined): CvBuilderSuggestionRange[] => {
  const suggestionRanges: CvBuilderSuggestionRange[] = [];
  let offset = 0;

  (node?.content ?? []).forEach((childNode) => {
    const textValue = childNode.type === 'text' ? childNode.text ?? '' : getNodeText(childNode);
    const textLength = textValue.length;
    const suggestionMark = childNode.marks?.find((mark) => mark.type === 'suggestionMark');

    if (suggestionMark && textLength > 0) {
      suggestionRanges.push({
        id: String(suggestionMark.attrs?.suggestionId ?? `suggestion-${offset}`),
        start: offset,
        end: offset + textLength,
        rationale: String(suggestionMark.attrs?.rationale ?? ''),
        sourceCvIds: Array.isArray(suggestionMark.attrs?.sourceCvIds) ? suggestionMark.attrs?.sourceCvIds.map(String) : [],
      });
    }

    offset += textLength;
  });

  return suggestionRanges;
};

const editorContentToDraft = (editorContent: JSONContent, previousDraft: CvBuilderDraft): CvBuilderDraft => {
  const previousSections = new Map(previousDraft.sections.map((section) => [section.id, section]));
  const nextSections: CvBuilderDraft['sections'] = [];
  let currentSectionId: string | null = null;

  (editorContent.content ?? []).forEach((node, index) => {
    if (node.type === 'cvSectionHeading') {
      const sectionId = String(node.attrs?.sectionId ?? `section-${index + 1}`);
      currentSectionId = sectionId;
      nextSections.push({
        id: sectionId,
        title: normalizeCvSectionTitle(getNodeText(node)) || previousSections.get(sectionId)?.title || 'UNTITLED SECTION',
        lines: [],
      });
      return;
    }

    if (node.type === 'cvDraftLine' && currentSectionId) {
      const currentSection = nextSections[nextSections.length - 1];

      if (!currentSection) {
        return;
      }

      currentSection.lines.push({
        id: String(node.attrs?.lineId ?? `${currentSectionId}-line-${currentSection.lines.length + 1}`),
        text: getNodeText(node),
        status: getSuggestionRangesFromLineNode(node).length > 0 ? 'suggested' : 'accepted',
        rationale: String(node.attrs?.rationale ?? ''),
        sourceCvIds: Array.isArray(node.attrs?.sourceCvIds) ? node.attrs?.sourceCvIds.map(String) : [],
        suggestionRanges: getSuggestionRangesFromLineNode(node),
      });
    }
  });

  return {
    ...previousDraft,
    sections: nextSections,
  };
};

const getSelectionContext = (editor: NonNullable<ReturnType<typeof useEditor>>, draft: CvBuilderDraft): SelectionContext => {
  const parentNode = editor.state.selection.$anchor.parent;

  if (parentNode.type.name === 'cvDraftLine') {
    const sectionId = String(parentNode.attrs.sectionId ?? '');
    const lineId = String(parentNode.attrs.lineId ?? '');
    const lineOffset = editor.state.selection.from - editor.state.selection.$anchor.start();
    const matchedLine = draft.sections
      .find((section) => section.id === sectionId)
      ?.lines.find((line) => line.id === lineId);
    const activeSuggestion = matchedLine?.suggestionRanges?.find(
      (range) => lineOffset >= range.start && lineOffset <= range.end
    );

    return {
      type: 'line',
      sectionId,
      lineId,
      lineStatus: activeSuggestion ? 'suggested' : 'accepted',
      activeSuggestion: activeSuggestion
        ? {
            id: activeSuggestion.id,
            rationale: activeSuggestion.rationale,
            sourceCvIds: activeSuggestion.sourceCvIds,
          }
        : null,
    };
  }

  if (parentNode.type.name === 'cvSectionHeading') {
    return {
      type: 'section',
      sectionId: String(parentNode.attrs.sectionId ?? ''),
      sectionTitle: parentNode.textContent,
    };
  }

  return null;
};

export default function CvDraftEditor({
  draft,
  cvSources,
  onDraftChange,
  onMoveSection,
  onMoveLine,
}: CvDraftEditorProps) {
  const [selectionContext, setSelectionContext] = useState<SelectionContext>(null);
  const [suggestionPopupPosition, setSuggestionPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const serializedDraft = useMemo(() => JSON.stringify(draft), [draft]);
  const cvHeaderContact = useMemo(() => extractCvHeaderContact(cvSources, draft.sourceCvIds), [cvSources, draft.sourceCvIds]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        paragraph: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      CvSectionHeading,
      CvDraftLineNode,
      SuggestionMark,
    ],
    content: draftToEditorContent(draft),
    editorProps: {
      attributes: {
        class: 'cv-doc-editor__surface',
      },
    },
    onUpdate: ({ editor: nextEditor }) => {
      onDraftChange(editorContentToDraft(nextEditor.getJSON(), draft));
    },
    onSelectionUpdate: ({ editor: nextEditor }) => {
      setSelectionContext(getSelectionContext(nextEditor, draft));
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.commands.setContent(draftToEditorContent(draft), { emitUpdate: false });
    setSelectionContext(getSelectionContext(editor, draft));
  }, [editor, serializedDraft, draft]);

  useEffect(() => {
    if (!editor || selectionContext?.type !== 'line' || !selectionContext.activeSuggestion) {
      setSuggestionPopupPosition(null);
      return;
    }

    const updatePopupPosition = () => {
      const { from, to } = editor.state.selection;
      const startCoords = editor.view.coordsAtPos(from);
      const endCoords = editor.view.coordsAtPos(to);
      const midpoint = startCoords.left + (endCoords.right - startCoords.left) / 2;

      setSuggestionPopupPosition({
        top: Math.max(16, startCoords.top - 12),
        left: midpoint,
      });
    };

    updatePopupPosition();

    window.addEventListener('resize', updatePopupPosition);
    window.addEventListener('scroll', updatePopupPosition, true);

    return () => {
      window.removeEventListener('resize', updatePopupPosition);
      window.removeEventListener('scroll', updatePopupPosition, true);
    };
  }, [editor, selectionContext, serializedDraft]);

  const updateSelectedSuggestion = (mode: 'accept' | 'decline') => {
    if (!selectionContext || selectionContext.type !== 'line' || !selectionContext.activeSuggestion) {
      return;
    }

    const { sectionId, lineId, activeSuggestion } = selectionContext;

    onDraftChange({
      ...draft,
      sections: draft.sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        return {
          ...section,
          lines: section.lines.map((line) => {
            if (line.id !== lineId) {
              return line;
            }

            const nextSuggestionRanges = (line.suggestionRanges ?? []).filter((range) => range.id !== activeSuggestion.id);
            const declinedRange = (line.suggestionRanges ?? []).find((range) => range.id === activeSuggestion.id);

            if (!declinedRange) {
              return line;
            }

            if (mode === 'accept') {
              return {
                ...line,
                status: nextSuggestionRanges.length > 0 ? 'suggested' : 'accepted',
                suggestionRanges: nextSuggestionRanges,
              };
            }

            const removedLength = declinedRange.end - declinedRange.start;
            const nextText = `${line.text.slice(0, declinedRange.start)}${line.text.slice(declinedRange.end)}`;
            const adjustedRanges = nextSuggestionRanges.map((range) => {
              if (range.start >= declinedRange.end) {
                return {
                  ...range,
                  start: range.start - removedLength,
                  end: range.end - removedLength,
                };
              }

              return range;
            });

            return {
              ...line,
              text: nextText,
              status: adjustedRanges.length > 0 ? 'suggested' : 'accepted',
              suggestionRanges: adjustedRanges,
            };
          }),
        };
      }),
    });
  };

  if (!editor) {
    return (
      <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5 text-sm text-on-surface-variant">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant">Draft Match</p>
        <p className="mt-1 text-3xl font-headline font-extrabold text-on-surface">{draft.matchScore}%</p>
      </div>

      <div className="cv-doc-editor rounded-[32px] border border-outline-variant/60 bg-[#eef3f8] px-4 py-5 shadow-sm sm:px-6">
        <div className="cv-doc-page">
          <div className="cv-doc-page__header">
            <h1 className="cv-doc-page__title">{cvHeaderContact.name}</h1>
            <div className="cv-doc-page__contact-row">
              {cvHeaderContact.phone && <span>{cvHeaderContact.phone}</span>}
              {cvHeaderContact.linkedin && <span>{cvHeaderContact.linkedin}</span>}
              {cvHeaderContact.github && <span>{cvHeaderContact.github}</span>}
            </div>
            <div className="cv-doc-page__summary">
              <p className="cv-doc-page__section-label">{CV_SUMMARY_HEADING}</p>
              <p className="cv-doc-page__summary-copy">{draft.summary}</p>
            </div>
          </div>

          <EditorContent editor={editor} />
        </div>
      </div>

      {selectionContext?.type === 'line' && selectionContext.activeSuggestion && suggestionPopupPosition && (
        <div
          className="cv-doc-suggestion-popup"
          style={{
            top: suggestionPopupPosition.top,
            left: suggestionPopupPosition.left,
            transform: 'translate(-50%, calc(-100% - 12px))',
          }}
        >
          <div className="cv-doc-suggestion-popup__actions">
            <button
              type="button"
              onClick={() => updateSelectedSuggestion('accept')}
              className="cv-doc-suggestion-popup__button cv-doc-suggestion-popup__button--accept"
            >
              <Check size={14} />
              Accept
            </button>
            <button
              type="button"
              onClick={() => updateSelectedSuggestion('decline')}
              className="cv-doc-suggestion-popup__button cv-doc-suggestion-popup__button--decline"
            >
              <X size={14} />
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}