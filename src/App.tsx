import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import type { MapMarker, Coordinate, HistoryEntry } from './types';
import { useMap } from './hooks/useMap';
import { useElevation } from './hooks/useElevation';
import { useSettings } from './hooks/useSettings';
import { metersToFeet } from './lib/elevation';
import { searchLocation, debounce, getSimpleName } from './lib/geocoding';
import { saveMarkers, loadMarkers, saveHistory, loadHistory, deleteHistoryEntry, generateId } from './lib/storage';
import { exportMarkersToGPX } from './lib/gpx';

// Icons as SVG strings
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const LocateIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const CenterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 10v4M10 12h4M4 18h16M4 6h16M4 12h16" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const HistoryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

const ElevationProfile: React.FC<{ markers: MapMarker[]; unit: 'meters' | 'feet' }> = ({ markers, unit }) => {
  const validMarkers = markers.filter(m => m.elevation !== null);

  if (validMarkers.length < 2) {
    return (
      <div className="elevation-profile">
        <h3>Elevation Profile</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
          Add at least 2 markers to see the elevation profile
        </p>
      </div>
    );
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = 'var(--surface)';
    ctx.fillRect(0, 0, width, height);

    // Find min and max elevation
    const elevations = validMarkers.map(m => unit === 'feet' ? metersToFeet(m.elevation!) : m.elevation!);
    const minEle = Math.min(...elevations);
    const maxEle = Math.max(...elevations);
    const eleRange = maxEle - minEle || 1;

    // Scale factors
    const xScale = chartWidth / (validMarkers.length - 1);

    // Draw grid lines
    ctx.strokeStyle = 'var(--border)';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = padding.top + (i / ySteps) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Draw label
      const value = maxEle - (i / ySteps) * eleRange;
      ctx.fillStyle = 'var(--text-muted)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(value)} ${unit === 'feet' ? 'ft' : 'm'}`, padding.left - 5, y + 3);
    }

    // Draw line chart
    ctx.beginPath();
    ctx.strokeStyle = 'var(--primary)';
    ctx.lineWidth = 2;

    validMarkers.forEach((_marker, index) => {
      const x = padding.left + index * xScale;
      const ele = unit === 'feet' ? metersToFeet(validMarkers[index].elevation!) : validMarkers[index].elevation!;
      const y = padding.top + ((maxEle - ele) / eleRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    validMarkers.forEach((_marker, index) => {
      const x = padding.left + index * xScale;
      const ele = unit === 'feet' ? metersToFeet(validMarkers[index].elevation!) : validMarkers[index].elevation!;
      const y = padding.top + ((maxEle - ele) / eleRange) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'var(--primary)';
      ctx.fill();

      // Draw point number
      ctx.fillStyle = 'white';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${index + 1}`, x, y);
    });

    // Draw X axis labels
    ctx.fillStyle = 'var(--text-muted)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    validMarkers.forEach((_marker, index) => {
      const x = padding.left + index * xScale;
      ctx.fillText(`${index + 1}`, x, height - 10);
    });

    // Draw Y axis label
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = 'var(--text-muted)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Elevation (${unit === 'feet' ? 'ft' : 'm'})`, 0, 0);
    ctx.restore();

    // Draw title
    ctx.fillStyle = 'var(--text)';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Elevation Profile', width / 2, 15);
  }, [validMarkers, unit]);

  return (
    <div className="elevation-profile">
      <canvas ref={canvasRef} width={400} height={180} style={{ width: '100%', height: '150px' }} />
    </div>
  );
};

const App: React.FC = () => {
  const { settings, toggleDarkMode, setMapType, setUnit } = useSettings();
  const { calculateStats } = useElevation();
  const { mapRef, mapInstance, markers, addMarker, removeMarker, clearAllMarkers, centerMap, changeMapType, fitToMarkers } = useMap();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Apply dark mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
  }, [settings.darkMode]);

  // Load saved markers on mount
  useEffect(() => {
    const savedMarkers = loadMarkers();
    if (savedMarkers.length > 0) {
      clearAllMarkers();
      savedMarkers.forEach(marker => {
        addMarker(marker.position, marker.label);
      });
    }
  }, []);

  // Save markers when they change
  useEffect(() => {
    saveMarkers(markers);
  }, [markers]);

  // Load history
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Update map type when settings change
  useEffect(() => {
    if (mapInstance) {
      changeMapType(settings.mapType);
    }
  }, [settings.mapType, mapInstance, changeMapType]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      const results = await searchLocation(query, 5);
      setSearchResults(results);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      // Cleanup debounce timeout
    };
  }, [searchQuery, debouncedSearch]);

  // Handle map click
  useEffect(() => {
    if (!mapInstance) return;

    const handleClick = async (e: L.LeafletMouseEvent) => {
      const coord: Coordinate = { lat: e.latlng.lat, lng: e.latlng.lng };
      await addMarker(coord);
    };

    mapInstance.on('click', handleClick);

    return () => {
      mapInstance.off('click', handleClick);
    };
  }, [mapInstance, addMarker]);

  const handleSearchSelect = useCallback(async (result: any) => {
    setSearchQuery('');
    setSearchResults([]);
    
    const coord: Coordinate = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
    
    // Center map on selected location
    centerMap(coord, 15);
    
    // Add marker
    await addMarker(coord, getSimpleName(result.display_name));
  }, [centerMap, addMarker]);

  const handleMyLocation = useCallback(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coord: Coordinate = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          centerMap(coord, 15);
          setLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLoading(false);
          alert('Unable to get your location. Please enable location services.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  }, [centerMap]);

  const handleClearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all markers?')) {
      clearAllMarkers();
    }
  }, [clearAllMarkers]);

  const handleSaveHistory = useCallback(() => {
    const name = prompt('Enter a name for this session:');
    if (name) {
      const entry: HistoryEntry = {
        id: generateId(),
        name,
        markers,
        timestamp: Date.now(),
      };
      saveHistory(entry);
      setHistory(loadHistory());
      alert(`Session "${name}" saved successfully!`);
    }
  }, [markers]);

  const handleLoadHistory = useCallback((entry: HistoryEntry) => {
    clearAllMarkers();
    entry.markers.forEach(marker => {
      addMarker(marker.position, marker.label);
    });
    setShowHistoryModal(false);
    fitToMarkers();
  }, [clearAllMarkers, addMarker, fitToMarkers]);

  const handleDeleteHistory = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this history entry?')) {
      deleteHistoryEntry(id);
      setHistory(loadHistory());
    }
  }, []);

  const handleExportGPX = useCallback(() => {
    const name = prompt('Enter a name for the GPX file:', 'Elevation Track');
    if (name) {
      exportMarkersToGPX(markers, name);
    }
  }, [markers]);

  const handleCenterOnMarker = useCallback((marker: MapMarker) => {
    centerMap(marker.position, 15);
  }, [centerMap]);

  const handleRemoveMarker = useCallback((id: string) => {
    removeMarker(id);
  }, [removeMarker]);

  const formatStatValue = (value: number | null): string => {
    if (value === null) return 'N/A';
    const rounded = Math.round(value);
    return `${rounded} ${settings.unit === 'feet' ? 'ft' : 'm'}`;
  };

  const formatElevation = (elevation: number | null): string => {
    if (elevation === null) return 'Loading...';
    const value = settings.unit === 'feet' ? metersToFeet(elevation) : elevation;
    return `${Math.round(value)} ${settings.unit === 'feet' ? 'ft' : 'm'}`;
  };

  // Calculate stats
  const currentStats = calculateStats(markers, settings.unit);
  const validMarkers = markers.filter(m => m.elevation !== null);

  return (
    <div className="app-container" data-theme={settings.darkMode ? 'dark' : 'light'}>
      {/* Header */}
      <header className="header">
        <h1>Elevation Detector</h1>
        <div className="header-actions">
          <button 
            className="action-btn touch-target"
            onClick={() => setShowSettingsModal(true)}
            title="Settings"
          >
            <SettingsIcon />
          </button>
          <button 
            className="action-btn touch-target"
            onClick={() => setShowHistoryModal(true)}
            title="History"
          >
            <HistoryIcon />
          </button>
        </div>
      </header>

      {/* Map Container */}
      <div className="map-container">
        <div ref={mapRef} className="map-wrapper" />

        {/* Search */}
        <div className="search-container">
          <div style={{ position: 'relative' }}>
            <div style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)' 
            }}>
              <SearchIcon />
            </div>
            <input
              type="text"
              className="search-input"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setSearchResults(searchResults)}
              onBlur={() => setTimeout(() => setSearchResults([]), 200)}
            />
            {loading && <div className="loading" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />}
          </div>
          
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div 
                className="search-results"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {searchResults.map((result, index) => (
                  <div
                    key={result.place_id || index}
                    className="search-result-item"
                    onMouseDown={() => handleSearchSelect(result)}
                  >
                    <div style={{ fontWeight: 500 }}>{getSimpleName(result.display_name)}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {result.address?.country || ''}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Marker Cards */}
        {markers.length > 0 && (
          <div className="marker-cards">
            {markers.slice().reverse().map((marker, index) => (
              <motion.div
                key={marker.id}
                className="marker-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                layout
              >
                <div className="marker-number">{markers.length - index}</div>
                <div className="marker-info">
                  <div className="marker-label">{marker.label}</div>
                  <div className="marker-elevation">
                    {formatElevation(marker.elevation)}
                  </div>
                </div>
                <div className="marker-actions">
                  <button 
                    className="marker-action-btn touch-target"
                    onClick={() => handleCenterOnMarker(marker)}
                    title="Center on map"
                  >
                    <CenterIcon />
                  </button>
                  <button 
                    className="marker-action-btn danger touch-target"
                    onClick={() => handleRemoveMarker(marker.id)}
                    title="Remove"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats Panel */}
        <div className="stats-panel">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Min</div>
              <div className="stat-value">{formatStatValue(currentStats.min)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Max</div>
              <div className="stat-value">{formatStatValue(currentStats.max)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Avg</div>
              <div className="stat-value">{formatStatValue(currentStats.avg)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Gain</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>
                +{formatStatValue(currentStats.totalGain)}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Loss</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>
                -{formatStatValue(currentStats.totalLoss)}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Points</div>
              <div className="stat-value">{currentStats.count}</div>
            </div>
          </div>
          
          {validMarkers.length >= 2 && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
              <ElevationProfile markers={markers} unit={settings.unit} />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="action-btn touch-target"
            onClick={handleMyLocation}
            title="My Location"
          >
            <LocateIcon />
          </button>
          <button 
            className="action-btn touch-target"
            onClick={handleSaveHistory}
            title="Save Session"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
          </button>
          <button 
            className="action-btn touch-target"
            onClick={handleExportGPX}
            title="Export GPX"
          >
            <DownloadIcon />
          </button>
          <button 
            className="action-btn danger touch-target"
            onClick={handleClearAll}
            title="Clear All"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHistoryModal(false)}
          >
            <motion.div 
              className="modal"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>History</h2>
                <button className="modal-close touch-target" onClick={() => setShowHistoryModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              <div className="modal-body">
                {history.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                    No saved sessions yet.
                  </p>
                ) : (
                  <div className="history-list">
                    {history.map((entry) => (
                      <div key={entry.id} className="history-item">
                        <div className="history-info">
                          <div className="history-name">{entry.name}</div>
                          <div className="history-meta">
                            {entry.markers.length} markers - {new Date(entry.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="history-actions">
                          <button 
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleLoadHistory(entry)}
                          >
                            Load
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteHistory(entry.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowHistoryModal(false)}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div 
              className="modal"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Settings</h2>
                <button className="modal-close touch-target" onClick={() => setShowSettingsModal(false)}>
                  <CloseIcon />
                </button>
              </div>
              <div className="modal-body">
                <div className="settings-section">
                  <h3>Appearance</h3>
                  <div className="setting-item">
                    <span className="setting-label">Dark Mode</span>
                    <button 
                      className="toggle-switch"
                      onClick={toggleDarkMode}
                      aria-label="Toggle dark mode"
                    >
                      <span className={`toggle-switch-thumb ${settings.darkMode ? 'active' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Map</h3>
                  <div className="setting-item">
                    <span className="setting-label">Map Type</span>
                    <select 
                      className="form-input"
                      value={settings.mapType}
                      onChange={(e) => setMapType(e.target.value as 'standard' | 'terrain' | 'satellite')}
                      style={{ width: 'auto' }}
                    >
                      <option value="standard">Standard</option>
                      <option value="terrain">Terrain</option>
                      <option value="satellite">Satellite</option>
                    </select>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Units</h3>
                  <div className="setting-item">
                    <span className="setting-label">Elevation Unit</span>
                    <select 
                      className="form-input"
                      value={settings.unit}
                      onChange={(e) => setUnit(e.target.value as 'meters' | 'feet')}
                      style={{ width: 'auto' }}
                    >
                      <option value="meters">Meters</option>
                      <option value="feet">Feet</option>
                    </select>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>About</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    <p>Elevation Detector uses real elevation data from NASA's SRTM mission via the Open-Elevation API.</p>
                    <p style={{ marginTop: '8px' }}>Maps provided by OpenStreetMap contributors.</p>
                    <p style={{ marginTop: '8px' }}>
                      <strong>Version:</strong> 1.0.0
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowSettingsModal(false)}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
