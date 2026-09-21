import React, { useState } from 'react';
import { Aircraft, AirportLocation, AircraftStatus, LOCATION_DETAILS } from '../types';
import { AircraftCard } from './AircraftCard';
import { MapPin, Plane, CheckCircle2, AlertTriangle, Wrench, Navigation } from 'lucide-react';

interface LocationBoardProps {
  fleet: Aircraft[];
  isEditMode: boolean;
  onMoveLocation: (id: string, location: AirportLocation) => void;
  onUpdateStatus: (id: string, status: AircraftStatus) => void;
  onOpenEditModal: (aircraft: Aircraft) => void;
  onOpenFlightLogModal: (aircraft: Aircraft) => void;
  onOpenManualInspectionModal?: (aircraft: Aircraft) => void;
  onQuickComplete100hr?: (aircraft: Aircraft) => void;
  onAddPlaneToLocation?: (location: AirportLocation) => void;
}

const COLUMNS: AirportLocation[] = ['Madras', 'Sky Service', 'HAA Campus'];

export const LocationBoard: React.FC<LocationBoardProps> = ({
  fleet,
  isEditMode,
  onMoveLocation,
  onUpdateStatus,
  onOpenEditModal,
  onOpenFlightLogModal,
  onOpenManualInspectionModal,
  onQuickComplete100hr,
  onAddPlaneToLocation,
}) => {
  const [dragOverCol, setDragOverCol] = useState<AirportLocation | null>(null);

  const handleDragOver = (e: React.DragEvent, col: AirportLocation) => {
    e.preventDefault();
    if (dragOverCol !== col) {
      setDragOverCol(col);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (e: React.DragEvent, col: AirportLocation) => {
    e.preventDefault();
    setDragOverCol(null);
    const planeId = e.dataTransfer.getData('text/plain');
    if (planeId) {
      onMoveLocation(planeId, col);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {COLUMNS.map((location) => {
        const details = LOCATION_DETAILS[location];
        const planesInLocation = fleet.filter((p) => p.location === location);

        // Stats for this specific location
        const upCount = planesInLocation.filter((p) => p.status === 'Up').length;
        const lowHoursCount = planesInLocation.filter((p) => p.status === 'Up-Low Hours').length;
        const enrouteCount = planesInLocation.filter((p) => p.status === 'Up-Enroute').length;
        const downCount = planesInLocation.filter((p) => p.status === 'Down').length;

        // Group planes by type for neat organization
        const planes152 = planesInLocation.filter((p) => p.type === '152');
        const planes172 = planesInLocation.filter((p) => p.type === '172');
        const planesPA44 = planesInLocation.filter((p) => p.type === 'PA44');
        const planesOther = planesInLocation.filter((p) => p.type !== '152' && p.type !== '172' && p.type !== 'PA44');

        const isDropActive = dragOverCol === location;

        return (
          <div
            key={location}
            onDragOver={(e) => handleDragOver(e, location)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, location)}
            className={`flex flex-col rounded-3xl bg-slate-950/60 border backdrop-blur-md transition-all duration-200 ${
              isDropActive
                ? 'border-blue-400 bg-blue-950/20 ring-2 ring-blue-500/40 shadow-2xl'
                : 'border-slate-800/80 shadow-lg'
            }`}
          >
            {/* Column Header */}
            <div className={`p-4 border-b border-slate-800/80 rounded-t-3xl bg-gradient-to-br ${details.color}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <h2 className="text-lg font-black text-white tracking-tight">{location}</h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-900/80 text-blue-300 border border-slate-700">
                      {details.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{details.tagline}</p>
                </div>

                {/* Total Count Badge */}
                <div className="flex flex-col items-end">
                  <div className="flex items-baseline gap-1 bg-slate-900/90 px-3 py-1 rounded-xl border border-slate-700/80">
                    <span className="text-lg font-black text-white">{planesInLocation.length}</span>
                    <span className="text-[10px] text-slate-400 uppercase">aircraft</span>
                  </div>
                </div>
              </div>

              {/* Quick Status Pill Counters */}
              <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/50 text-[11px] font-medium flex-wrap">
                <span className="flex items-center gap-1 text-emerald-400 bg-slate-900/70 px-2 py-0.5 rounded-md border border-emerald-900/40">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{upCount} Up</span>
                </span>
                {lowHoursCount > 0 && (
                  <span className="flex items-center gap-1 text-amber-300 bg-slate-900/70 px-2 py-0.5 rounded-md border border-amber-900/40">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{lowHoursCount} Low Hr</span>
                  </span>
                )}
                {enrouteCount > 0 && (
                  <span className="flex items-center gap-1 text-sky-300 bg-slate-900/70 px-2 py-0.5 rounded-md border border-sky-900/40">
                    <Navigation className="w-3 h-3" />
                    <span>{enrouteCount} Enroute</span>
                  </span>
                )}
                {downCount > 0 && (
                  <span className="flex items-center gap-1 text-rose-400 bg-slate-900/70 px-2 py-0.5 rounded-md border border-rose-900/40">
                    <Wrench className="w-3 h-3" />
                    <span>{downCount} Down</span>
                  </span>
                )}
              </div>
            </div>

            {/* Aircraft Cards Container */}
            <div className="p-4 flex-1 space-y-4 min-h-[480px]">
              {isDropActive && (
                <div className="border-2 border-dashed border-blue-400/80 bg-blue-500/10 rounded-2xl p-6 text-center text-blue-300 text-sm font-semibold flex items-center justify-center gap-2 animate-pulse">
                  <Plane className="w-5 h-5" />
                  <span>Drop aircraft here to move to {location}</span>
                </div>
              )}

              {planesInLocation.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-center p-6 border border-dashed border-slate-800 rounded-2xl">
                  <Plane className="w-8 h-8 stroke-1 text-slate-600 mb-2" />
                  <p className="text-sm font-medium">No aircraft stationed at {location}</p>
                  {isEditMode && (
                    <button
                      onClick={() => onAddPlaneToLocation?.(location)}
                      className="mt-3 text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                    >
                      + Add aircraft here
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* C152 Fleet Section */}
                  {planes152.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <span>Cessna 152</span>
                          <span className="text-[10px] text-slate-500 font-mono">({planes152.length})</span>
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {planes152.map((aircraft) => (
                          <AircraftCard
                            key={aircraft.id}
                            aircraft={aircraft}
                            isEditMode={isEditMode}
                            onMoveLocation={onMoveLocation}
                            onUpdateStatus={onUpdateStatus}
                            onOpenEditModal={onOpenEditModal}
                            onOpenFlightLogModal={onOpenFlightLogModal}
                            onOpenManualInspectionModal={onOpenManualInspectionModal}
                            onQuickComplete100hr={onQuickComplete100hr}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* C172 Fleet Section */}
                  {planes172.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <span>Cessna 172 Skyhawk</span>
                          <span className="text-[10px] text-slate-500 font-mono">({planes172.length})</span>
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {planes172.map((aircraft) => (
                          <AircraftCard
                            key={aircraft.id}
                            aircraft={aircraft}
                            isEditMode={isEditMode}
                            onMoveLocation={onMoveLocation}
                            onUpdateStatus={onUpdateStatus}
                            onOpenEditModal={onOpenEditModal}
                            onOpenFlightLogModal={onOpenFlightLogModal}
                            onOpenManualInspectionModal={onOpenManualInspectionModal}
                            onQuickComplete100hr={onQuickComplete100hr}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PA44 Fleet Section */}
                  {planesPA44.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <span>Piper PA-44 Seminole</span>
                          <span className="text-[10px] text-slate-500 font-mono">({planesPA44.length})</span>
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {planesPA44.map((aircraft) => (
                          <AircraftCard
                            key={aircraft.id}
                            aircraft={aircraft}
                            isEditMode={isEditMode}
                            onMoveLocation={onMoveLocation}
                            onUpdateStatus={onUpdateStatus}
                            onOpenEditModal={onOpenEditModal}
                            onOpenFlightLogModal={onOpenFlightLogModal}
                            onOpenManualInspectionModal={onOpenManualInspectionModal}
                            onQuickComplete100hr={onQuickComplete100hr}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Other Fleet Section (PA34, Helicopters, etc.) */}
                  {planesOther.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <span>Other HAA Fleet</span>
                          <span className="text-[10px] text-slate-500 font-mono">({planesOther.length})</span>
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {planesOther.map((aircraft) => (
                          <AircraftCard
                            key={aircraft.id}
                            aircraft={aircraft}
                            isEditMode={isEditMode}
                            onMoveLocation={onMoveLocation}
                            onUpdateStatus={onUpdateStatus}
                            onOpenEditModal={onOpenEditModal}
                            onOpenFlightLogModal={onOpenFlightLogModal}
                            onOpenManualInspectionModal={onOpenManualInspectionModal}
                            onQuickComplete100hr={onQuickComplete100hr}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
