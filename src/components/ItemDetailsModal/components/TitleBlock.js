import React from 'react';
import { Edit2 } from 'lucide-react';

const TitleBlock = ({
  item,
  isEditing,
  editedTitle,
  setEditedTitle,
  handleSaveEdit,
  handleCancelEdit,
  setIsEditing,
  onUpdate,
  metadataChips,
  genres,
}) => {
  return (
    <div className="space-y-3">
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full text-3xl sm:text-4xl font-serif text-stone-100 leading-tight bg-stone-900/60 border border-stone-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') handleCancelEdit();
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Title with Edit Button */}
          <div className="flex items-start gap-3">
            <h2 className="flex-1 text-3xl sm:text-4xl lg:text-5xl font-serif text-stone-100 leading-tight tracking-tight">
              {item.title}
            </h2>
            {onUpdate && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-shrink-0 p-2.5 text-stone-500 hover:text-amber-500 hover:bg-stone-800/50 rounded-lg transition-all active:scale-95"
                aria-label="Edit title"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-400">
            {metadataChips.map((chip, index) => (
              <React.Fragment key={chip.label}>
                {index > 0 && (
                  <span className="w-1 h-1 rounded-full bg-stone-700/60" />
                )}
                <div className="flex items-center gap-1.5" title={chip.label}>
                  <chip.icon className="w-3.5 h-3.5 opacity-60" />
                  <span
                    className={chip.isPlaceholder ? 'opacity-50 italic' : ''}
                  >
                    {chip.value}
                  </span>
                </div>
              </React.Fragment>
            ))}
            {genres.length > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-stone-700/60" />
                <span>{genres.slice(0, 3).join(', ')}</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TitleBlock;
