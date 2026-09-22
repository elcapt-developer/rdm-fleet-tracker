import { useState, useEffect, useCallback, useRef } from 'react';
import { Aircraft, AirportLocation, AircraftStatus } from '../types';
import { INITIAL_FLEET } from '../data/seedFleet';

const STORAGE_KEY = 'haa_fleet_live_v1';

// Equality check: Prevents unnecessary React re-renders if no actual fields changed
function isFleetEqual(a: Aircraft[], b: Aircraft[]): boolean {
  if (a.length !== b.length) return false;
  const bMap = new Map(b.map((p) => [p.id, p]));
  for (const pa of a) {
    const pb = bMap.get(pa.id);
    if (!pb) return false;
    if (
      pa.location !== pb.location ||
      pa.status !== pb.status ||
      pa.tailNumber !== pb.tailNumber ||
      pa.type !== pb.type ||
      pa.notes !== pb.notes
    ) {
      return false;
    }
  }
  return true;
}

export function useFleetSync() {
  const [fleet, setFleet] = useState<Aircraft[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_FLEET;
  });

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'offline'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Keep a ref of hasUnsavedChanges for interval callbacks
  const hasUnsavedChangesRef = useRef<boolean>(false);
  hasUnsavedChangesRef.current = hasUnsavedChanges;

  // Synchronize server fleet into local state (Only when there are NO unsaved local changes)
  const syncServerFleet = useCallback((serverFleet: Aircraft[]) => {
    if (!Array.isArray(serverFleet) || serverFleet.length === 0) return;
    if (hasUnsavedChangesRef.current) return; // Never overwrite while user has unsaved edits!

    setFleet((currentFleet) => {
      if (isFleetEqual(currentFleet, serverFleet)) {
        return currentFleet;
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverFleet));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      return serverFleet;
    });
  }, []);

  // Fetch live fleet from API
  const fetchFleetRest = useCallback(async () => {
    if (hasUnsavedChangesRef.current) return;
    try {
      const res = await fetch(`/api/fleet?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });
      if (res.ok) {
        const data: Aircraft[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          syncServerFleet(data);
          setLastSyncTime(new Date());
          setConnectionStatus('connected');
        }
      }
    } catch {
      setConnectionStatus('offline');
    }
  }, [syncServerFleet]);

  // Polling lifecycle: every 4 seconds when idle and no unsaved changes
  useEffect(() => {
    let isUnmounted = false;

    fetchFleetRest();

    const pollInterval = window.setInterval(() => {
      if (isUnmounted) return;
      if (hasUnsavedChangesRef.current) return; // 100% pause during active edits

      if (document.visibilityState === 'visible') {
        fetchFleetRest();
      }
    }, 4000);

    const handleFocus = () => {
      if (!isUnmounted && document.visibilityState === 'visible' && !hasUnsavedChangesRef.current) {
        fetchFleetRest();
      }
    };
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    // Instant sync across tabs on same device if no unsaved changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && !hasUnsavedChangesRef.current) {
        try {
          const updatedFleet: Aircraft[] = JSON.parse(e.newValue);
          if (Array.isArray(updatedFleet) && updatedFleet.length > 0) {
            setFleet((prev) => (isFleetEqual(prev, updatedFleet) ? prev : updatedFleet));
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isUnmounted = true;
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchFleetRest]);

  // Warn on accidental tab close/refresh if unsaved
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Action: Move Location (0ms local stage)
  const moveLocation = useCallback(
    (id: string, newLocation: AirportLocation) => {
      setFleet((prev) => {
        const target = prev.find((p) => p.id === id);
        if (!target || target.location === newLocation) return prev;

        let newStatus = target.status;
        if (target.status === 'Up-Enroute') {
          newStatus = 'Up';
        }

        const nowIso = new Date().toISOString();
        const next = prev.map((p) =>
          p.id === id
            ? {
                ...p,
                location: newLocation,
                status: newStatus,
                enrouteTo: undefined,
                eta: undefined,
                updatedAt: nowIso,
              }
            : p
        );
        return next;
      });
      setHasUnsavedChanges(true);
    },
    []
  );

  // Action: Change Status (0ms local stage)
  const updateStatus = useCallback((id: string, newStatus: AircraftStatus) => {
    setFleet((prev) => {
      const nowIso = new Date().toISOString();
      return prev.map((p) => (p.id === id ? { ...p, status: newStatus, updatedAt: nowIso } : p));
    });
    setHasUnsavedChanges(true);
  }, []);

  // Action: Add Aircraft (0ms local stage)
  const addAircraft = useCallback((aircraftData: Omit<Aircraft, 'id' | 'updatedAt'>) => {
    const cleanTail = aircraftData.tailNumber.trim().toUpperCase().replace(/^N/, '');
    const newPlane: Aircraft = {
      ...aircraftData,
      id: `plane-${cleanTail}-${Date.now().toString(36)}`,
      tailNumber: cleanTail,
      hoursRemaining: 100,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Dispatch',
    };

    setFleet((prev) => [...prev.filter((p) => p.id !== newPlane.id), newPlane]);
    setHasUnsavedChanges(true);
    return newPlane;
  }, []);

  // Action: Delete Aircraft (0ms local stage)
  const deleteAircraft = useCallback((id: string) => {
    setFleet((prev) => prev.filter((p) => p.id !== id));
    setHasUnsavedChanges(true);
  }, []);

  // Action: SAVE ALL CHANGES (Atomic snapshot commit to database)
  const saveChanges = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const payload = fleet.map((p) => ({ ...p, updatedAt: nowIso }));

      const res = await fetch('/api/fleet', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setHasUnsavedChanges(false);
        setIsSaving(false);
        setLastSyncTime(new Date());
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {}
        return true;
      }
      setIsSaving(false);
      return false;
    } catch (e) {
      console.error('Failed to save fleet changes:', e);
      setIsSaving(false);
      return false;
    }
  }, [fleet]);

  // Action: DISCARD CHANGES (Revert to server state)
  const discardChanges = useCallback(async () => {
    setIsSaving(true);
    hasUnsavedChangesRef.current = false;
    try {
      const res = await fetch(`/api/fleet?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store' },
      });
      if (res.ok) {
        const data: Aircraft[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFleet(data);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          } catch {}
        }
      }
    } catch (e) {
      console.error('Failed to discard changes:', e);
    } finally {
      setHasUnsavedChanges(false);
      setIsSaving(false);
    }
  }, []);

  // Action: Reset Fleet
  const resetFleet = useCallback(async () => {
    try {
      const res = await fetch('/api/reset-fleet', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.fleet)) {
          setFleet(data.fleet);
          setHasUnsavedChanges(false);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.fleet));
          } catch {}
        }
      }
    } catch (e) {
      console.error('Failed to reset fleet:', e);
    }
  }, []);

  // Compatibility stubs
  const logFlightHours = useCallback(async () => {}, []);
  const completeInspection = useCallback(async () => {}, []);
  const updateAircraft = useCallback(async () => {}, []);

  return {
    fleet,
    connectionStatus,
    lastSyncTime,
    hasUnsavedChanges,
    isSaving,
    saveChanges,
    discardChanges,
    moveLocation,
    updateStatus,
    addAircraft,
    deleteAircraft,
    resetFleet,
    logFlightHours,
    completeInspection,
    updateAircraft,
  };
}
