import type { MapMarker, HistoryEntry, MapSettings } from '../types';

const MARKERS_KEY = 'elevation_detector_markers';
const HISTORY_KEY = 'elevation_detector_history';
const SETTINGS_KEY = 'elevation_detector_settings';

/**
 * Save markers to localStorage
 */
export function saveMarkers(markers: MapMarker[]): void {
  try {
    const serialized = JSON.stringify(markers);
    localStorage.setItem(MARKERS_KEY, serialized);
  } catch (error) {
    console.error('Error saving markers:', error);
  }
}

/**
 * Load markers from localStorage
 */
export function loadMarkers(): MapMarker[] {
  try {
    const serialized = localStorage.getItem(MARKERS_KEY);
    if (!serialized) return [];
    
    const markers = JSON.parse(serialized) as MapMarker[];
    return markers || [];
  } catch (error) {
    console.error('Error loading markers:', error);
    return [];
  }
}

/**
 * Clear all markers
 */
export function clearMarkers(): void {
  try {
    localStorage.removeItem(MARKERS_KEY);
  } catch (error) {
    console.error('Error clearing markers:', error);
  }
}

/**
 * Save history entry
 */
export function saveHistory(entry: HistoryEntry): void {
  try {
    const existing = loadHistory();
    const updated = [...existing, entry];
    const serialized = JSON.stringify(updated);
    localStorage.setItem(HISTORY_KEY, serialized);
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

/**
 * Load all history entries
 */
export function loadHistory(): HistoryEntry[] {
  try {
    const serialized = localStorage.getItem(HISTORY_KEY);
    if (!serialized) return [];
    
    const history = JSON.parse(serialized) as HistoryEntry[];
    return history || [];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
}

/**
 * Delete a history entry
 */
export function deleteHistoryEntry(id: string): void {
  try {
    const existing = loadHistory();
    const updated = existing.filter(entry => entry.id !== id);
    const serialized = JSON.stringify(updated);
    localStorage.setItem(HISTORY_KEY, serialized);
  } catch (error) {
    console.error('Error deleting history entry:', error);
  }
}

/**
 * Save app settings
 */
export function saveSettings(settings: MapSettings): void {
  try {
    const serialized = JSON.stringify(settings);
    localStorage.setItem(SETTINGS_KEY, serialized);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Load app settings
 */
export function loadSettings(): MapSettings {
  try {
    const serialized = localStorage.getItem(SETTINGS_KEY);
    if (!serialized) {
      return {
        darkMode: false,
        mapType: 'standard',
        unit: 'meters',
      };
    }
    
    const settings = JSON.parse(serialized) as MapSettings;
    return {
      darkMode: settings.darkMode ?? false,
      mapType: settings.mapType ?? 'standard',
      unit: settings.unit ?? 'meters',
    };
  } catch (error) {
    console.error('Error loading settings:', error);
    return {
      darkMode: false,
      mapType: 'standard',
      unit: 'meters',
    };
  }
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Clear all data
 */
export function clearAllData(): void {
  try {
    localStorage.removeItem(MARKERS_KEY);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
}
