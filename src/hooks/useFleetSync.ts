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

  // Timestamp of the last local edit on THIS browser tab
  const lastLocalEditTimeRef = useRef<number>(0);

  // Synchronize server fleet into local state without conflict or flicker
  const syncServerFleet = useCallback((serverFleet: Aircraft[]) => {
    if (!Array.isArray(serverFleet) || serverFleet.length === 0) return;

    setFleet((currentFleet) => {
      const currentMap = new Map(currentFleet.map((p) => [p.id, p]));

      // 1. Only keep planes that exist on the server (deleted planes stay deleted)
      const nextFleet = serverFleet.map((sPlane) => {
        const localPlane = currentMap.get(sPlane.id);
        if (!localPlane) return sPlane;

        const sTime = sPlane.updatedAt ? new Date(sPlane.updatedAt).getTime() : 0;
        const lTime = localPlane.updatedAt ? new Date(localPlane.updatedAt).getTime() : 0;

        // If local plane was updated more recently on THIS device, DO NOT revert!
        // Keep local version until server catches up.
        if (lTime > sTime) {
          return localPlane;
        }

        // Server has equal or newer timestamp, adopt server truth
        return sPlane;
      });

      // 2. If nothing actually changed on the board, return current reference!
      // This completely stops React re-render jitter and input flickering!
      if (isFleetEqual(currentFleet, nextFleet)) {
        return currentFleet;
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFleet));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      return nextFleet;
    });
  }, []);

  // Fetch live fleet from API
  const fetchFleetRest = useCallback(async () => {
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

  // Polling lifecycle
  useEffect(() => {
    let isUnmounted = false;

    // Initial fetch
    fetchFleetRest();

    // Poll every 3.5 seconds
    const pollInterval = window.setInterval(() => {
      if (isUnmounted) return;

      // CRITICAL: Pause polling for 5 seconds after a user action in this tab!
      // This gives the server time to replicate and guarantees zero collision/flicker.
      const timeSinceLocalEdit = Date.now() - lastLocalEditTimeRef.current;
      if (timeSinceLocalEdit < 5000) {
        return;
      }

      if (document.visibilityState === 'visible') {
        fetchFleetRest();
      }
    }, 3500);

    // Immediate refresh on tab focus (e.g. unlocking phone or switching back)
    const handleFocus = () => {
      if (!isUnmounted && document.visibilityState === 'visible') {
        const timeSinceLocalEdit = Date.now() - lastLocalEditTimeRef.current;
        if (timeSinceLocalEdit >= 5000) {
          fetchFleetRest();
        }
      }
    };
    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    // 0ms instant sync across multiple tabs on the same device
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
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

  // Action: Update Aircraft (Status, Location, Notes)
  const updateAircraft = useCallback(async (updates: Partial<Aircraft> & { id: string }) => {
    // Record local edit timestamp to pause polling and protect from rollback
    lastLocalEditTimeRef.current = Date.now();
    const nowIso = new Date().toISOString();
    const payload = { ...updates, updatedAt: nowIso };

    // 0ms Instant Optimistic UI update
    setFleet((prev) => {
      const next = prev.map((p) => (p.id === updates.id ? { ...p, ...payload } : p));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      await fetch(`/api/aircraft/${updates.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.error('Failed to update aircraft on server:', e);
    }
  }, []);

  // Action: Move Location
  const moveLocation = useCallback(
    async (id: string, newLocation: AirportLocation) => {
      const target = fleet.find((p) => p.id === id);
      if (!target || target.location === newLocation) return;

      let newStatus = target.status;
      if (target.status === 'Up-Enroute') {
        newStatus = 'Up';
      }

      await updateAircraft({
        id,
        location: newLocation,
        status: newStatus,
        enrouteTo: undefined,
        eta: undefined,
      });
    },
    [fleet, updateAircraft]
  );

  // Action: Change Status
  const updateStatus = useCallback(
    async (id: string, newStatus: AircraftStatus) => {
      await updateAircraft({ id, status: newStatus });
    },
    [updateAircraft]
  );

  // Action: Add Aircraft
  const addAircraft = useCallback(async (aircraftData: Omit<Aircraft, 'id' | 'updatedAt'>) => {
    lastLocalEditTimeRef.current = Date.now();
    const nowIso = new Date().toISOString();

    try {
      const res = await fetch('/api/aircraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...aircraftData, updatedAt: nowIso }),
      });
      if (res.ok) {
        const created: Aircraft = await res.json();
        setFleet((prev) => {
          const next = [...prev.filter((p) => p.id !== created.id), created];
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {}
          return next;
        });
        return created;
      }
    } catch (e) {
      console.error('Failed to add aircraft:', e);
    }
  }, []);

  // Action: Delete Aircraft
  const deleteAircraft = useCallback(async (id: string) => {
    lastLocalEditTimeRef.current = Date.now();

    // 0ms Optimistic UI removal
    setFleet((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      await fetch(`/api/aircraft/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to delete aircraft:', e);
    }
  }, []);

  // Action: Reset Fleet
  const resetFleet = useCallback(async () => {
    lastLocalEditTimeRef.current = Date.now();
    try {
      const res = await fetch('/api/reset-fleet', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.fleet)) {
          setFleet(data.fleet);
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

  return {
    fleet,
    connectionStatus,
    lastSyncTime,
    updateAircraft,
    moveLocation,
    updateStatus,
    logFlightHours,
    completeInspection,
    addAircraft,
    deleteAircraft,
    resetFleet,
  };
}
