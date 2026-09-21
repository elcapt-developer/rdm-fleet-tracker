import React from 'react';
import { Aircraft, AIRCRAFT_TYPE_LABELS } from '../types';
import { getHoursUrgency } from '../utils/statusUtils';
import { Clock, AlertTriangle, CheckCircle, Wrench, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface InspectionRadarProps {
  fleet: Aircraft[];
  isEditMode: boolean;
  onOpenFlightLogModal: (aircraft: Aircraft) => void;
  onOpenManualInspectionModal?: (aircraft: Aircraft) => void;
  onCompleteInspection: (id: string, signoffBy?: string) => void;
  onOpenEditModal: (aircraft: Aircraft) => void;
}

export const InspectionRadar: React.FC<InspectionRadarProps> = ({
  fleet,
  isEditMode,
  onOpenFlightLogModal,
  onOpenManualInspectionModal,
  onCompleteInspection,
  onOpenEditModal,
}) => {
  // Sort fleet by hoursRemaining ascending (critical planes first)
  const sortedFleet = [...fleet].sort((a, b) => a.hoursRemaining - b.hoursRemaining);

  const grounded = sortedFleet.filter((p) => p.hoursRemaining <= 0 || p.status === 'Down');
  const lowHours = sortedFleet.filter((p) => p.hoursRemaining > 0 && p.hoursRemaining < 5.0 && p.status !== 'Down');
  const caution = sortedFleet.filter((p) => p.hoursRemaining >= 5.0 && p.hoursRemaining <= 15.0 && p.status !== 'Down');
  const healthy = sortedFleet.filter((p) => p.hoursRemaining > 15.0 && p.status !== 'Down');

  const averageHours =
    fleet.length > 0
      ? (fleet.reduce((acc, p) => acc + p.hoursRemaining, 0) / fleet.length).toFixed(1)
      : '0.0';

  const handleSignOff = (aircraft: Aircraft) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onCompleteInspection(aircraft.id, 'HAA Certified A&P Mechanic');
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Clock className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                100-Hour Inspection Airworthiness Radar
              </h2>
            </div>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              FAA 14 CFR § 91.409(b) compliance monitor. Planes reaching 0.0 remaining hours are legally grounded until the 100-hour inspection is completed and signed off.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-3 rounded-2xl border border-slate-800">
            <div>
              <span className="text-xs text-slate-400">Fleet Avg Remaining</span>
              <div className="text-2xl font-black text-blue-400 font-mono">{averageHours} <span className="text-xs text-slate-400">hrs</span></div>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div>
              <span className="text-xs text-slate-400">Grounded (MX)</span>
              <div className="text-2xl font-black text-rose-400 font-mono">{grounded.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Urgency Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-rose-950/30 border border-rose-800/50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Grounded / MX Due</span>
            </span>
            <span className="text-xl font-black text-rose-400 font-mono">{grounded.length}</span>
          </div>
          <p className="text-[11px] text-rose-300/70 mt-1">0.0h or AOG status</p>
        </div>

        <div className="bg-orange-950/30 border border-orange-800/50 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <span>Low Hours (&lt; 5h)</span>
            </span>
            <span className="text-xl font-black text-orange-400 font-mono">{lowHours.length}</span>
          </div>
          <p className="text-[11px] text-orange-300/70 mt-1">Local dual/solo only</p>
        </div>

        <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Caution (5 - 15h)</span>
            </span>
            <span className="text-xl font-black text-amber-400 font-mono">{caution.length}</span>
          </div>
          <p className="text-[11px] text-amber-300/70 mt-1">Schedule shop slot</p>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Airworthy (&gt; 15h)</span>
            </span>
            <span className="text-xl font-black text-emerald-400 font-mono">{healthy.length}</span>
          </div>
          <p className="text-[11px] text-emerald-300/70 mt-1">Open for cross-country</p>
        </div>
      </div>

      {/* Ranked Aircraft List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Aircraft Inspection Countdown (Prioritized by Least Hours)
          </h3>
          <span className="text-xs text-slate-400">Total {sortedFleet.length} planes</span>
        </div>

        <div className="space-y-3">
          {sortedFleet.map((aircraft) => {
            const urgency = getHoursUrgency(aircraft.hoursRemaining);
            const model = AIRCRAFT_TYPE_LABELS[aircraft.type];
            const isGrounded = aircraft.hoursRemaining <= 0 || aircraft.status === 'Down';

            return (
              <div
                key={aircraft.id}
                className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                  isGrounded
                    ? 'bg-rose-950/25 border-rose-800/50'
                    : aircraft.hoursRemaining < 5.0
                    ? 'bg-orange-950/20 border-orange-800/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left: Tail number, Type, Location */}
                <div className="flex items-center gap-4 min-w-[220px]">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-black text-lg text-white">
                    {aircraft.tailNumber.startsWith('N') ? aircraft.tailNumber.slice(1) : aircraft.tailNumber}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-white">
                        {aircraft.tailNumber.startsWith('N') ? aircraft.tailNumber : `N${aircraft.tailNumber}`}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {model.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>Ramp: <strong className="text-slate-200">{aircraft.location}</strong></span>
                      <span>•</span>
                      <span>Status: <strong className={aircraft.status === 'Down' ? 'text-rose-400' : 'text-emerald-400'}>{aircraft.status}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Center: Hours Gauge & Progress */}
                <div className="flex-1 max-w-md">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Remaining to 100hr:</span>
                    </span>
                    <span className={`font-mono font-black text-sm ${urgency.color}`}>
                      {aircraft.hoursRemaining.toFixed(1)} hrs
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-800/90 overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${urgency.barColor}`}
                      style={{ width: `${Math.min(100, Math.max(0, aircraft.hoursRemaining))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>Ground (0h)</span>
                    <span className={`font-bold ${urgency.color}`}>{urgency.tag}</span>
                    <span>100.0h (Fresh MX)</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => onOpenManualInspectionModal?.(aircraft)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-medium transition-colors border border-amber-500/20"
                    title="Manual 100-Hr inspection status & hours entry"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Set Hours</span>
                  </button>

                  <button
                    onClick={() => onOpenFlightLogModal(aircraft)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-colors"
                  >
                    <span>Log Flight</span>
                  </button>

                  {isGrounded ? (
                    <button
                      onClick={() => handleSignOff(aircraft)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all active:scale-95"
                      title="Reset remaining hours to 100.0 and clear grounding"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Sign Off 100-Hr</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenEditModal(aircraft)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                      title="Edit aircraft"
                    >
                      <Wrench className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
