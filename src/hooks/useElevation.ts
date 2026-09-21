import { useState, useCallback } from 'react';
import type { MapMarker, ElevationStats } from '../types';
import { getElevationWithRetry, formatElevation, metersToFeet } from '../lib/elevation';
import { reverseGeocode } from '../lib/geocoding';

export interface ElevationHookResult {
  stats: ElevationStats;
  fetchElevationForMarker: (marker: MapMarker, unit: 'meters' | 'feet') => Promise<MapMarker>;
  fetchElevationForAllMarkers: (markers: MapMarker[], unit: 'meters' | 'feet') => Promise<MapMarker[]>;
  calculateStats: (markers: MapMarker[], unit: 'meters' | 'feet') => ElevationStats;
}

export function useElevation(): ElevationHookResult {
  const [stats, setStats] = useState<ElevationStats>({
    min: null,
    max: null,
    avg: null,
    totalGain: 0,
    totalLoss: 0,
    count: 0,
  });

  const fetchElevationForMarker = useCallback(async (
    marker: MapMarker,
    unit: 'meters' | 'feet'
  ): Promise<MapMarker> => {
    const elevation = await getElevationWithRetry(marker.position);
    const locationName = await reverseGeocode(marker.position);

    return {
      ...marker,
      elevation,
      locationName,
    };
  }, []);

  const fetchElevationForAllMarkers = useCallback(async (
    markers: MapMarker[],
    unit: 'meters' | 'feet'
  ): Promise<MapMarker[]> => {
    const updatedMarkers = await Promise.all(
      markers.map(marker => fetchElevationForMarker(marker, unit))
    );

    // Calculate and update stats
    const newStats = calculateStats(updatedMarkers, unit);
    setStats(newStats);

    return updatedMarkers;
  }, [fetchElevationForMarker]);

  const calculateStats = useCallback((
    markers: MapMarker[],
    unit: 'meters' | 'feet' = 'meters'
  ): ElevationStats => {
    const validMarkers = markers.filter(m => m.elevation !== null);

    if (validMarkers.length === 0) {
      return {
        min: null,
        max: null,
        avg: null,
        totalGain: 0,
        totalLoss: 0,
        count: 0,
      };
    }

    const elevations = validMarkers.map(m => {
      const elevation = m.elevation!;
      return unit === 'feet' ? metersToFeet(elevation) : elevation;
    });

    const min = Math.min(...elevations);
    const max = Math.max(...elevations);
    const sum = elevations.reduce((a, b) => a + b, 0);
    const avg = sum / elevations.length;

    // Calculate gain/loss between consecutive points
    let totalGain = 0;
    let totalLoss = 0;

    for (let i = 1; i < validMarkers.length; i++) {
      const prevElevation = validMarkers[i - 1].elevation!;
      const currElevation = validMarkers[i].elevation!;
      const prev = unit === 'feet' ? metersToFeet(prevElevation) : prevElevation;
      const curr = unit === 'feet' ? metersToFeet(currElevation) : currElevation;
      const change = curr - prev;

      if (change > 0) {
        totalGain += change;
      } else {
        totalLoss += Math.abs(change);
      }
    }

    return {
      min,
      max,
      avg,
      totalGain,
      totalLoss,
      count: validMarkers.length,
    };
  }, []);

  return {
    stats,
    fetchElevationForMarker,
    fetchElevationForAllMarkers,
    calculateStats,
  };
}

export default useElevation;
