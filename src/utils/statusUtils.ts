import { AircraftStatus } from '../types';

export function getStatusBadge(status: AircraftStatus) {
  switch (status) {
    case 'Up':
      return {
        label: 'Up',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        dotClass: 'bg-emerald-400',
        glowClass: 'shadow-[0_0_12px_rgba(52,211,153,0.25)]',
        description: 'Flight Ready / Airworthy',
      };
    case 'Up-Low Hours':
      return {
        label: 'Up-Low Hours',
        badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
        dotClass: 'bg-amber-400 animate-pulse',
        glowClass: 'shadow-[0_0_14px_rgba(251,191,36,0.3)]',
        description: 'Low hours before 100hr MX',
      };
    case 'Up-Enroute':
      return {
        label: 'Up-Enroute',
        badgeClass: 'bg-sky-500/20 text-sky-300 border border-sky-500/40',
        dotClass: 'bg-sky-400 animate-ping',
        glowClass: 'shadow-[0_0_12px_rgba(56,189,248,0.25)]',
        description: 'In Flight / En Route',
      };
    case 'Down':
      return {
        label: 'Down',
        badgeClass: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
        dotClass: 'bg-rose-500',
        glowClass: 'shadow-[0_0_12px_rgba(244,63,94,0.25)]',
        description: 'AOG / Maintenance Grounded',
      };
  }
}

export function getHoursUrgency(hoursRemaining: number) {
  if (hoursRemaining <= 0) {
    return {
      category: 'grounded',
      label: 'INSPECTION DUE',
      color: 'text-rose-400',
      barColor: 'bg-rose-500',
      bgColor: 'bg-rose-950/40 border-rose-800/50',
      alertLevel: 4,
      tag: '0.0 hrs - Grounded',
    };
  }
  if (hoursRemaining < 5.0) {
    return {
      category: 'critical',
      label: 'LOW HOURS',
      color: 'text-orange-400',
      barColor: 'bg-orange-500',
      bgColor: 'bg-orange-950/30 border-orange-800/40',
      alertLevel: 3,
      tag: '< 5 hrs remaining',
    };
  }
  if (hoursRemaining <= 15.0) {
    return {
      category: 'warning',
      label: 'APPROACHING',
      color: 'text-amber-400',
      barColor: 'bg-amber-400',
      bgColor: 'bg-amber-950/20 border-amber-800/30',
      alertLevel: 2,
      tag: '< 15 hrs remaining',
    };
  }
  return {
    category: 'healthy',
    label: 'AIRWORTHY',
    color: 'text-emerald-400',
    barColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-950/20 border-emerald-800/20',
    alertLevel: 1,
    tag: 'Good for flight',
  };
}
