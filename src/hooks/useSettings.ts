import { useState, useEffect, useCallback } from 'react';
import type { MapSettings } from '../types';
import { loadSettings, saveSettings } from '../lib/storage';

export interface SettingsHookResult {
  settings: MapSettings;
  updateSettings: (newSettings: Partial<MapSettings>) => void;
  toggleDarkMode: () => void;
  setMapType: (type: 'standard' | 'terrain' | 'satellite') => void;
  setUnit: (unit: 'meters' | 'feet') => void;
}

export function useSettings(): SettingsHookResult {
  const [settings, setSettings] = useState<MapSettings>(() => loadSettings());

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = loadSettings();
    setSettings(savedSettings);
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSettings = useCallback((newSettings: Partial<MapSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      darkMode: !prev.darkMode,
    }));
  }, []);

  const setMapType = useCallback((type: 'standard' | 'terrain' | 'satellite') => {
    setSettings(prev => ({
      ...prev,
      mapType: type,
    }));
  }, []);

  const setUnit = useCallback((unit: 'meters' | 'feet') => {
    setSettings(prev => ({
      ...prev,
      unit,
    }));
  }, []);

  return {
    settings,
    updateSettings,
    toggleDarkMode,
    setMapType,
    setUnit,
  };
}

export default useSettings;
