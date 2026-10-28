// Public media evidence only. Facets are independent; row allocation is separate.
export const CLASSIFIER_VERSION = 'viewing-2';
export const FACETS = [
  'comfort',
  'comedyFirst',
  'plotMomentum',
  'narrativeComplexity',
  'visualDistinctiveness',
  'attentionDemand',
  'curatedClassic',
];
export const LEVELS = ['unknown', 'low', 'medium', 'high'];
const strings = (v, max = 40) =>
  (Array.isArray(v) ? v : [])
    .filter((x) => typeof x === 'string')
    .map((x) => x.trim().slice(0, 100))
    .filter(Boolean)
    .slice(0, max);
export const canonicalMediaKey = (item = {}) => {
  const provider = item.source?.provider || item.provider || '';
  const id = String(item.source?.providerId || item.providerId || '');
  const type = item.media?.type || item.type;
  return provider === 'tmdb' &&
    /^[1-9]\d*$/.test(id) &&
    ['movie', 'show'].includes(type)
    ? `tmdb:${type === 'show' ? 'tv' : 'movie'}:${id}`
    : '';
};
export const normalizeClassificationInput = (item = {}) => {
  const m = item.media || item;
  return {
    key: canonicalMediaKey(item),
    title: typeof m.title === 'string' ? m.title.slice(0, 200) : '',
    type: m.type === 'show' ? 'show' : 'movie',
    year: /^\d{4}$/.test(String(m.year)) ? String(m.year) : '',
    runtimeMinutes:
      typeof m.runtimeMinutes === 'number' &&
      Number.isFinite(m.runtimeMinutes) &&
      m.runtimeMinutes > 0
        ? m.runtimeMinutes
        : null,
    genres: strings(m.genres, 10).sort(),
    keywords: strings(m.keywords).sort(),
    // English-only baseline. Other locales remain unknown rather than guessing.
    locale:
      typeof (item.source?.locale || item.locale) === 'string'
        ? item.source?.locale || item.locale
        : 'en-US',
  };
};
// Stable revision excludes fetchedAt/artwork/user state. Full serialized input is
// hashed with SHA-256 by the backend; this is also usable as a browser signature.
export const classificationRevision = (item) =>
  JSON.stringify(normalizeClassificationInput(item));
const signal = (
  value = 'unknown',
  method = 'rules',
  confidence = 'unknown',
) => ({ value, method, confidence });
export const classifyMedia = (item = {}) => {
  const input = normalizeClassificationInput(item);
  const attributes = Object.fromEntries(FACETS.map((name) => [name, signal()]));
  const set = (name, value) => {
    attributes[name] = signal(value, 'rules', 'medium');
  };
  if (input.locale.startsWith('en')) {
    const words = new Set(input.keywords.map((s) => s.toLowerCase()));
    const has = (...values) => values.some((v) => words.has(v));
    if (
      has(
        'heartwarming',
        'feel-good',
        'gentle comedy',
        'comforting',
        'relaxing',
        'lighthearted',
      )
    )
      set('comfort', 'high');
    if (
      has(
        'sitcom',
        'stand-up comedy',
        'slapstick',
        'slapstick comedy',
        'screwball comedy',
      )
    ) {
      set('comedyFirst', 'high');
      set('attentionDemand', 'low');
    }
    if (has('nonlinear timeline', 'nonlinear narrative')) {
      set('narrativeComplexity', 'medium');
      set('attentionDemand', 'medium');
    }
    if (has('unreliable narrator', 'mind-bending', 'time paradox')) {
      set('narrativeComplexity', 'high');
      set('attentionDemand', 'high');
    }
    if (has('heist', 'whodunit', 'investigation', 'chase'))
      set('plotMomentum', 'high');
    if (
      has(
        'nature documentary',
        'wildlife documentary',
        'experimental animation',
        'visually stunning',
      )
    )
      set('visualDistinctiveness', 'high');
    if (has('psychological horror', 'disturbing', 'graphic violence')) {
      set('comfort', 'low');
      set('attentionDemand', 'high');
    }
  }
  // Neither age, genre, budget nor runtime establishes a curatorial classic.
  return {
    version: CLASSIFIER_VERSION,
    key: input.key,
    sourceRevision: classificationRevision(item),
    locale: input.locale,
    method: 'rules',
    attributes,
  };
};
export const validateAttributes = (value) => {
  if (
    !value ||
    typeof value !== 'object' ||
    Object.keys(value).length !== FACETS.length
  )
    return false;
  return FACETS.every((name) => {
    const s = value[name];
    return (
      s &&
      Object.keys(s).length === 2 &&
      LEVELS.includes(s.value) &&
      ['unknown', 'low', 'medium', 'high'].includes(s.confidence) &&
      (s.value !== 'unknown' || s.confidence === 'unknown')
    );
  });
};
export const blendClassification = (baseline, attributes, enrichment = {}) => {
  if (!validateAttributes(attributes))
    throw new Error('Invalid classification attributes');
  const metadata =
    typeof enrichment === 'string' ? { model: enrichment } : enrichment || {};
  const merged = Object.fromEntries(
    FACETS.map((name) => {
      const inferred = attributes[name];
      const known = baseline.attributes[name];
      // Public keyword constraints win; unknown AI never erases evidence.
      // Classics require a maintainer's explicit catalog correction.
      return [
        name,
        name === 'curatedClassic' ||
        known.value !== 'unknown' ||
        inferred.confidence === 'low' ||
        inferred.confidence === 'unknown'
          ? known
          : { ...inferred, method: 'gemini' },
      ];
    }),
  );
  return {
    ...baseline,
    method: 'hybrid',
    model: metadata.model,
    ...(metadata.promptVersion
      ? { promptVersion: metadata.promptVersion }
      : {}),
    ...(metadata.inferencePolicyVersion
      ? { inferencePolicyVersion: metadata.inferencePolicyVersion }
      : {}),
    attributes: merged,
  };
};
export const getEffectiveClassification = (item = {}) => {
  const automatic = item.media?.classification || item.classification;
  const baseline = classifyMedia(item);
  const result =
    automatic?.version === CLASSIFIER_VERSION &&
    automatic.key === baseline.key &&
    FACETS.every(
      (name) =>
        LEVELS.includes(automatic.attributes?.[name]?.value) &&
        LEVELS.includes(automatic.attributes?.[name]?.confidence),
    )
      ? automatic
      : baseline;
  // A catalog admin override is facet-only and independent of personal tags.
  const corrections = item.media?.classificationOverride?.attributes || {};
  const attributes = { ...result.attributes };
  for (const name of FACETS) {
    if (LEVELS.includes(corrections[name]))
      attributes[name] = signal(corrections[name], 'admin', 'high');
  }
  return { ...result, attributes };
};
// Missing provenance on historical values means preserve, never reinterpret.
export const tagProvenance = (item = {}) => ({
  vibe:
    item.userState?.tagProvenance?.vibe ||
    item.tagProvenance?.vibe ||
    (item.userState?.vibe || item.vibe ? 'legacy' : 'automatic'),
  energy:
    item.userState?.tagProvenance?.energy ||
    item.tagProvenance?.energy ||
    (item.userState?.energy || item.energy ? 'legacy' : 'automatic'),
});
