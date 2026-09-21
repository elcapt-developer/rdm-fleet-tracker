import React from 'react';
import { Lock, Unlock, Plus, Search, X } from 'lucide-react';

interface HeaderProps {
  lastUpdatedTime: Date;
  isEditMode: boolean;
  onRequestEditMode: () => void;
  onOpenAddModal: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  totalCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  lastUpdatedTime,
  isEditMode,
  onRequestEditMode,
  onOpenAddModal,
  searchQuery,
  setSearchQuery,
  totalCount,
}) => {
  const formattedTime = lastUpdatedTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 sticky top-0 z-30 shadow-xs">
      <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Title & Last Updated */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              RDM Fleet Tracker
            </h1>
            <span className="text-xs text-slate-500 font-medium hidden md:inline">
              | Redmond Campus
            </span>
            {totalCount !== undefined && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white shadow-xs tabular-nums">
                <span>{totalCount}</span>
                <span className="text-[10px] font-normal text-slate-300">Fleet</span>
              </span>
            )}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Last updated: <span className="text-slate-700 font-semibold">{formattedTime}</span>
          </div>
        </div>

        {/* Right Actions: Search, Add, Edit Mode */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          {/* Simple Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tail # (18AC, 49191)..."
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Add Aircraft (Visible in Edit Mode) */}
          {isEditMode && (
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Aircraft</span>
            </button>
          )}

          {/* Edit Mode Toggle */}
          <button
            onClick={onRequestEditMode}
            title={isEditMode ? 'Click to lock into View Only mode' : 'Click to enter password and enable Edit Mode'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isEditMode
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isEditMode ? <Unlock className="w-3.5 h-3.5 text-amber-600" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isEditMode ? 'Edit Mode ON' : 'Edit Mode'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
