import React, { useState, useEffect } from 'react';
import { Aircraft, AirportLocation, AircraftStatus, AircraftType } from '../types';
import { detectAircraftTypeFromHaaList } from '../data/haaFleetRegistry';
import { X, Plus } from 'lucide-react';

interface AircraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (aircraft: { tailNumber: string; type: AircraftType; location: AirportLocation; status: AircraftStatus }) => void;
  defaultLocation?: AirportLocation;
}

export const AircraftModal: React.FC<AircraftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultLocation = 'Sky Service',
}) => {
  const [tailNumber, setTailNumber] = useState('');
  const [location, setLocation] = useState<AirportLocation>(defaultLocation);
  const [status, setStatus] = useState<AircraftStatus>('Up');

  useEffect(() => {
    setTailNumber('');
    setLocation(defaultLocation);
    setStatus('Up');
  }, [defaultLocation, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tailNumber.trim().toUpperCase().replace(/^N/, '');
    if (!clean) return;

    // Automatically detect type from haa_fleet_list.txt registry
    const detectedType: AircraftType = detectAircraftTypeFromHaaList(clean) || '172';

    onSave({
      tailNumber: clean,
      type: detectedType,
      location,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Add Aircraft
            </h3>
            <p className="text-[11px] text-slate-500">
              Enter tail number; model type is determined automatically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tail Number Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tail Number *
            </label>
            <input
              type="text"
              autoFocus
              required
              placeholder="e.g. 18AC, 49191, 125MG"
              value={tailNumber}
              onChange={(e) => setTailNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-sm focus:outline-none focus:bg-white focus:border-slate-800 transition-all"
            />
            {tailNumber.trim() && (
              <div className="mt-1.5 text-[11px]">
                {detectAircraftTypeFromHaaList(tailNumber.trim()) ? (
                  <span className="text-emerald-700 font-medium">
                    ✓ Recognized Model: <strong>{detectAircraftTypeFromHaaList(tailNumber.trim())}</strong>
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Auto-assigns to <strong>172</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Location & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value as AirportLocation)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-slate-800"
              >
                <option value="Madras">Madras</option>
                <option value="Sky Service">Sky Service</option>
                <option value="HAA Campus">HAA Campus</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AircraftStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-slate-800"
              >
                <option value="Up">Up</option>
                <option value="Up-Low Hours">Up-Low Hours</option>
                <option value="Up-Enroute">Up-Enroute</option>
                <option value="Down">Down</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Aircraft</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
