import React from 'react';
import { Aircraft, AirportLocation, AircraftStatus, AIRCRAFT_TYPE_LABELS } from '../types';
import { getStatusBadge, getHoursUrgency } from '../utils/statusUtils';
import { Plane, Clock, Wrench, MoreHorizontal, MapPin, Send, AlertTriangle } from 'lucide-react';

interface AircraftCardProps {
  aircraft: Aircraft;
  isEditMode: boolean;
  onMoveLocation: (id: string, location: AirportLocation) => void;
  onUpdateStatus: (id: string, status: AircraftStatus) => void;
  onOpenEditModal: (aircraft: Aircraft) => void;
  onOpenFlightLogModal: (aircraft: Aircraft) => void;
  onOpenManualInspectionModal?: (aircraft: Aircraft) => void;
  onQuickComplete100hr?: (aircraft: Aircraft) => void;
}

const ALL_LOCATIONS: AirportLocation[] = ['Madras', 'Sky Service', 'HAA Campus'];

export const AircraftCard: React.FC<AircraftCardProps> = ({
  aircraft,
  isEditMode,
  onMoveLocation,
  onUpdateStatus,
  onOpenEditModal,
  onOpenFlightLogModal,
  onOpenManualInspectionModal,
  onQuickComplete100hr,
}) => {
  const statusInfo = getStatusBadge(aircraft.status);
  const urgency = getHoursUrgency(aircraft.hoursRemaining);
  const modelInfo = AIRCRAFT_TYPE_LABELS[aircraft.type] || { model: aircraft.type, name: aircraft.type };

  // Drag start handler for Kanban
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', aircraft.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable={isEditMode}
      onDragStart={handleDragStart}
      className={`group relative bg-slate-900/90 border rounded-2xl p-4 transition-all duration-200 shadow-md hover:shadow-xl hover:border-slate-600 ${
        aircraft.status === 'Down'
          ? 'border-rose-900/40 bg-gradient-to-b from-rose-950/10 to-slate-900/90'
          : aircraft.status === 'Up-Low Hours'
          ? 'border-amber-900/50 bg-gradient-to-b from-amber-950/10 to-slate-900/90'
          : 'border-slate-800/90 hover:border-blue-500/40'
      } ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Top Header: Tail Number & Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl font-black text-white tracking-wider group-hover:text-blue-400 transition-colors">
              {aircraft.tailNumber.startsWith('N') ? aircraft.tailNumber : `N${aircraft.tailNumber}`}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              {modelInfo.name}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
            {modelInfo.model}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-1">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.badgeClass} ${statusInfo.glowClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
            <span>{statusInfo.label}</span>
          </div>

          {aircraft.status === 'Up-Enroute' && aircraft.enrouteTo && (
            <div className="flex items-center gap-1 text-[10px] text-sky-400 font-medium animate-pulse">
              <Send className="w-2.5 h-2.5" />
              <span>to {aircraft.enrouteTo}</span>
              {aircraft.eta && <span>({aircraft.eta})</span>}
            </div>
          )}
        </div>
      </div>

      {/* 100-Hour Inspection Airworthiness Progress Bar (Interactive) */}
      <div
        onClick={() => isEditMode && onOpenManualInspectionModal?.(aircraft)}
        className={`mt-3 p-2.5 rounded-xl border transition-all ${urgency.bgColor} ${
          isEditMode ? 'cursor-pointer hover:border-amber-500/70 hover:shadow-md' : ''
        }`}
        title={isEditMode ? 'Click to change status and inspection hours' : undefined}
      >
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>100-Hr Inspection</span>
            {isEditMode && (
              <span className="text-[9px] text-amber-400 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/40">
                Manual Edit
              </span>
            )}
          </span>
          <span className={`font-mono font-black text-xs ${urgency.color}`}>
            {aircraft.hoursRemaining.toFixed(1)} hrs left
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 rounded-full ${urgency.barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, aircraft.hoursRemaining))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
          <span>0h (MX)</span>
          <span className={`font-bold ${urgency.color}`}>{urgency.label}</span>
          <span>100h</span>
        </div>
      </div>

      {/* Squawks & Notes */}
      {aircraft.squawks && aircraft.squawks.length > 0 && (
        <div className="mt-2.5 bg-rose-950/30 border border-rose-900/40 rounded-lg p-2 text-xs text-rose-300">
          <div className="flex items-center gap-1 font-semibold text-[11px] text-rose-400 mb-0.5">
            <AlertTriangle className="w-3 h-3" />
            <span>Maintenance Squawk:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-200">
            {aircraft.squawks.map((sq, idx) => (
              <li key={idx} className="truncate">
                {sq}
              </li>
            ))}
          </ul>
        </div>
      )}

      {aircraft.notes && (!aircraft.squawks || aircraft.squawks.length === 0) && (
        <p className="mt-2 text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50 line-clamp-2">
          {aircraft.notes}
        </p>
      )}

      {/* Hobbs reading */}
      {aircraft.totalHobbs && (
        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-500 font-mono">
          <span>Hobbs Meter:</span>
          <span className="text-slate-300 font-semibold">{aircraft.totalHobbs.toFixed(1)}</span>
        </div>
      )}

      {/* Action Footer (Visible in Edit Mode) */}
      {isEditMode ? (
        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
          {/* Quick Location Mover */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mr-1 flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" /> Move:
            </span>
            <div className="flex-1 grid grid-cols-3 gap-1 text-[10px]">
              {ALL_LOCATIONS.map((loc) => (
                <button
                  key={loc}
                  onClick={() => onMoveLocation(aircraft.id, loc)}
                  disabled={aircraft.location === loc}
                  className={`py-1 px-1 rounded text-center truncate transition-colors font-medium ${
                    aircraft.location === loc
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                      : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={`Move to ${loc}`}
                >
                  {loc === 'Sky Service' ? 'Sky Svc' : loc === 'HAA Campus' ? 'Campus' : 'Madras'}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center justify-between gap-1.5 pt-1">
            <button
              onClick={() => onOpenManualInspectionModal?.(aircraft)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-medium transition-colors border border-amber-500/20"
              title="Manual 100-Hr inspection status & hours entry"
            >
              <Clock className="w-3 h-3 text-amber-400" />
              <span>Set Hours</span>
            </button>

            {aircraft.hoursRemaining <= 0 || aircraft.status === 'Down' ? (
              <button
                onClick={() => onQuickComplete100hr?.(aircraft)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold transition-colors"
                title="Complete 100-hr inspection and reset to 100.0 hrs"
              >
                <Wrench className="w-3 h-3 text-emerald-400" />
                <span>Sign Off MX</span>
              </button>
            ) : null}

            {/* Quick Status Dropdown */}
            <select
              value={aircraft.status}
              onChange={(e) => onUpdateStatus(aircraft.id, e.target.value as AircraftStatus)}
              className="py-1 px-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="Up">Up</option>
              <option value="Up-Low Hours">Low Hours</option>
              <option value="Up-Enroute">Enroute</option>
              <option value="Down">Down</option>
            </select>

            <button
              onClick={() => onOpenEditModal(aircraft)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Edit full aircraft details"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* View Mode Quick Info */
        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{aircraft.location}</span>
          </span>
          <button
            onClick={() => onOpenEditModal(aircraft)}
            className="text-blue-400 hover:underline flex items-center gap-0.5"
          >
            <span>View Details</span>
          </button>
        </div>
      )}
    </div>
  );
};
