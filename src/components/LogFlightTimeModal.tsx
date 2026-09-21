import React, { useState } from 'react';
import { Aircraft, AIRCRAFT_TYPE_LABELS } from '../types';
import { X, Clock, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface LogFlightTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  aircraft: Aircraft | null;
  onLogHours: (id: string, hours: number, pilotName?: string) => void;
}

export const LogFlightTimeModal: React.FC<LogFlightTimeModalProps> = ({
  isOpen,
  onClose,
  aircraft,
  onLogHours,
}) => {
  const [flightHours, setFlightHours] = useState<number>(1.3);
  const [pilotName, setPilotName] = useState<string>('');

  if (!isOpen || !aircraft) return null;

  const currentRemaining = aircraft.hoursRemaining;
  const newRemaining = Math.max(0, Math.round((currentRemaining - flightHours) * 10) / 10);
  const model = AIRCRAFT_TYPE_LABELS[aircraft.type];

  const willGround = newRemaining <= 0;
  const willBeLowHours = newRemaining < 5.0 && newRemaining > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (flightHours <= 0) return;
    onLogHours(aircraft.id, flightHours, pilotName.trim() || undefined);
    onClose();
  };

  const quickIncrements = [0.8, 1.0, 1.2, 1.5, 2.0, 2.5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Log Flight Time (100-Hr Deduction)
              </h3>
              <p className="text-xs text-slate-400">
                Tail: <strong className="text-white font-mono">N{aircraft.tailNumber}</strong> ({model.name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick Increment Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Common Flight Durations (Hobbs / Tach)
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {quickIncrements.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setFlightHours(h)}
                  className={`py-1.5 text-xs font-mono font-bold rounded-lg border transition-all ${
                    flightHours === h
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-1 ring-amber-500/30'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {h.toFixed(1)}h
                </button>
              ))}
            </div>
          </div>

          {/* Custom Duration Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Flight Hours to Deduct *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="20"
              required
              value={flightHours}
              onChange={(e) => setFlightHours(Math.max(0, Number(e.target.value)))}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-lg font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Live Calculation Preview */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              100-Hour Inspection Status Preview
            </span>
            <div className="flex items-center justify-between text-sm pt-1">
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block">Current Remaining</span>
                <span className="font-mono font-bold text-slate-300 text-base">
                  {currentRemaining.toFixed(1)}h
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block">Deduction</span>
                <span className="font-mono font-bold text-rose-400 text-base">
                  -{flightHours.toFixed(1)}h
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="text-center">
                <span className="text-[10px] text-slate-500 block">New Remaining</span>
                <span
                  className={`font-mono font-extrabold text-base ${
                    willGround
                      ? 'text-rose-400'
                      : willBeLowHours
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {newRemaining.toFixed(1)}h
                </span>
              </div>
            </div>

            {/* Threshold Alerts */}
            {willGround && (
              <div className="mt-2 p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center gap-2 text-xs text-rose-300 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  100-Hour Inspection Limit Reached! Aircraft will be automatically marked as <strong>Down (Grounded)</strong>.
                </span>
              </div>
            )}

            {willBeLowHours && (
              <div className="mt-2 p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-center gap-2 text-xs text-amber-300 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Remaining hours drop below 5.0h. Status will auto-switch to <strong>Up-Low Hours</strong>.
                </span>
              </div>
            )}

            {!willGround && !willBeLowHours && (
              <div className="mt-2 p-2 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Aircraft remains fully airworthy (&gt; 5h).</span>
              </div>
            )}
          </div>

          {/* Pilot / Instructor Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Pilot / Instructor Name (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Capt. Smith, Student Flight"
              value={pilotName}
              onChange={(e) => setPilotName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/30 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              <span>Confirm & Log Hours</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
