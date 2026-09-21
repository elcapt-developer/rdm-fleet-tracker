import React, { useState } from 'react';
import { Aircraft, AirportLocation, AircraftStatus, AIRCRAFT_TYPE_LABELS } from '../types';
import { getStatusBadge, getHoursUrgency } from '../utils/statusUtils';
import { ArrowUpDown, Clock, Edit2 } from 'lucide-react';

interface FleetTableViewProps {
  fleet: Aircraft[];
  isEditMode: boolean;
  onMoveLocation: (id: string, location: AirportLocation) => void;
  onUpdateStatus: (id: string, status: AircraftStatus) => void;
  onOpenEditModal: (aircraft: Aircraft) => void;
  onOpenFlightLogModal: (aircraft: Aircraft) => void;
  onOpenManualInspectionModal?: (aircraft: Aircraft) => void;
}

type SortField = 'tailNumber' | 'type' | 'location' | 'status' | 'hoursRemaining' | 'totalHobbs';

export const FleetTableView: React.FC<FleetTableViewProps> = ({
  fleet,
  isEditMode,
  onMoveLocation,
  onUpdateStatus,
  onOpenEditModal,
  onOpenFlightLogModal,
  onOpenManualInspectionModal,
}) => {
  const [sortField, setSortField] = useState<SortField>('location');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedFleet = [...fleet].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'tailNumber') {
      cmp = a.tailNumber.localeCompare(b.tailNumber);
    } else if (sortField === 'type') {
      cmp = a.type.localeCompare(b.type);
    } else if (sortField === 'location') {
      cmp = a.location.localeCompare(b.location);
    } else if (sortField === 'status') {
      cmp = a.status.localeCompare(b.status);
    } else if (sortField === 'hoursRemaining') {
      cmp = a.hoursRemaining - b.hoursRemaining;
    } else if (sortField === 'totalHobbs') {
      cmp = (a.totalHobbs || 0) - (b.totalHobbs || 0);
    }
    return sortAsc ? cmp : -cmp;
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
            <tr>
              <th
                onClick={() => handleSort('tailNumber')}
                className="py-4 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Tail Number</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('type')}
                className="py-4 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Model</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('location')}
                className="py-4 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Location / Ramp</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('status')}
                className="py-4 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Airworthiness Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('hoursRemaining')}
                className="py-4 px-4 cursor-pointer hover:text-white transition-colors min-w-[200px]"
              >
                <div className="flex items-center gap-1">
                  <span>100-Hr Remaining</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('totalHobbs')}
                className="py-4 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Hobbs</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-4 px-4">Notes / Squawks</th>
              <th className="py-4 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
            {sortedFleet.map((plane) => {
              const status = getStatusBadge(plane.status);
              const urgency = getHoursUrgency(plane.hoursRemaining);
              const model = AIRCRAFT_TYPE_LABELS[plane.type];

              return (
                <tr
                  key={plane.id}
                  className="hover:bg-slate-800/40 transition-colors font-sans"
                >
                  {/* Tail Number */}
                  <td className="py-3 px-4 font-mono font-black text-sm text-white">
                    {plane.tailNumber.startsWith('N') ? plane.tailNumber : `N${plane.tailNumber}`}
                  </td>

                  {/* Model */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-200">{model.name}</span>
                    <span className="block text-[10px] text-slate-500 font-normal">{model.model}</span>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-4">
                    {isEditMode ? (
                      <select
                        value={plane.location}
                        onChange={(e) => onMoveLocation(plane.id, e.target.value as AirportLocation)}
                        className="py-1 px-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 font-sans"
                      >
                        <option value="Madras">Madras (S33)</option>
                        <option value="Sky Service">Sky Service</option>
                        <option value="HAA Campus">HAA Campus</option>
                      </select>
                    ) : (
                      <span className="font-medium text-slate-300 font-sans">{plane.location}</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {isEditMode ? (
                      <select
                        value={plane.status}
                        onChange={(e) => onUpdateStatus(plane.id, e.target.value as AircraftStatus)}
                        className={`py-1 px-2 rounded-lg bg-slate-950 border text-xs font-semibold font-sans ${
                          plane.status === 'Down'
                            ? 'border-rose-700 text-rose-300'
                            : plane.status === 'Up-Low Hours'
                            ? 'border-amber-700 text-amber-300'
                            : 'border-emerald-700 text-emerald-300'
                        }`}
                      >
                        <option value="Up">Up (Ready)</option>
                        <option value="Up-Low Hours">Up-Low Hours</option>
                        <option value="Up-Enroute">Up-Enroute</option>
                        <option value="Down">Down (MX)</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                        <span>{status.label}</span>
                      </span>
                    )}
                  </td>

                  {/* 100-Hr Progress */}
                  <td className="py-3 px-4 font-mono">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className={`font-bold ${urgency.color}`}>
                        {plane.hoursRemaining.toFixed(1)} hrs left
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans">{urgency.label}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${urgency.barColor}`}
                        style={{ width: `${Math.min(100, Math.max(0, plane.hoursRemaining))}%` }}
                      />
                    </div>
                  </td>

                  {/* Hobbs */}
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {plane.totalHobbs ? plane.totalHobbs.toFixed(1) : '-'}
                  </td>

                  {/* Notes / Squawks */}
                  <td className="py-3 px-4 max-w-[200px] truncate text-xs text-slate-400 font-sans">
                    {plane.squawks && plane.squawks.length > 0 ? (
                      <span className="text-rose-300 font-medium">⚠️ {plane.squawks.join('; ')}</span>
                    ) : (
                      plane.notes || '-'
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenManualInspectionModal?.(plane)}
                        title="Manual 100-Hr inspection status & hours entry"
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-sans text-xs flex items-center gap-1 border border-amber-500/20 transition-colors"
                      >
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Set Hours</span>
                      </button>
                      <button
                        onClick={() => onOpenEditModal(plane)}
                        title="Edit details"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
