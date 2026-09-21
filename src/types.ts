export type AirportLocation = 'Madras' | 'Sky Service' | 'HAA Campus';

export type AircraftType = '152' | '172' | 'PA34' | 'PA44' | 'R22' | 'R44';

export type AircraftStatus = 'Up' | 'Up-Low Hours' | 'Up-Enroute' | 'Down';

export interface Aircraft {
  id: string;
  tailNumber: string;
  type: AircraftType;
  location: AirportLocation;
  status: AircraftStatus;
  hoursRemaining: number; // Hours remaining until 100-hour inspection (e.g. 4.2)
  totalHobbs?: number; // Current Hobbs meter
  nextInspectionHobbs?: number;
  enrouteTo?: AirportLocation | string;
  eta?: string;
  notes?: string;
  squawks?: string[];
  updatedAt: string;
  updatedBy?: string;
}

export interface FleetStats {
  total: number;
  up: number;
  lowHours: number;
  enroute: number;
  down: number;
  byLocation: Record<AirportLocation, {
    total: number;
    up: number;
    lowHours: number;
    enroute: number;
    down: number;
  }>;
}

export type WSMessage =
  | { type: 'INIT_FLEET'; payload: Aircraft[] }
  | { type: 'AIRCRAFT_UPDATED'; payload: Aircraft }
  | { type: 'AIRCRAFT_ADDED'; payload: Aircraft }
  | { type: 'AIRCRAFT_DELETED'; payload: { id: string } }
  | { type: 'FLEET_RESET'; payload: Aircraft[] };

export const AIRCRAFT_TYPE_LABELS: Record<AircraftType, { model: string; name: string; engine: string }> = {
  '152': { model: 'Cessna 152', name: 'C152', engine: 'Single-Engine (Lycoming O-235)' },
  '172': { model: 'Cessna 172 Skyhawk', name: 'C172', engine: 'Single-Engine (Lycoming IO-360)' },
  'PA34': { model: 'Piper PA-34 Seneca', name: 'PA-34', engine: 'Twin-Engine (Continental TSIO-360)' },
  'PA44': { model: 'Piper PA-44 Seminole', name: 'PA-44', engine: 'Multi-Engine (Twin Lycoming O-360)' },
  'R22': { model: 'Robinson R22 Beta II', name: 'R22', engine: 'Rotorcraft (Lycoming O-360)' },
  'R44': { model: 'Robinson R44 Raven II', name: 'R44', engine: 'Rotorcraft (Lycoming IO-540)' },
};

export const LOCATION_DETAILS: Record<AirportLocation, {
  name: string;
  code: string;
  tagline: string;
  description: string;
  color: string;
  borderColor: string;
}> = {
  'Madras': {
    name: 'Madras Municipal Airport',
    code: 'S33',
    tagline: 'Satellite Flight Training Base',
    description: 'Practice maneuvers, touch & goes, secondary ramp',
    color: 'from-blue-600/20 to-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
  'Sky Service': {
    name: 'Sky Service FBO (Redmond)',
    code: 'RDM FBO',
    tagline: 'Redmond Airport North Ramp',
    description: 'Primary flight line & aircraft staging',
    color: 'from-indigo-600/20 to-blue-500/10',
    borderColor: 'border-indigo-500/30',
  },
  'HAA Campus': {
    name: 'HAA Campus & Maintenance Hangar',
    code: 'HAA RDM',
    tagline: 'Main Campus & MX Facilities',
    description: 'School headquarters, dispatch & maintenance shop',
    color: 'from-amber-600/20 to-orange-500/10',
    borderColor: 'border-amber-500/30',
  },
};
