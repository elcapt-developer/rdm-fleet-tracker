import { useState, useEffect, useCallback, useRef } from 'react';
import { Aircraft, AirportLocation, AircraftStatus, WSMessage } from '../types';
import { INITIAL_FLEET } from '../data/seedFleet';

// Bumped cache key to flush old stale device-specific caches
const STORAGE_KEY = 'haa_fleet_live_v1';

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
    } catch {
      // fallback to initial
    }
    return INITIAL_FLEET;
  });

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'offline'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [recentNotification, setRecentNotification] = useState<string | null>(null);

  // Tracks IDs touched locally on THIS tab and when (ms)
  // Keeps UI instant during drag & drop without fighting incoming polling
  const inFlightEditsRef = useRef<Map<string, number>>(new Map());

  // WebSocket reference for local development
  const wsRef = useRef<WebSocket | null>(null);

  const notifyUser = useCallback((msg: string) => {
    setRecentNotification(msg);
    setTimeout(() => {
      setRecentNotification((current) => (current === msg ? null : current));
    }, 4000);
  }, []);

  // Server-First Sync: The server (Vercel Blob) is the Single Source of Truth across all devices.
  // We strictly adopt serverFleet, preserving local state ONLY for an aircraft that was
  // modified in this specific tab within the last 2000ms.
  const syncServerFleet = useCallback((serverFleet: Aircraft[]) => {
    if (!Array.isArray(serverFleet) || serverFleet.length === 0) return;

    setFleet((currentFleet) => {
      const now = Date.now();
      const currentMap = new Map(currentFleet.map((p) => [p.id, p]));

      const nextFleet = serverFleet.map((sPlane) => {
        const inFlightTime = inFlightEditsRef.current.get(sPlane.id);
        // If modified on THIS tab in the last 2.0s, keep optimistic edit
        if (inFlightTime && now - inFlightTime < 2000) {
          const localPlane = currentMap.get(sPlane.id);
          if (localPlane) return localPlane;
        }
        return sPlane;
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFleet));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      return nextFleet;
    });
  }, []);

  // Fetch live fleet from API with timestamp cache-buster to prevent mobile browser caching
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
      // Offline fallback remains in state
      setConnectionStatus('offline');
    }
  }, [syncServerFleet]);

  // Polling and synchronization lifecycle
  useEffect(() => {
    let isUnmounted = false;

    // 1. Initial fetch on mount
    fetchFleetRest();

    // 2. High-frequency 2-second polling for real-time fleet synchronization across all devices
    const pollInterval = window.setInterval(() => {
      if (!isUnmounted && document.visibilityState === 'visible') {
        fetchFleetRest();
      }
    }, 2000);

    // 3. Immediate re-sync when tab is reopened or window gains focus (e.g. phone unlock)
    const handleVisibilityOrFocus = () => {
      if (!isUnmounted && document.visibilityState === 'visible') {
        fetchFleetRest();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // 4. Instant 0ms synchronization between multiple tabs on the same device
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updatedFleet: Aircraft[] = JSON.parse(e.newValue);
          if (Array.isArray(updatedFleet) && updatedFleet.length > 0) {
            setFleet(updatedFleet);
          }
        } catch {
          /* empty */
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 5. Optional WebSocket connection for local dev (server.js) only
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const message: WSMessage = JSON.parse(event.data);
            if (message.type === 'INIT_FLEET' || message.type === 'FLEET_RESET') {
              syncServerFleet(message.payload);
            }
          } catch {
            /* empty */
          }
        };
      } catch {
        /* empty */
      }
    }

    return () => {
      isUnmounted = true;
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('storage', handleStorageChange);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchFleetRest, syncServerFleet]);

  // Action: Update Aircraft (Status, Location, Notes)
  const updateAircraft = useCallback(async (updates: Partial<Aircraft> & { id: string }) => {
    inFlightEditsRef.current.set(updates.id, Date.now());

    // 0ms Optimistic UI update
    setFleet((prev) => {
      const next = prev.map((p) =>
        p.id === updates.id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* empty */
      }
      return next;
    });

    try {
      const res = await fetch(`/api/aircraft/${updates.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data: Aircraft = await res.json();
        setFleet((prev) => {
          const next = prev.map((p) => (p.id === data.id ? data : p));
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            /* empty */
          }
          return next;
        });
      }
    } catch (e) {
      console.error('Failed to update aircraft on server:', e);
    }
  }, []);

  // Action: Move Location (Madras <-> Sky Service <-> HAA Campus)
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

  // Action: Change Status (Up, Up-Low Hours, Up-Enroute, Down)
  const updateStatus = useCallback(
    async (id: string, newStatus: AircraftStatus) => {
      await updateAircraft({ id, status: newStatus });
    },
    [updateAircraft]
  );

  // Action: Add Aircraft
  const addAircraft = useCallback(async (aircraftData: Omit<Aircraft, 'id' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/aircraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aircraftData),
      });
      if (res.ok) {
        const created: Aircraft = await res.json();
        inFlightEditsRef.current.set(created.id, Date.now());
        setFleet((prev) => {
          const next = [...prev.filter((p) => p.id !== created.id), created];
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch {
            /* empty */
          }
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
    // 0ms Optimistic UI removal
    setFleet((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* empty */
      }
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
    try {
      const res = await fetch('/api/reset-fleet', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.fleet)) {
          setFleet(data.fleet);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.fleet));
          } catch {
            /* empty */
          }
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
    recentNotification,
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
