import React, { useEffect, useRef, useState } from 'react';
import { Film, MessageSquare, Tv, X } from 'lucide-react';
import { PRESET_SUGGESTIONS } from '../config/constants.js';
import {
  buildImportDedupeKey,
  normalizeItem,
  parseText,
  validateItem,
} from '../domain/import/importer.js';
import { copyToClipboard } from '../utils/clipboard.js';
import Button from '../components/ui/Button.jsx';
import IconButton from '../components/ui/IconButton.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import SelectChip from '../components/ui/SelectChip.jsx';
import TextArea from '../components/ui/TextArea.jsx';
import Dialog from '../components/ui/Dialog.jsx';

const FIELD_FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60';

const ImportModal = ({
  onClose,
  onImport,
  importProgress,
  validVibes,
  validEnergies,
  existingItems = [],
}) => {
  const [rawText, setRawText] = useState('');
  const [rows, setRows] = useState([]);
  const [parseError, setParseError] = useState('');
  const [actionError, setActionError] = useState('');
  const [hasPreview, setHasPreview] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [step, setStep] = useState('prompt');
  const [showAllRows, setShowAllRows] = useState(false);
  const [lastEditedId, setLastEditedId] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [showSlowLoadSkeletons, setShowSlowLoadSkeletons] = useState(false);
  const isMountedRef = useRef(true);
  const scrollContainerRef = useRef(null);
  const stepFocusRef = useRef(null);
  const issueRefs = useRef(new Map());

  useEffect(() => {
    stepFocusRef.current?.focus({ preventScroll: true });
  }, [step]);

  const focusIssue = (node) => {
    const field = node?.querySelector('[aria-invalid="true"]');
    (field || node || stepFocusRef.current)?.focus({ preventScroll: true });
  };

  const scrollIssueIntoView = (node) => {
    const prefersReducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    node.scrollIntoView?.({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  };

  const smoothScrollTo = (container, target) => {
    if (!container) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      container.scrollTop = target;
      return;
    }

    const start = container.scrollTop;
    const distance = target - start;
    const duration = 400;
    let startTime = null;

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      container.scrollTop = start + distance * eased;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  };

  const llmPrompt = `You are helping me create a JSON watchlist for the Hearth app.
Return ONLY valid JSON (no markdown, no commentary).
Use standard ASCII double quotes (") for all keys and string values.
Each item must match this schema:
[
  {
    "title": "string",
    "type": "movie | show",
    "runtimeMinutes": "optional number",
    "note": "optional string"
  }
]

Use the titles below and identify their movie or show type. Do not infer viewing categories.
Titles:
{{PASTE_TITLES_HERE}}`;

  const copyPrompt = async () => {
    try {
      const copied = await copyToClipboard(llmPrompt);
      if (copied) {
        setPromptCopied(true);
        setTimeout(() => setPromptCopied(false), 1500);
        return;
      }
      setActionError('Clipboard not available. Copy the prompt manually.');
    } catch (err) {
      setActionError('Could not copy the prompt. Copy it manually.');
    }
  };

  const loadSampleData = () => {
    const sampleJson = JSON.stringify(PRESET_SUGGESTIONS, null, 2);
    setRawText(sampleJson);
    setParseError('');
    setActionError('');
    setHasPreview(false);
    setRows([]);
    setStep('paste');
  };

  const buildRows = (items) =>
    items.map((item, index) => {
      const normalized = normalizeItem(item);
      const validation = validateItem(normalized, {
        validVibes,
        validEnergies,
        allowMissing: true,
      });

      return {
        id: `${index}`,
        data: normalized,
        errors: validation.errors,
        missing: validation.missing,
        include: true,
      };
    });

  const handlePreview = () => {
    const result = parseText(rawText);
    if (result.error) {
      setParseError(result.error);
      setRows([]);
      setHasPreview(false);
      return;
    }

    setParseError('');
    setActionError('');
    setRows(buildRows(result.items));
    setHasPreview(true);
    setStep('review');
  };

  const updateRowById = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const nextData = normalizeItem({ ...row.data, [field]: value });
        const validation = validateItem(nextData, {
          validVibes,
          validEnergies,
          allowMissing: true,
        });
        return {
          ...row,
          data: nextData,
          errors: validation.errors,
          missing: validation.missing,
        };
      }),
    );
    setLastEditedId(id);
  };

  const toggleRowById = (id) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, include: !row.include } : row,
      ),
    );
    setLastEditedId(id);
  };

  const selectedRows = rows.filter((row) => row.include);
  const existingKeys = new Set(
    existingItems.map((item) => buildImportDedupeKey(item)).filter(Boolean),
  );
  const selectedUniqueInImportCount = (() => {
    const seen = new Set();
    let count = 0;
    selectedRows.forEach((row) => {
      const key = buildImportDedupeKey(row?.data || {});
      if (!key) {
        count += 1;
        return;
      }
      if (seen.has(key)) return;
      seen.add(key);
      count += 1;
    });
    return count;
  })();
  const selectedDuplicateCount =
    selectedRows.length - selectedUniqueInImportCount;
  const selectedAlreadyExistingCount = (() => {
    const seen = new Set();
    let count = 0;
    selectedRows.forEach((row) => {
      const key = buildImportDedupeKey(row?.data || {});
      if (!key || seen.has(key)) return;
      seen.add(key);
      if (existingKeys.has(key)) count += 1;
    });
    return count;
  })();
  const selectedImportableCount = Math.max(
    selectedUniqueInImportCount - selectedAlreadyExistingCount,
    0,
  );
  const needsAttention = selectedRows.some(
    (row) => row.errors.length > 0 || row.missing.length > 0,
  );
  const canImport =
    hasPreview &&
    !needsAttention &&
    selectedImportableCount > 0 &&
    !isImporting;
  const issueRows = selectedRows.filter(
    (row) => row.errors.length > 0 || row.missing.length > 0,
  );
  const displayRows = showAllRows ? selectedRows : issueRows;
  const progressTotal = Number(importProgress?.total || 0);
  const progressProcessed = Number(importProgress?.processed || 0);
  const hydrationTotal = Number(importProgress?.hydrationTotal || 0);
  const hydrationCompleted = Number(importProgress?.hydrationCompleted || 0);
  const progressRatio =
    progressTotal > 0
      ? Math.min(Math.max(progressProcessed / progressTotal, 0), 1)
      : 0;
  const progressPercent = Math.round(progressRatio * 100);
  const previewCards = Array.isArray(importProgress?.previewCards)
    ? importProgress.previewCards
    : [];
  const shouldShowCoverStrip =
    isImporting && (showSlowLoadSkeletons || previewCards.length > 0);

  const importPhaseMessage = (() => {
    if (!isImporting) return '';
    if (importProgress?.isRateLimitedBackoff) {
      return 'The catalog is busy. Pausing for a moment...';
    }
    if (progressTotal === 0) return 'Getting started...';
    return 'Adding titles to your shelf...';
  })();

  const handleImport = async () => {
    setActionError('');
    setImportError('');
    if (selectedRows.length === 0) {
      setActionError('Select at least one row to import.');
      return;
    }

    const unresolved = selectedRows.some((row) => {
      const validation = validateItem(row.data, { validVibes, validEnergies });
      return !validation.isValid;
    });

    if (unresolved) {
      setActionError('Resolve missing fields before importing.');
      return;
    }

    const selectedPayload = selectedRows.map((row) => row.data);
    setIsImporting(true);

    try {
      const result = await onImport(selectedPayload);
      if (!isMountedRef.current) return;
      if (result === false || result?.ok === false) {
        throw new Error('Import did not finish');
      }
      onClose();
    } catch (err) {
      if (!isMountedRef.current) return;
      setIsImporting(false);
      setImportError(
        'The import did not finish. Try again; titles already added are skipped.',
      );
    }
  };

  const jumpToFirstIssue = () => {
    const firstIssue = rows.find((row) => {
      return row.include && (row.errors.length > 0 || row.missing.length > 0);
    });
    if (!firstIssue) return;
    const node = issueRefs.current.get(firstIssue.id);
    const container = scrollContainerRef.current;
    if (node && container) {
      const nodeRect = node.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const currentScroll = container.scrollTop;
      const target = currentScroll + (nodeRect.top - containerRect.top) - 24;
      smoothScrollTo(container, Math.max(target, 0));
    } else if (node && node.scrollIntoView) {
      scrollIssueIntoView(node);
    }
    focusIssue(node);
    setHighlightId(firstIssue.id);
    setTimeout(() => setHighlightId(null), 1200);
  };

  useEffect(() => {
    if (!lastEditedId || step !== 'review') return;
    const current = rows.find((row) => row.id === lastEditedId);
    if (!current) return;
    const currentHasIssues =
      current.include &&
      (current.errors.length > 0 || current.missing.length > 0);
    if (currentHasIssues) return;

    const currentIndex = rows.findIndex((row) => row.id === lastEditedId);
    const isIssue = (row) =>
      row.include && (row.errors.length > 0 || row.missing.length > 0);
    const nextIssue =
      rows.slice(currentIndex + 1).find(isIssue) || rows.find(isIssue);

    if (nextIssue) {
      const node = issueRefs.current.get(nextIssue.id);
      const container = scrollContainerRef.current;
      if (node && container) {
        const nodeRect = node.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const currentScroll = container.scrollTop;
        const target = currentScroll + (nodeRect.top - containerRect.top) - 24;
        smoothScrollTo(container, Math.max(target, 0));
      } else if (node && node.scrollIntoView) {
        scrollIssueIntoView(node);
      }
      focusIssue(node);
      setHighlightId(nextIssue.id);
      setTimeout(() => setHighlightId(null), 1200);
    } else {
      stepFocusRef.current?.focus({ preventScroll: true });
    }
    setLastEditedId(null);
  }, [lastEditedId, rows, step]);

  useEffect(() => {
    if (!isImporting) {
      setShowSlowLoadSkeletons(false);
      return undefined;
    }
    const timer = setTimeout(() => {
      setShowSlowLoadSkeletons(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [isImporting]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return (
    <Dialog
      onClose={onClose}
      aria-labelledby="import-title"
      className="fixed inset-0 z-50 flex items-center justify-center outline-none pl-[calc(1rem+var(--safe-left))] pr-[calc(1rem+var(--safe-right))] sm:pl-[calc(1.5rem+var(--safe-left))] sm:pr-[calc(1.5rem+var(--safe-right))] pt-[max(1.5rem,var(--safe-top))] pb-[max(1.5rem,var(--safe-bottom))] sm:pt-[max(2rem,var(--safe-top))] sm:pb-[max(2rem,var(--safe-bottom))]"
    >
      <div
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 bg-stone-950/85"
      />
      <div className="relative w-full sm:max-w-4xl bg-stone-950 border border-stone-800 rounded-none sm:rounded-2xl shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-stone-900">
          <div className="space-y-2 flex-1">
            <h3 id="import-title" className="text-xl font-serif text-stone-100">
              Import Watchlist
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Paste JSON (preferred) or CSV below, preview changes, then import
              to your shelf.
            </p>
          </div>
          <IconButton
            label="Close import"
            onClick={onClose}
            className="-mr-2 -mt-2 text-stone-400"
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        {/* Main Content */}
        <div
          ref={scrollContainerRef}
          className="px-6 py-6 space-y-6 overflow-y-auto flex-1 min-h-0"
        >
          {step === 'prompt' && (
            <>
              <div className="space-y-3">
                <label
                  htmlFor="import-llm-prompt"
                  className="block text-xs font-bold uppercase tracking-widest text-stone-400"
                >
                  Step 1 of 3: Generate JSON with an LLM
                </label>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Paste your existing titles into the prompt placeholder, then
                  ask an LLM to return JSON that matches Hearth&#39;s schema.
                </p>
                <textarea
                  id="import-llm-prompt"
                  ref={stepFocusRef}
                  value={llmPrompt}
                  readOnly
                  rows={10}
                  className={`w-full bg-stone-900/40 border border-stone-800 text-stone-300 px-4 py-3 rounded-xl font-mono text-xs resize-none ${FIELD_FOCUS}`}
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={copyPrompt}
                    className="px-4 py-2 text-sm min-h-11"
                  >
                    {promptCopied ? 'Prompt Copied' : 'Copy Prompt'}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={loadSampleData}
                    className="px-4 py-2 text-sm min-h-11"
                  >
                    Load sample data
                  </Button>
                </div>
              </div>
            </>
          )}

          {step === 'paste' && (
            <>
              <div className="space-y-3">
                <label
                  htmlFor="import-raw-text"
                  className="block text-xs font-bold uppercase tracking-widest text-stone-400"
                >
                  Step 2 of 3: Paste JSON or CSV
                </label>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Paste the data from your LLM or CSV export, then preview the
                  import.
                </p>
                <textarea
                  id="import-raw-text"
                  ref={stepFocusRef}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder='[{"title":"Spirited Away","type":"movie"}]'
                  rows={8}
                  className={`w-full bg-stone-900/60 border border-stone-800 text-stone-200 placeholder-stone-400 px-4 py-3 rounded-xl focus-visible:border-amber-600/60 transition-opacity font-mono text-xs resize-none ${FIELD_FOCUS}`}
                />
                {parseError && (
                  <div
                    role="alert"
                    className="text-xs text-red-400 bg-red-900/10 border border-red-900/30 rounded-lg px-3 py-2"
                  >
                    {parseError}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              <div className="space-y-5">
                <h4
                  ref={stepFocusRef}
                  tabIndex={-1}
                  className="text-xs font-bold uppercase tracking-widest text-stone-400 focus:outline-none"
                >
                  Step 3 of 3: Review titles
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Only items that need attention are shown. Everything else is
                  ready to import.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Button
                    variant="primary"
                    onClick={() => {
                      jumpToFirstIssue();
                    }}
                    className="px-4 py-2 text-sm min-h-11"
                  >
                    Fix details
                  </Button>
                  <div className="flex items-center gap-3 text-xs text-stone-400 sm:ml-auto">
                    <span>{selectedRows.length} selected</span>
                    <span className="w-px h-4 bg-stone-800" />
                    <span>Issues: {issueRows.length}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllRows((prev) => !prev)}
                  type="button"
                  className={`min-h-11 -ml-2 px-2 rounded-lg text-xs text-stone-400 hover:text-stone-200 ${FIELD_FOCUS}`}
                >
                  {showAllRows ? 'Show issues only' : 'Show all rows'}
                </button>
              </div>

              {displayRows.length === 0 && (
                <div className="text-xs text-stone-400 bg-stone-900/30 rounded-lg px-3 py-3">
                  No issues found. You&#39;re ready to import.
                </div>
              )}

              {displayRows.length > 0 && (
                <div className="divide-y divide-stone-800">
                  {displayRows.map((row, index) => {
                    const errorFields = row.errors.map((e) => e.field);
                    const hasTypeError = errorFields.includes('type');
                    const fieldError = (field) =>
                      row.errors.find((error) => error.field === field)
                        ?.message;
                    const titleError = fieldError('title');
                    const typeError = fieldError('type');

                    return (
                      <div
                        key={row.id}
                        ref={(node) => {
                          if (!node) {
                            issueRefs.current.delete(row.id);
                          } else {
                            issueRefs.current.set(row.id, node);
                          }
                        }}
                        className={`-mx-3 px-3 py-5 space-y-5 rounded-xl transition-opacity scroll-mt-24 ${
                          !row.include ? 'opacity-50' : ''
                        } ${highlightId === row.id ? 'bg-amber-500/10' : ''}`}
                        tabIndex={-1}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs uppercase tracking-widest text-stone-400 font-bold whitespace-normal break-words min-w-0">
                            {row.data.title || `Row ${index + 1}`}
                          </span>
                          <label className="flex min-h-11 shrink-0 items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={row.include}
                              onChange={() => toggleRowById(row.id)}
                              className={`w-5 h-5 rounded border-stone-700 bg-stone-900 text-amber-600 accent-amber-600 cursor-pointer ${FIELD_FOCUS}`}
                            />
                            <span className="text-xs text-stone-400 group-hover:text-stone-200">
                              Import this
                            </span>
                          </label>
                        </div>

                        <input
                          value={row.data.title}
                          onChange={(e) =>
                            updateRowById(row.id, 'title', e.target.value)
                          }
                          aria-label="Title"
                          aria-invalid={Boolean(titleError)}
                          aria-describedby={
                            titleError
                              ? `import-title-error-${row.id}`
                              : undefined
                          }
                          placeholder="Title (required)"
                          className={`w-full min-h-11 bg-stone-900/50 border rounded-lg px-3 py-2 text-sm transition-opacity ${
                            errorFields.includes('title')
                              ? 'border-red-900/50 text-red-200'
                              : 'border-stone-800 text-stone-200'
                          } placeholder-stone-400 ${FIELD_FOCUS}`}
                        />
                        {titleError && (
                          <p
                            id={`import-title-error-${row.id}`}
                            className="text-sm text-red-300"
                          >
                            {titleError}
                          </p>
                        )}

                        <div
                          role="group"
                          aria-labelledby={`import-type-label-${row.id}`}
                          aria-invalid={Boolean(typeError)}
                          aria-describedby={
                            typeError
                              ? `import-type-error-${row.id}`
                              : undefined
                          }
                          tabIndex={-1}
                          className={`space-y-2 rounded-lg ${FIELD_FOCUS}`}
                        >
                          <div className="flex items-center gap-2 text-label uppercase tracking-widest">
                            <span
                              id={`import-type-label-${row.id}`}
                              className={
                                hasTypeError ? 'text-red-200' : 'text-stone-400'
                              }
                            >
                              Type
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {['movie', 'show'].map((type) => {
                              const isSelected = row.data.type === type;
                              return (
                                <SelectChip
                                  key={type}
                                  onClick={() =>
                                    updateRowById(row.id, 'type', type)
                                  }
                                  selected={isSelected}
                                  icon={type === 'movie' ? Film : Tv}
                                  className="flex-1 justify-center"
                                >
                                  {type}
                                </SelectChip>
                              );
                            })}
                          </div>
                          {typeError && (
                            <p
                              id={`import-type-error-${row.id}`}
                              className="text-sm text-red-300"
                            >
                              {typeError}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor={`import-runtime-${row.id}`}
                            className="flex items-center gap-2 text-label uppercase tracking-widest text-stone-400"
                          >
                            Runtime (minutes)
                            <span className="text-stone-400 normal-case">
                              Optional
                            </span>
                          </label>
                          <input
                            id={`import-runtime-${row.id}`}
                            value={row.data.runtimeMinutes ?? ''}
                            onChange={(e) =>
                              updateRowById(
                                row.id,
                                'runtimeMinutes',
                                e.target.value,
                              )
                            }
                            type="number"
                            min="1"
                            inputMode="numeric"
                            placeholder="e.g. 97"
                            className={`w-full min-h-11 bg-stone-900/50 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-400 ${FIELD_FOCUS}`}
                          />
                        </div>

                        <div className="space-y-3">
                          <label
                            htmlFor={`import-note-${row.id}`}
                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400"
                          >
                            <MessageSquare className="w-3 h-3" />
                            Why this?{' '}
                            <span className="text-stone-400 font-normal normal-case">
                              (Optional)
                            </span>
                          </label>
                          <TextArea
                            id={`import-note-${row.id}`}
                            value={row.data.note || ''}
                            onChange={(e) =>
                              updateRowById(row.id, 'note', e.target.value)
                            }
                            placeholder="e.g. Heard it's funny, Good for a rainy day..."
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto sticky bottom-0 z-40 px-6 pt-5 pb-[calc(1.25rem+var(--safe-bottom))] border-t border-stone-900 space-y-3 bg-stone-950">
          {actionError && (
            <div
              role="alert"
              className="text-xs text-amber-500 bg-amber-900/10 border border-amber-900/30 rounded-lg px-3 py-2"
            >
              {actionError}
            </div>
          )}
          {importError && (
            <div
              role="alert"
              className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-red-300 bg-red-900/10 border border-red-900/30 rounded-lg px-3 py-2"
            >
              <span className="flex-1">{importError}</span>
              <Button
                variant="secondary"
                onClick={handleImport}
                className="px-4 py-2 text-sm min-h-11"
              >
                Try again
              </Button>
            </div>
          )}
          {needsAttention && hasPreview && (
            <div className="text-xs text-stone-400 bg-stone-900/30 rounded-lg px-3 py-2">
              Resolve missing or invalid fields before importing.
            </div>
          )}
          {isImporting && (
            <div className="rounded-xl border border-stone-800 bg-stone-900 px-3 py-3 space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-amber-300" aria-live="polite">
                  {importPhaseMessage}
                </span>
                <span className="tabular-nums font-semibold text-amber-200">
                  {progressPercent}%
                </span>
              </div>
              <ProgressBar
                label="Import progress"
                value={progressPercent}
                heightClassName="h-2"
              />
              <div className="flex items-center justify-between text-label text-stone-400">
                <span className="tabular-nums">
                  {progressProcessed}/{progressTotal || selectedImportableCount}{' '}
                  titles
                </span>
                {hydrationTotal > 0 && (
                  <span className="tabular-nums">
                    Shows: {hydrationCompleted}/{hydrationTotal}
                  </span>
                )}
              </div>
            </div>
          )}
          {shouldShowCoverStrip && (
            <div className="space-y-2">
              <div className="text-label uppercase tracking-widest text-stone-400">
                Covers Incoming
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(previewCards.length
                  ? previewCards
                  : Array.from({ length: 3 }, (_, index) => ({
                      id: `placeholder-${index}`,
                      title: 'Loading',
                      poster: '',
                      type: index % 2 ? 'show' : 'movie',
                    }))
                ).map((card) => (
                  <div
                    key={card.id}
                    className="relative overflow-hidden rounded-lg bg-stone-900"
                  >
                    <div className="aspect-[2/3] w-full">
                      {card.poster ? (
                        <img
                          src={card.poster}
                          alt={`${card.title} poster`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div className="h-full w-full animate-pulse bg-stone-800 flex items-center justify-center text-stone-400">
                          {card.type === 'show' ? (
                            <Tv className="w-4 h-4" />
                          ) : (
                            <Film className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedDuplicateCount > 0 && (
            <div className="text-xs text-stone-400 bg-stone-900/30 rounded-lg px-3 py-2">
              {selectedDuplicateCount} duplicate row
              {selectedDuplicateCount === 1 ? '' : 's'} in this import (same
              title/type/year or provider) will be skipped.
            </div>
          )}
          {selectedAlreadyExistingCount > 0 && (
            <div className="text-xs text-stone-400 bg-stone-900/30 rounded-lg px-3 py-2">
              {selectedAlreadyExistingCount} row
              {selectedAlreadyExistingCount === 1 ? '' : 's'} already in your
              shelf (same title/type/year or provider) will be skipped.
            </div>
          )}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <Button
              variant="ghost"
              onClick={onClose}
              className="px-4 py-2 text-sm min-h-11 whitespace-nowrap flex-shrink-0"
            >
              Cancel
            </Button>
            {step === 'prompt' && (
              <Button
                onClick={() => setStep('paste')}
                className="px-4 py-2 text-sm min-h-11"
              >
                Next
              </Button>
            )}
            {step === 'paste' && (
              <div className="flex items-center gap-2 min-w-0">
                <Button
                  variant="ghost"
                  onClick={() => setStep('prompt')}
                  className="px-4 py-2 text-sm min-h-11 whitespace-nowrap flex-shrink-0"
                >
                  Back
                </Button>
                <Button
                  variant="secondary"
                  onClick={handlePreview}
                  disabled={!rawText.trim()}
                  className="px-4 py-2 text-sm min-h-11"
                >
                  Preview
                </Button>
              </div>
            )}
            {step === 'review' && (
              <div className="flex items-center gap-2 min-w-0">
                <Button
                  variant="ghost"
                  onClick={() => setStep('paste')}
                  className="px-4 py-2 text-sm min-h-11 whitespace-nowrap flex-shrink-0"
                >
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={
                    !hasPreview ||
                    needsAttention ||
                    selectedImportableCount === 0 ||
                    isImporting
                  }
                  className="px-4 py-2 text-sm min-h-11 whitespace-nowrap flex-shrink-0"
                >
                  {isImporting ? (
                    'Importing...'
                  ) : canImport ? (
                    <span className="flex items-center gap-2">
                      <span>Import</span>
                      <span className="tabular-nums font-semibold">
                        {selectedImportableCount}
                      </span>
                      <span>
                        {selectedImportableCount === 1 ? 'Item' : 'Items'}
                      </span>
                    </span>
                  ) : (
                    'Import'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ImportModal;
