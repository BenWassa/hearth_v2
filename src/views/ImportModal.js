import React, { useEffect, useRef, useState } from 'react';
import { Film, MessageSquare, Tv, X } from 'lucide-react';
import { ENERGIES, PRESET_SUGGESTIONS, VIBES } from '../config/constants.js';
import {
  normalizeItem,
  parseText,
  resolveDefaults,
  validateItem,
} from '../domain/import/importer.js';
import { copyToClipboard } from '../utils/clipboard.js';
import Button from '../components/ui/Button.js';
import TextArea from '../components/ui/TextArea.js';

const ImportModal = ({ onClose, onImport, validVibes, validEnergies }) => {
  const defaults = { vibe: 'comfort', energy: 'balanced' };
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
  const scrollContainerRef = useRef(null);
  const issueRefs = useRef(new Map());
  const vibeOptions = VIBES.filter((v) => validVibes?.includes(v.id));
  const energyOptions = ENERGIES.filter((e) => validEnergies?.includes(e.id));

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
    "vibe": "comfort | easy | gripping | visual | classic",
    "energy": "light | balanced | focused",
    "runtimeMinutes": "optional number",
    "note": "optional string"
  }
]

Use the titles below and assign a best-fit type, vibe, and energy.
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
  };

  const fillDefaults = () => {
    setRows((prev) =>
      prev.map((row) => {
        if (!row.include) return row;
        const nextData = resolveDefaults(row.data, defaults);
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
  };

  const selectedRows = rows.filter((row) => row.include);
  const needsAttention = selectedRows.some(
    (row) => row.errors.length > 0 || row.missing.length > 0,
  );
  const issueRows = selectedRows.filter(
    (row) => row.errors.length > 0 || row.missing.length > 0,
  );
  const displayRows = showAllRows ? selectedRows : issueRows;

  const handleImport = async () => {
    setActionError('');
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

    setIsImporting(true);
    try {
      await onImport(selectedRows.map((row) => row.data));
    } catch (err) {
      setActionError('Import failed. Please try again.');
    } finally {
      setIsImporting(false);
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
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
    const nextIssue = rows.slice(currentIndex + 1).find((row) => {
      return row.include && (row.errors.length > 0 || row.missing.length > 0);
    });

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
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setHighlightId(nextIssue.id);
      setTimeout(() => setHighlightId(null), 1200);
    }
    setLastEditedId(null);
  }, [lastEditedId, rows, step]);

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-md flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
      <div className="w-full sm:max-w-4xl bg-stone-950 border border-stone-800 rounded-none sm:rounded-2xl shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-stone-900">
          <div className="space-y-2 flex-1">
            <h3 className="text-xl font-serif text-stone-100">
              Import Watchlist
            </h3>
            <p className="text-xs text-stone-400 leading-relaxed">
              Paste JSON (preferred) or CSV below, preview changes, then commit
              to your shelf.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 -mt-2 rounded-full text-stone-400 hover:text-stone-300 hover:bg-stone-900/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div
          ref={scrollContainerRef}
          className="px-6 py-6 space-y-6 overflow-y-auto flex-1 min-h-0"
        >
          {step === 'prompt' && (
            <>
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400">
                  Step 1 of 3: Generate JSON with an LLM
                </label>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Paste your existing titles into the prompt placeholder, then
                  ask an LLM to return JSON that matches Hearth&#39;s schema.
                </p>
                <textarea
                  value={llmPrompt}
                  readOnly
                  rows={10}
                  className="w-full bg-stone-900/40 border border-stone-800 text-stone-300 placeholder-stone-600 px-4 py-3 rounded-xl focus:outline-none font-mono text-xs resize-none"
                />
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={copyPrompt}>
                    {promptCopied ? 'Prompt Copied' : 'Copy Prompt'}
                  </Button>
                  <Button variant="ghost" onClick={loadSampleData}>
                    Load sample data
                  </Button>
                </div>
              </div>
            </>
          )}

          {step === 'paste' && (
            <>
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400">
                  Step 2 of 3: Paste JSON or CSV
                </label>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Paste the data from your LLM or CSV export, then preview the
                  import.
                </p>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder='[{"title":"Spirited Away","type":"movie","vibe":"visual","energy":"balanced"}]'
                  rows={8}
                  className="w-full bg-stone-900/60 border border-stone-800 text-stone-200 placeholder-stone-600 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-900/50 focus:border-amber-700/50 transition-all font-mono text-xs resize-none"
                />
                {parseError && (
                  <div className="text-xs text-red-400 bg-red-900/10 border border-red-900/30 rounded-lg px-3 py-2">
                    ⚠️ {parseError}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'review' && (
            <>
              <div className="space-y-5">
                <label className="text-xs font-bold uppercase tracking-widest text-stone-400">
                  Step 3 of 3: Fix missing details
                </label>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Only items that need attention are shown. Everything else is
                  ready to import.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Button variant="secondary" onClick={fillDefaults}>
                    Auto-fill Defaults
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      jumpToFirstIssue();
                    }}
                  >
                    Assign Manually
                  </Button>
                  <div className="flex items-center gap-3 text-xs text-stone-500 sm:ml-auto">
                    <span>{selectedRows.length} selected</span>
                    <span className="w-px h-4 bg-stone-800" />
                    <span>Issues: {issueRows.length}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllRows((prev) => !prev)}
                  className="text-xs text-stone-400 hover:text-stone-200"
                >
                  {showAllRows ? 'Show issues only' : 'Show all rows'}
                </button>
              </div>

              {displayRows.length === 0 && (
                <div className="text-xs text-stone-500 bg-stone-900/30 rounded-lg px-3 py-3">
                  No issues found. You&#39;re ready to import.
                </div>
              )}

              {displayRows.length > 0 && (
                <div className="space-y-3">
                  {displayRows.map((row, index) => {
                    const hasIssues =
                      row.errors.length > 0 || row.missing.length > 0;
                    const errorFields = row.errors.map((e) => e.field);
                    const missingVibe = row.missing.includes('vibe');
                    const missingEnergy = row.missing.includes('energy');
                    const hasTypeError = errorFields.includes('type');
                    const hasVibeError = errorFields.includes('vibe');
                    const hasEnergyError = errorFields.includes('energy');

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
                        className={`border rounded-2xl p-5 space-y-5 transition-all scroll-mt-24 ${
                          hasIssues
                            ? 'border-amber-900/50 bg-amber-900/10'
                            : 'border-stone-800 bg-stone-900/30'
                        } ${!row.include ? 'opacity-50' : ''} ${
                          highlightId === row.id
                            ? 'ring-2 ring-amber-600/40 shadow-lg shadow-amber-900/20'
                            : ''
                        }`}
                      >
                        <div className="space-y-2">
                          <span className="text-xs uppercase tracking-widest text-stone-400 font-bold whitespace-normal break-words">
                            {row.data.title || `Row ${index + 1}`}
                          </span>
                          <label className="flex items-center gap-3 cursor-pointer group sm:self-end">
                            <input
                              type="checkbox"
                              checked={row.include}
                              onChange={() => toggleRowById(row.id)}
                              className="w-4 h-4 rounded border-stone-700 bg-stone-900 text-amber-600 focus:ring-amber-900/50 accent-amber-600 cursor-pointer"
                            />
                            <span className="text-xs text-stone-500 group-hover:text-stone-400">
                              Import this
                            </span>
                          </label>
                        </div>

                        <input
                          value={row.data.title}
                          onChange={(e) =>
                            updateRowById(row.id, 'title', e.target.value)
                          }
                          placeholder="Title (required)"
                          className={`w-full bg-stone-900/50 border rounded-lg px-3 py-2 text-sm transition-all ${
                            errorFields.includes('title')
                              ? 'border-red-900/50 text-red-200'
                              : 'border-stone-800 text-stone-200'
                          } placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-900/50`}
                        />

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
                            <span
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
                              const TypeIcon = type === 'movie' ? Film : Tv;
                              return (
                                <button
                                  key={type}
                                  onClick={() =>
                                    updateRowById(row.id, 'type', type)
                                  }
                                  className={`flex-1 py-2 rounded-lg border text-xs uppercase tracking-widest transition-all ${
                                    isSelected
                                      ? 'bg-stone-800 border-stone-700 text-stone-200'
                                      : 'border-stone-800 text-stone-400 hover:bg-stone-900'
                                  }`}
                                >
                                  <span className="inline-flex items-center justify-center gap-2">
                                    <TypeIcon className="w-3.5 h-3.5" />
                                    {type}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
                            <span
                              className={
                                hasVibeError
                                  ? 'text-red-200'
                                  : missingVibe
                                  ? 'text-amber-200'
                                  : 'text-stone-400'
                              }
                            >
                              Vibe
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {vibeOptions.map((vibe) => {
                              const isSelected = row.data.vibe === vibe.id;
                              const VibeIcon = vibe.icon;
                              return (
                                <button
                                  key={vibe.id}
                                  onClick={() =>
                                    updateRowById(row.id, 'vibe', vibe.id)
                                  }
                                  className={`px-3 py-1.5 rounded-full border text-xs uppercase tracking-widest transition-all ${
                                    isSelected
                                      ? 'bg-stone-800 border-stone-700 text-stone-200'
                                      : 'border-stone-800 text-stone-500 hover:bg-stone-900'
                                  }`}
                                >
                                  <span className="inline-flex items-center gap-1.5">
                                    <VibeIcon className="w-3.5 h-3.5" />
                                    {vibe.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
                            <span
                              className={
                                hasEnergyError
                                  ? 'text-red-200'
                                  : missingEnergy
                                  ? 'text-amber-200'
                                  : 'text-stone-400'
                              }
                            >
                              Energy
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {energyOptions.map((energy) => {
                              const isSelected = row.data.energy === energy.id;
                              const EnergyIcon = energy.icon;
                              return (
                                <button
                                  key={energy.id}
                                  onClick={() =>
                                    updateRowById(row.id, 'energy', energy.id)
                                  }
                                  className={`px-3 py-1.5 rounded-full border text-xs uppercase tracking-widest transition-all ${
                                    isSelected
                                      ? 'bg-stone-800 border-stone-700 text-stone-200'
                                      : 'border-stone-800 text-stone-500 hover:bg-stone-900'
                                  }`}
                                >
                                  <span className="inline-flex items-center gap-1.5">
                                    <EnergyIcon className="w-3.5 h-3.5" />
                                    {energy.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-stone-400">
                            Runtime (minutes)
                            <span className="text-stone-600 normal-case">
                              Optional
                            </span>
                          </div>
                          <input
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
                            className="w-full bg-stone-900/50 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-900/50"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-400">
                            <MessageSquare className="w-3 h-3" />
                            Why this?{' '}
                            <span className="text-stone-700 font-normal normal-case">
                              (Optional)
                            </span>
                          </label>
                          <TextArea
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
        <div
          className="mt-auto sticky bottom-0 z-40 px-6 py-5 border-t border-stone-900 space-y-3 bg-stone-950/50"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {actionError && (
            <div className="text-xs text-amber-500 bg-amber-900/10 border border-amber-900/30 rounded-lg px-3 py-2">
              ⚠️ {actionError}
            </div>
          )}
          {needsAttention && hasPreview && (
            <div className="text-xs text-stone-400 bg-stone-900/30 rounded-lg px-3 py-2">
              Resolve fields marked in red or orange before importing.
            </div>
          )}
          {isImporting && (
            <div className="text-xs text-amber-400 bg-amber-900/10 border border-amber-900/30 rounded-lg px-3 py-2">
              Importing... this can take a moment.
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            {step === 'prompt' && (
              <Button onClick={() => setStep('paste')}>Next</Button>
            )}
            {step === 'paste' && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setStep('prompt')}>
                  Back
                </Button>
                <Button
                  variant="secondary"
                  onClick={handlePreview}
                  disabled={!rawText.trim()}
                >
                  Preview
                </Button>
              </div>
            )}
            {step === 'review' && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setStep('paste')}>
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={
                    !hasPreview ||
                    needsAttention ||
                    selectedRows.length === 0 ||
                    isImporting
                  }
                  className={
                    selectedRows.length > 0 && !needsAttention
                      ? '!shadow-lg !shadow-amber-900/30'
                      : ''
                  }
                >
                  {isImporting ? (
                    'Importing...'
                  ) : selectedRows.length > 0 && !needsAttention ? (
                    <>
                      ✓ Import {selectedRows.length}{' '}
                      {selectedRows.length === 1 ? 'Item' : 'Items'}
                    </>
                  ) : (
                    'Import'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
