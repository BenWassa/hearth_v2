#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const catalogPath = resolve('src/config/collectionCatalog.js');
const source = await readFile(catalogPath, 'utf8');

// The catalog is a self-contained ESM file. Re-export its literal tuple list
// through a data URL so this .mjs audit can run without changing package type.
const auditModule = `${source}\nexport { entries as __auditEntries };`;
const { COLLECTION_CATALOG, __auditEntries: entries } = await import(
  `data:text/javascript;base64,${Buffer.from(auditModule).toString('base64')}`
);

const problems = [];
const ids = new Set();
const seenKeys = new Set();

for (const [
  providerId,
  name,
  worldId,
  defaultVisible = true,
  sequenceMode = 'linear',
] of entries) {
  const key = `tmdb:${providerId}`;
  if (ids.has(providerId))
    problems.push(`duplicate provider ID: ${providerId}`);
  ids.add(providerId);
  if (seenKeys.has(key)) problems.push(`duplicate catalog key: ${key}`);
  seenKeys.add(key);
  if (!/^\d+$/.test(providerId))
    problems.push(`${key}: provider ID must be numeric text`);
  if (typeof name !== 'string' || !name.trim())
    problems.push(`${key}: name is required`);
  if (worldId !== null && (typeof worldId !== 'string' || !worldId.trim())) {
    problems.push(`${key}: worldId must be a non-empty string or null`);
  }
  if (typeof defaultVisible !== 'boolean')
    problems.push(`${key}: defaultVisible must be boolean`);
  if (!['linear', 'anthology'].includes(sequenceMode)) {
    problems.push(`${key}: unsupported sequenceMode ${String(sequenceMode)}`);
  }

  const entry = COLLECTION_CATALOG[key];
  if (!entry) {
    problems.push(`${key}: tuple is missing from COLLECTION_CATALOG`);
    continue;
  }
  if (entry.provider !== 'tmdb' || entry.providerId !== providerId) {
    problems.push(
      `${key}: materialized provider identity does not match tuple`,
    );
  }
  if (entry.name !== name || entry.worldId !== worldId) {
    problems.push(`${key}: materialized name/worldId does not match tuple`);
  }
  if (
    entry.defaultVisible !== defaultVisible ||
    entry.sequenceMode !== sequenceMode
  ) {
    problems.push(
      `${key}: materialized visibility/sequenceMode does not match tuple`,
    );
  }
  if (typeof entry.rail !== 'boolean')
    problems.push(`${key}: rail must be boolean`);
}

for (const key of Object.keys(COLLECTION_CATALOG)) {
  if (!seenKeys.has(key))
    problems.push(`${key}: catalog key has no source tuple`);
}

if (problems.length) {
  console.error(
    `Collection catalog audit failed (${problems.length} issue${
      problems.length === 1 ? '' : 's'
    }):`,
  );
  for (const problem of problems) console.error(`- ${problem}`);
  process.exitCode = 1;
} else {
  console.log(`Collection catalog audit passed (${entries.length} entries).`);
}
