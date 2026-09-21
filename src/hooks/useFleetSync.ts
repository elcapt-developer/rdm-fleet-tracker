import { useState, useEffect, useCallback, useRef } from 'react';
import { Aircraft, AirportLocation, AircraftStatus, WSMessage } from '../types';
import { INITIAL_FLEET } from '../data/seedFleet';

const STORAGE_KEY = 'haa_aircraft_fleet_cache_v2';

export function useFleetSync() {
  const [fleet, setFleet] = useState<Aircraft[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // fallback to initial
    }
    return INITIAL_FLEET;
  });

  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'offline'>('connecting');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [recentNotification, setRecentNotification] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<number | null>(null);

  // Sync state to LocalStorage as instant cache
  const updateLocalState = useCallback((newFleet: Aircraft[]) => {
    setFleet(newFleet);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFleet));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, []);

  const notifyUser = useCallback((msg: string) => {
    setRecentNotification(msg);
    setTimeout(() => {
      setRecentNotification((current) => (current === msg ? null : current));
    }, 4000);
  }, []);

  // Fetch initial fleet via REST as quick backup
  const fetchFleetRest = useCallback(async () => {
    try {
      const res = await fetch('/api/fleet');
      if (res.ok) {
        const data: Aircraft[] = await res.json();
        updateLocalState(data);
        setLastSyncTime(new Date());
      }
    } catch {
      // Offline fallback already loaded from localStorage
    }
  }, [updateLocalState]);

  // Connect WebSocket
  useEffect(() => {
    let reconnectTimeout: number | null = null;
    let isUnmounted = false;

    function connectWs() {
      if (isUnmounted) return;
      setConnectionStatus('connecting');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmounted) return;
        setConnectionStatus('connected');
        setLastSyncTime(new Date());

        // Heartbeat ping
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        if (isUnmounted) return;
        try {
          const message: WSMessage = JSON.parse(event.data);
          setLastSyncTime(new Date());

          switch (message.type) {
            case 'INIT_FLEET':
              updateLocalState(message.payload);
              break;

            case 'AIRCRAFT_UPDATED': {
              const updated = message.payload;
              setFleet((prev) => {
                const index = prev.findIndex((p) => p.id === updated.id);
                if (index === -1) return [...prev, updated];
                const next = [...prev];
                next[index] = updated;
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                } catch {
                  /* empty */
                }
                return next;
              });
              notifyUser(`✈️ N${updated.tailNumber} updated: ${updated.location} (${updated.status})`);
              break;
            }

            case 'AIRCRAFT_ADDED': {
              const added = message.payload;
              setFleet((prev) => {
                const next = [...prev.filter((p) => p.id !== added.id), added];
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                } catch {
                  /* empty */
                }
                return next;
              });
              notifyUser(`➕ Added N${added.tailNumber} to ${added.location}`);
              break;
            }

            case 'AIRCRAFT_DELETED': {
              const deletedId = message.payload.id;
              setFleet((prev) => {
                const next = prev.filter((p) => p.id !== deletedId);
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                } catch {
                  /* empty */
                }
                return next;
              });
              notifyUser(`Removed aircraft from fleet`);
              break;
            }

            case 'FLEET_RESET':
              updateLocalState(message.payload);
              notifyUser(`🔄 Fleet reset to initial state`);
              break;
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.onclose = () => {
        if (isUnmounted) return;
        setConnectionStatus('offline');
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        // Attempt reconnect after 3 seconds
        reconnectTimeout = window.setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    fetchFleetRest();
    connectWs();

    // Fallback polling for Vercel / serverless deployments without WebSockets
    const pollInterval = window.setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        fetchFleetRest();
      }
    }, 4000);

    // Refresh immediately on tab focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchFleetRest();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchFleetRest, updateLocalState, notifyUser]);

  // Action: Update Aircraft
  const updateAircraft = useCallback(async (updates: Partial<Aircraft> & { id: string }) => {
    // Optimistic UI update
    setFleet((prev) => {
      const next = prev.map((p) => (p.id === updates.id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p));
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
        const data = await res.json();
        setFleet((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      }
    } catch {
      // Keep optimistic change
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

  // Action: Log Flight Time
  const logFlightHours = useCallback(async (id: string, flightHours: number, user?: string) => {
    try {
      const res = await fetch(`/api/aircraft/${id}/flight-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flightHours, updatedBy: user || 'Flight Log' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFleet((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
    } catch {
      // Local fallback calculation
      setFleet((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const newHoursRemaining = Math.max(0, Math.round((p.hoursRemaining - flightHours) * 10) / 10);
          let newStatus = p.status;
          if (newHoursRemaining <= 0) newStatus = 'Down';
          else if (newHoursRemaining < 5.0 && (p.status === 'Up' || p.status === 'Up-Enroute')) newStatus = 'Up-Low Hours';
          return {
            ...p,
            hoursRemaining: newHoursRemaining,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    }
  }, []);

  // Action: Complete 100-Hour Inspection
  const completeInspection = useCallback(async (id: string, signoffBy?: string) => {
    try {
      const res = await fetch(`/api/aircraft/${id}/complete-100hr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signoffBy: signoffBy || 'HAA Maintenance Shop' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFleet((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
    } catch {
      setFleet((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          return {
            ...p,
            hoursRemaining: 100.0,
            status: 'Up',
            notes: `100-Hour Inspection Completed on ${new Date().toLocaleDateString()}`,
            updatedAt: new Date().toISOString(),
          };
        })
      );
    }
  }, []);

  // Action: Add Aircraft
  const addAircraft = useCallback(async (aircraftData: Omit<Aircraft, 'id' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/aircraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aircraftData),
      });
      if (res.ok) {
        const created = await res.json();
        setFleet((prev) => [...prev, created]);
        return created;
      }
    } catch {
      const fallback: Aircraft = {
        ...aircraftData,
        id: `plane-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      setFleet((prev) => [...prev, fallback]);
      return fallback;
    }
  }, []);

  // Action: Delete Aircraft
  const deleteAircraft = useCallback(async (id: string) => {
    try {
      await fetch(`/api/aircraft/${id}`, { method: 'DELETE' });
    } catch {
      /* empty */
    }
    setFleet((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Action: Reset Fleet
  const resetFleet = useCallback(async () => {
    try {
      const res = await fetch('/api/reset-fleet', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        updateLocalState(data.fleet);
      }
    } catch {
      updateLocalState(INITIAL_FLEET);
    }
  }, [updateLocalState]);

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
