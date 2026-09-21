import type { Coordinate, ElevationData } from '../types';

const OPEN_ELEVATION_API = 'https://api.open-elevation.com/api/v1/lookup';

const METERS_TO_FEET = 3.28084;

/**
 * Get elevation for a single coordinate
 */
export async function getElevation(coord: Coordinate, retries: number = 3): Promise<number | null> {
  try {
    const response = await fetch(`${OPEN_ELEVATION_API}?locations=${coord.lat},${coord.lng}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return null;
    }
    
    return data.results[0].elevation;
  } catch (error) {
    console.error('Error fetching elevation:', error);
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getElevation(coord, retries - 1);
    }
    return null;
  }
}

/**
 * Get elevation for multiple coordinates at once
 */
export async function getBulkElevations(coords: Coordinate[]): Promise<(ElevationData | null)[]> {
  if (coords.length === 0) return [];
  
  try {
    const locations = coords.map(c => `${c.lat},${c.lng}`).join('|');
    const response = await fetch(`${OPEN_ELEVATION_API}?locations=${locations}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return coords.map(() => null);
    }
    
    return data.results.map((result: { latitude: number; longitude: number; elevation: number }, index: number) => ({
      latitude: result.latitude,
      longitude: result.longitude,
      elevation: result.elevation,
    }));
  } catch (error) {
    console.error('Error fetching bulk elevations:', error);
    return coords.map(() => null);
  }
}

/**
 * Format elevation value with unit
 */
export function formatElevation(elevation: number | null, unit: 'meters' | 'feet' = 'meters'): string {
  if (elevation === null) return 'Unknown';
  
  const value = unit === 'feet' ? elevation * METERS_TO_FEET : elevation;
  const rounded = Math.round(value);
  
  return `${rounded} ${unit === 'feet' ? 'ft' : 'm'}`;
}

/**
 * Convert elevation from meters to feet
 */
export function metersToFeet(meters: number): number {
  return meters * METERS_TO_FEET;
}

/**
 * Convert elevation from feet to meters
 */
export function feetToMeters(feet: number): number {
  return feet / METERS_TO_FEET;
}

/**
 * Calculate elevation change between two points
 */
export function calculateElevationChange(
  from: number | null,
  to: number | null
): { gain: number; loss: number; change: number } {
  if (from === null || to === null) {
    return { gain: 0, loss: 0, change: 0 };
  }
  
  const change = to - from;
  const gain = Math.max(0, change);
  const loss = Math.max(0, -change);
  
  return { gain, loss, change };
}

/**
 * Get elevation with retry logic
 */
export async function getElevationWithRetry(coord: Coordinate, maxRetries: number = 3): Promise<number | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await getElevation(coord, maxRetries - attempt);
    if (result !== null) {
      return result;
    }
    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
  }
  return null;
}
