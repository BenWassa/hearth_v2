import React, { useState } from 'react';
import SagaRow from '../../../components/cards/SagaRow.jsx';
import {
  rankSagas,
  selectTonightSagas,
} from '../../../domain/media/collectionActivity.js';

const CollectionsRail = ({
  collections = [],
  onOpenCollection,
  onBrowse,
  counts,
}) => {
  const [selection] = useState(() =>
    selectTonightSagas(collections, { now: Date.now(), counts }).map(
      (saga) => saga.id,
    ),
  );
  const ranked = rankSagas(collections, { now: Date.now(), counts });
  const preview = selection
    .map((id) => ranked.find((saga) => saga.id === id))
    .filter((saga) => saga && saga.activity.tier > 0);
  return (
    <section aria-label="Collections" className="space-y-1 px-1">
      <div className="flex flex-wrap items-center justify-between gap-x-2">
        <h2 className="font-serif text-xl text-stone-100">Collections</h2>
        <button
          type="button"
          onClick={onBrowse}
          className="min-h-[44px] py-2 text-sm text-amber-300 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
        >
          Browse all {collections.length}{' '}
          {collections.length === 1 ? 'saga' : 'sagas'}{' '}
          <span aria-hidden="true">→</span>
        </button>
      </div>
      {preview.map((saga) => (
        <SagaRow key={saga.id} saga={saga} onOpen={onOpenCollection} reason />
      ))}
    </section>
  );
};
export default React.memo(CollectionsRail);
