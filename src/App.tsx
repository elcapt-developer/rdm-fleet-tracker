import React, { useState, useMemo, useEffect } from 'react';
import { useFleetSync } from './hooks/useFleetSync';
import { Header } from './components/Header';
import { PlainFleetBoard } from './components/PlainFleetBoard';
import { PasswordModal } from './components/PasswordModal';
import { AircraftModal } from './components/AircraftModal';
import { AircraftStatus, AirportLocation, AircraftType } from './types';
import { Save, RotateCcw, Check, Lock, Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const {
    fleet,
    hasUnsavedChanges,
    isSaving,
    saveChanges,
    discardChanges,
    moveLocation,
    updateStatus,
    addAircraft,
    deleteAircraft,
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

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Keyboard shortcut: Cmd+S / Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (isEditMode && hasUnsavedChanges && !isSaving) {
          handleSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, hasUnsavedChanges, isSaving, saveChanges]);

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

  // Edit Mode Toggle with unsaved protection
  const handleRequestEditMode = () => {
    if (isEditMode) {
      if (hasUnsavedChanges) {
        const confirmExit = window.confirm(
          'You have unsaved changes. Are you sure you want to exit without saving?'
        );
        if (!confirmExit) return;
        discardChanges();
      }
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

  // Save changes button click
  const handleSave = async () => {
    const success = await saveChanges();
    if (success) {
      setToastMessage('✅ All changes saved successfully!');
      setTimeout(() => setToastMessage(null), 3500);
    } else {
      alert('Network error while saving changes. Please try again.');
    }
  };

  // Discard changes
  const handleDiscard = async () => {
    if (window.confirm('Discard all unsaved changes and revert to server state?')) {
      await discardChanges();
      setToastMessage('Reverted to previously saved state.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const lastUpdatedTime = useMemo(() => {
    let latest = 0;
    for (const p of fleet) {
      if (p.updatedAt) {
        const t = new Date(p.updatedAt).getTime();
        if (!isNaN(t) && t > latest) latest = t;
      }
    }
    return latest > 0 ? new Date(latest) : new Date();
  }, [fleet]);

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
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Edit Mode Notice & Action Banner */}
        {isEditMode && (
          <div
            className={`mt-2.5 px-4 py-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs transition-all ${
              hasUnsavedChanges
                ? 'bg-amber-50/90 border-amber-300 text-amber-950 shadow-xs'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {hasUnsavedChanges ? (
                <span className="flex h-2.5 w-2.5 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
              ) : (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 font-bold" />
              )}
              <div>
                {hasUnsavedChanges ? (
                  <span>
                    <strong>Unsaved changes pending.</strong> When finished, click <strong>[Save Changes]</strong> to update the database. (Shortcut: <kbd className="px-1.5 py-0.5 bg-amber-200/70 border border-amber-300 rounded text-[11px] font-mono">⌘+S</kbd> / <kbd className="px-1.5 py-0.5 bg-amber-200/70 border border-amber-300 rounded text-[11px] font-mono">Ctrl+S</kbd>)
                  </span>
                ) : (
                  <span>
                    <strong>Dispatch Edit Mode Active</strong>: Drag and drop aircraft or update status and location freely.
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <>
                  <button
                    onClick={handleDiscard}
                    disabled={isSaving}
                    title="Revert uncommitted changes"
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Discard</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 hover:shadow-md"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                onClick={handleRequestEditMode}
                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer flex items-center gap-1 ml-1"
              >
                <Lock className="w-3 h-3" />
                <span>Exit Edit Mode</span>
              </button>
            </div>
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
        <footer className="py-3 text-center text-xs text-slate-400">
          <div className="text-[11px] text-slate-400">
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
