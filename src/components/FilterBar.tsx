import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { AircraftType, AircraftStatus, AirportLocation } from '../types';

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedType: AircraftType | 'All';
  setSelectedType: (type: AircraftType | 'All') => void;
  selectedStatus: AircraftStatus | 'All';
  setSelectedStatus: (status: AircraftStatus | 'All') => void;
  selectedLocation: AirportLocation | 'All';
  setSelectedLocation: (loc: AirportLocation | 'All') => void;
  matchCount: number;
  totalCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedType,
  setSelectedType,
  selectedStatus,
  setSelectedStatus,
  selectedLocation,
  setSelectedLocation,
  matchCount,
  totalCount,
}) => {
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedType !== 'All' ||
    selectedStatus !== 'All' ||
    selectedLocation !== 'All';

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedType('All');
    setSelectedStatus('All');
    setSelectedLocation('All');
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5 mb-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tail number (e.g. 18AC, 49191, 5318M, PA44)..."
            className="w-full pl-10 pr-9 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Aircraft Type Filters */}
          <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 text-xs">
            {(['All', '152', '172', 'PA34', 'PA44'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedType === t
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'All' ? 'All Models' : t === 'PA44' ? 'PA-44' : t === 'PA34' ? 'PA-34' : `C${t}`}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 text-xs">
            {(['All', 'Up', 'Up-Low Hours', 'Up-Enroute', 'Down'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(s)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedStatus === s
                    ? s === 'Up'
                      ? 'bg-emerald-600 text-white'
                      : s === 'Up-Low Hours'
                      ? 'bg-amber-600 text-white'
                      : s === 'Up-Enroute'
                      ? 'bg-sky-600 text-white'
                      : s === 'Down'
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s === 'All' ? 'All Status' : s === 'Up-Low Hours' ? 'Low Hours' : s === 'Up-Enroute' ? 'Enroute' : s}
              </button>
            ))}
          </div>

          {/* Location Filters */}
          <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 text-xs">
            {(['All', 'Madras', 'Sky Service', 'HAA Campus'] as const).map((loc) => (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedLocation === loc
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {loc === 'All' ? 'All Ramps' : loc}
              </button>
            ))}
          </div>

          {/* Reset Filter Button */}
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-400 px-2 py-1 transition-colors"
            >
              <Filter className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Match Count Badge */}
        <div className="text-xs text-slate-400 self-end lg:self-center font-mono">
          Showing <span className="text-white font-bold">{matchCount}</span> of {totalCount}
        </div>
      </div>
    </div>
  );
};
