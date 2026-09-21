import React from 'react';
import { Aircraft, AirportLocation } from '../types';
import { CheckCircle2, AlertTriangle, Navigation, Wrench, MapPin } from 'lucide-react';

interface StatsBarProps {
  fleet: Aircraft[];
  onSelectLocation?: (loc: AirportLocation) => void;
  selectedLocation?: AirportLocation | 'All';
}

export const StatsBar: React.FC<StatsBarProps> = ({
  fleet,
  onSelectLocation,
  selectedLocation,
}) => {
  const total = fleet.length;
  const up = fleet.filter((p) => p.status === 'Up').length;
  const lowHours = fleet.filter((p) => p.status === 'Up-Low Hours').length;
  const enroute = fleet.filter((p) => p.status === 'Up-Enroute').length;
  const down = fleet.filter((p) => p.status === 'Down').length;

  const madrasCount = fleet.filter((p) => p.location === 'Madras').length;
  const skyServiceCount = fleet.filter((p) => p.location === 'Sky Service').length;
  const campusCount = fleet.filter((p) => p.location === 'HAA Campus').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 my-4">
      {/* Total Aircraft */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <span className="text-xs text-slate-400 font-medium">Total Fleet</span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-black text-white">{total}</span>
          <span className="text-[10px] text-slate-500 font-mono">RDM Fleet</span>
        </div>
      </div>

      {/* Up (Ready) */}
      <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <span className="text-xs text-emerald-300 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Flight Ready</span>
        </span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-black text-emerald-400">{up}</span>
          <span className="text-[10px] text-emerald-500/80 font-mono">
            {total > 0 ? Math.round((up / total) * 100) : 0}%
          </span>
        </div>
      </div>

      {/* Up-Low Hours */}
      <div className="bg-amber-950/25 border border-amber-800/40 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Low Hours</span>
        </span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-black text-amber-400">{lowHours}</span>
          <span className="text-[10px] text-amber-400/80 font-mono">&lt; 5h left</span>
        </div>
      </div>

      {/* Enroute */}
      <div className="bg-sky-950/20 border border-sky-800/30 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <span className="text-xs text-sky-300 font-medium flex items-center gap-1">
          <Navigation className="w-3.5 h-3.5 text-sky-400" />
          <span>En Route</span>
        </span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-black text-sky-400">{enroute}</span>
          <span className="text-[10px] text-sky-400/80 font-mono">In Transit</span>
        </div>
      </div>

      {/* Down / MX */}
      <div className="bg-rose-950/20 border border-rose-800/30 rounded-xl p-3 shadow-sm flex flex-col justify-between">
        <span className="text-xs text-rose-300 font-medium flex items-center gap-1">
          <Wrench className="w-3.5 h-3.5 text-rose-400" />
          <span>Down / MX</span>
        </span>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-black text-rose-400">{down}</span>
          <span className="text-[10px] text-rose-400/80 font-mono">AOG / Shop</span>
        </div>
      </div>

      {/* Madras Ramp */}
      <button
        onClick={() => onSelectLocation?.('Madras')}
        className={`text-left rounded-xl p-3 border transition-all ${
          selectedLocation === 'Madras'
            ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500/50'
            : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/40'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-cyan-300 font-medium">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-cyan-400" /> Madras
          </span>
          <span className="text-[10px] font-mono text-cyan-400/70">S33</span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-xl font-bold text-white">{madrasCount}</span>
          <span className="text-[10px] text-slate-400">aircraft</span>
        </div>
      </button>

      {/* Sky Service Ramp */}
      <button
        onClick={() => onSelectLocation?.('Sky Service')}
        className={`text-left rounded-xl p-3 border transition-all ${
          selectedLocation === 'Sky Service'
            ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50'
            : 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/40'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-indigo-300 font-medium">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-indigo-400" /> Sky Service
          </span>
          <span className="text-[10px] font-mono text-indigo-400/70">RDM</span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-xl font-bold text-white">{skyServiceCount}</span>
          <span className="text-[10px] text-slate-400">aircraft</span>
        </div>
      </button>
    </div>
  );
};
