import React from 'react';
import { BookOpen, Moon, Plus } from 'lucide-react';

const BottomNav = ({ onAdd, goToShelf }) => {
  return (
    <nav
      className="mt-4 w-full"
      style={{
        paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="bg-stone-900/40 backdrop-blur-2xl border border-stone-700/50 rounded-3xl shadow-2xl shadow-black/40 p-2">
        <div className="flex items-center justify-around gap-2">
          <button
            onClick={onAdd}
            className="group flex-1 py-3 px-4 flex flex-col items-center gap-1.5 rounded-2xl hover:bg-white/5 transition-all duration-300 active:scale-95"
            title="Add new item"
          >
            <Plus className="w-6 h-6 text-stone-300 group-hover:text-amber-300 transition-colors" />
            <span className="text-xs font-bold tracking-wide text-stone-400 group-hover:text-stone-200 transition-colors">
              Add
            </span>
          </button>

          <button
            disabled
            className="group flex-1 py-3 px-4 flex flex-col items-center gap-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 cursor-default"
            title="Tonight"
          >
            <Moon className="w-6 h-6 text-amber-400" />
            <span className="text-xs font-bold tracking-wide text-amber-300">
              Tonight
            </span>
          </button>

          <button
            onClick={goToShelf}
            className="group flex-1 py-3 px-4 flex flex-col items-center gap-1.5 rounded-2xl hover:bg-white/5 transition-all duration-300 active:scale-95"
            title="Go to Library"
          >
            <BookOpen className="w-6 h-6 text-stone-300 group-hover:text-stone-100 transition-colors" />
            <span className="text-xs font-bold tracking-wide text-stone-400 group-hover:text-stone-200 transition-colors">
              Library
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
