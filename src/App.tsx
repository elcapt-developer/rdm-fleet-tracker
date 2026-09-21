import React, { useState, useMemo } from 'react';
import { useFleetSync } from './hooks/useFleetSync';
import { Header } from './components/Header';
import { PlainFleetBoard } from './components/PlainFleetBoard';
import { PasswordModal } from './components/PasswordModal';
import { AircraftModal } from './components/AircraftModal';
import { AircraftStatus, AirportLocation, AircraftType } from './types';

export const App: React.FC = () => {
  const {
    fleet,
    lastSyncTime,
    moveLocation,
    updateStatus,
    addAircraft,
    deleteAircraft,
    resetFleet,
  } = useFleetSync();

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Password-protected Edit mode (Password: 'haahaa')
  const [isEditMode, setIsEditMode] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('haa_edit_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Modals
  const [isAircraftModalOpen, setIsAircraftModalOpen] = useState(false);
  const [targetLocationForNew, setTargetLocationForNew] = useState<AirportLocation>('Sky Service');

  // Filtered aircraft by search
  const filteredFleet = useMemo(() => {
    if (!searchQuery.trim()) return fleet;
    const q = searchQuery.trim().toLowerCase().replace(/^n/, '');
    return fleet.filter((p) => {
      const tail = p.tailNumber.toLowerCase().replace(/^n/, '');
      return (
        tail.includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
      );
    });
  }, [fleet, searchQuery]);

  // Edit Mode Toggle
  const handleRequestEditMode = () => {
    if (isEditMode) {
      setIsEditMode(false);
      try {
        sessionStorage.removeItem('haa_edit_auth');
      } catch {
        /* empty */
      }
    } else {
      setIsPasswordModalOpen(true);
    }
  };

  const handlePasswordSuccess = () => {
    setIsEditMode(true);
    setIsPasswordModalOpen(false);
    try {
      sessionStorage.setItem('haa_edit_auth', 'true');
    } catch {
      /* empty */
    }
  };

  // Add Plane
  const handleOpenAddModal = (defaultLoc?: AirportLocation) => {
    if (!isEditMode) {
      setIsPasswordModalOpen(true);
      return;
    }
    setTargetLocationForNew(defaultLoc || 'Sky Service');
    setIsAircraftModalOpen(true);
  };

  const handleSaveAircraft = (data: {
    tailNumber: string;
    type: AircraftType;
    location: AirportLocation;
    status: AircraftStatus;
  }) => {
    addAircraft({
      tailNumber: data.tailNumber,
      type: data.type,
      location: data.location,
      status: data.status,
      hoursRemaining: 100,
    });
  };

  const lastUpdatedTime = useMemo(() => {
    let latest = lastSyncTime.getTime();
    for (const p of fleet) {
      if (p.updatedAt) {
        const t = new Date(p.updatedAt).getTime();
        if (!isNaN(t) && t > latest) latest = t;
      }
    }
    return new Date(latest);
  }, [fleet, lastSyncTime]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Clean Header */}
      <Header
        lastUpdatedTime={lastUpdatedTime}
        isEditMode={isEditMode}
        onRequestEditMode={handleRequestEditMode}
        onOpenAddModal={() => handleOpenAddModal()}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalCount={fleet.length}
      />

      {/* Main Board Container */}
      <main className="max-w-[1360px] mx-auto px-4 sm:px-6 w-full flex-1">
        {/* Edit Mode Notice Banner */}
        {isEditMode && (
          <div className="mt-2.5 px-3.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
            <span>
              ✏️ <strong>Edit Mode Active</strong>: Drag & drop planes between ramps, or use the quick status & location selectors.
            </span>
            <button
              onClick={() => {
                setIsEditMode(false);
                sessionStorage.removeItem('haa_edit_auth');
              }}
              className="text-amber-800 underline font-semibold hover:text-amber-950"
            >
              Lock View
            </button>
          </div>
        )}

        {/* 3-Column Table for Madras, Sky Service, and HAA Campus */}
        <PlainFleetBoard
          fleet={filteredFleet}
          isEditMode={isEditMode}
          onMoveLocation={moveLocation}
          onUpdateStatus={updateStatus}
          onAddPlaneToLocation={handleOpenAddModal}
          onDeleteAircraft={deleteAircraft}
        />

        {/* Minimal Footer */}
        <footer className="py-3 text-center text-xs text-slate-400 space-y-0.5">
          <div>RDM Fleet Tracker • Hillsboro Aero Academy Redmond Campus</div>
          <div className="text-[11px] text-slate-500">
            © Mingyun 'John' Kim. All rights reserved.
          </div>
        </footer>
      </main>

      {/* Modals */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
      />

      <AircraftModal
        isOpen={isAircraftModalOpen}
        onClose={() => setIsAircraftModalOpen(false)}
        onSave={handleSaveAircraft}
        defaultLocation={targetLocationForNew}
      />
    </div>
  );
};

export default App;
