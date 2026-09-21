import React from 'react';
import { Aircraft, AirportLocation, AircraftStatus } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface PlainFleetBoardProps {
  fleet: Aircraft[];
  isEditMode: boolean;
  onMoveLocation: (id: string, location: AirportLocation) => void;
  onUpdateStatus: (id: string, status: AircraftStatus) => void;
  onAddPlaneToLocation: (location: AirportLocation) => void;
  onDeleteAircraft: (id: string) => void;
}

const LOCATIONS: AirportLocation[] = ['Madras', 'Sky Service', 'HAA Campus'];

export const PlainFleetBoard: React.FC<PlainFleetBoardProps> = ({
  fleet,
  isEditMode,
  onMoveLocation,
  onUpdateStatus,
  onAddPlaneToLocation,
  onDeleteAircraft,
}) => {
  // Sort aircraft inside each location logically (Type ascending, then Tail number)
  const getPlanesForLocation = (loc: AirportLocation) => {
    return fleet
      .filter((p) => p.location === loc)
      .sort((a, b) => {
        // Group by type first: 152, 172, PA44, others
        const typeOrder: Record<string, number> = { '152': 1, '172': 2, 'PA34': 3, 'PA44': 4, 'R22': 5, 'R44': 6 };
        const orderA = typeOrder[a.type] || 99;
        const orderB = typeOrder[b.type] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.tailNumber.localeCompare(b.tailNumber);
      });
  };

  const getStatusStyle = (status: AircraftStatus) => {
    switch (status) {
      case 'Up':
        return 'text-emerald-700 font-semibold';
      case 'Up-Low Hours':
        return 'text-amber-700 font-bold';
      case 'Up-Enroute':
        return 'text-blue-700 font-semibold';
      case 'Down':
        return 'text-rose-700 font-bold';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden my-3">
      {/* 3-Column Responsive Grid matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {LOCATIONS.map((location) => {
          const planes = getPlanesForLocation(location);

          return (
            <div key={location} className="flex flex-col">
              {/* Location Title Header */}
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base text-slate-900 tracking-tight">
                    {location}
                  </h2>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ({location === 'Madras' ? 'S33' : location === 'Sky Service' ? 'RDM FBO' : 'Main Base'})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center min-w-[32px] h-7 px-2.5 rounded-md bg-slate-900 text-white font-mono font-bold text-sm shadow-xs">
                    {planes.length}
                  </span>
                </div>
              </div>

              {/* Table Sub-header */}
              <div className="flex items-center gap-2 bg-slate-100/80 border-b border-slate-200 text-xs font-bold text-slate-600 px-3.5 py-2 uppercase tracking-wider">
                <div className="w-12 shrink-0">Type</div>
                <div className="w-20 shrink-0">Tail</div>
                <div className="flex-1 min-w-0">Status</div>
                {isEditMode && (
                  <>
                    <div className="w-24 shrink-0 text-center">Move</div>
                    <div className="w-7 shrink-0"></div>
                  </>
                )}
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-200/70 flex-1 flex flex-col overflow-hidden">
                {planes.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs my-auto">
                    No aircraft
                  </div>
                ) : (
                  planes.map((plane, idx) => {
                    // Group repeating type like the screenshot
                    const prevPlane = idx > 0 ? planes[idx - 1] : null;
                    const showType = !prevPlane || prevPlane.type !== plane.type;

                    const cleanTail = plane.tailNumber.startsWith('N')
                      ? plane.tailNumber.slice(1)
                      : plane.tailNumber;

                    return (
                      <div
                        key={plane.id}
                        className={`flex items-center gap-2 px-3.5 py-2.5 text-xs transition-colors hover:bg-slate-100/60 ${
                          plane.status === 'Down'
                            ? 'bg-rose-50/50'
                            : plane.status === 'Up-Low Hours'
                            ? 'bg-amber-50/40'
                            : ''
                        }`}
                      >
                        {/* Type */}
                        <div className="w-12 shrink-0 font-bold text-slate-800 text-[13px]">
                          {showType ? (
                            <span>{plane.type}</span>
                          ) : (
                            <span className="text-slate-300 font-normal">"</span>
                          )}
                        </div>

                        {/* Tail Number */}
                        <div className="w-20 shrink-0 font-mono font-bold text-slate-950 text-sm tracking-tight">
                          {cleanTail}
                        </div>

                        {/* Status */}
                        <div className="flex-1 min-w-0">
                          {isEditMode ? (
                            <select
                              value={plane.status}
                              onChange={(e) => onUpdateStatus(plane.id, e.target.value as AircraftStatus)}
                              className={`w-full text-xs font-semibold bg-white border border-slate-300 rounded-md px-2 py-1 h-8 focus:outline-none focus:border-slate-500 shadow-2xs ${getStatusStyle(
                                plane.status
                              )}`}
                            >
                              <option value="Up" className="text-emerald-700 font-semibold">Up</option>
                              <option value="Up-Low Hours" className="text-amber-700 font-semibold">Up-Low Hours</option>
                              <option value="Up-Enroute" className="text-blue-700 font-semibold">Up-Enroute</option>
                              <option value="Down" className="text-rose-700 font-semibold">Down</option>
                            </select>
                          ) : (
                            <span className={`text-left text-sm font-semibold block truncate ${getStatusStyle(plane.status)}`}>
                              {plane.status}
                            </span>
                          )}
                        </div>

                        {/* Edit Mode Controls: Move and Delete on the SAME row */}
                        {isEditMode && (
                          <>
                            {/* Move Location Select */}
                            <div className="w-24 shrink-0">
                              <select
                                value={plane.location}
                                onChange={(e) =>
                                  onMoveLocation(plane.id, e.target.value as AirportLocation)
                                }
                                title="Move location"
                                className="w-full text-xs bg-white border border-slate-300 rounded-md px-1.5 py-1 h-8 text-slate-700 focus:outline-none focus:border-slate-500 font-medium shadow-2xs"
                              >
                                <option value="Madras">Madras</option>
                                <option value="Sky Service">Sky Svc</option>
                                <option value="HAA Campus">Campus</option>
                              </select>
                            </div>

                            {/* Delete Aircraft */}
                            <div className="w-7 shrink-0 flex justify-end">
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete N${plane.tailNumber}?`)) {
                                    onDeleteAircraft(plane.id);
                                  }
                                }}
                                title="Delete aircraft"
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add button at column bottom in Edit Mode */}
              {isEditMode && (
                <div className="p-2.5 border-t border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => onAddPlaneToLocation(location)}
                    className="w-full py-1.5 px-3 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center justify-center gap-1 transition-colors bg-white hover:bg-slate-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add aircraft to {location}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
