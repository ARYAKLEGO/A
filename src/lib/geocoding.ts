import type { Coordinate, LocationResult } from '../types';

const NOMINATIM_API = 'https://nominatim.openstreetmap.org';

/**
 * Search for a location by name
 */
export async function searchLocation(query: string, limit: number = 5): Promise<LocationResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: limit.toString(),
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_API}/search?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error searching location:', error);
    return [];
  }
}

/**
 * Reverse geocode - get location name from coordinates
 */
export async function reverseGeocode(coord: Coordinate): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: coord.lat.toString(),
      lon: coord.lng.toString(),
      format: 'json',
      zoom: '16',
      addressdetails: '1',
    });

    const response = await fetch(`${NOMINATIM_API}/reverse?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.display_name) {
      return data.display_name;
    }

    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

/**
 * Get coordinates from a location result
 */
export function getCoordinates(result: LocationResult): Coordinate {
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
  };
}

/**
 * Debounce function for search input
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Get a simple name from display name
 */
export function getSimpleName(displayName: string): string {
  const parts = displayName.split(',');
  return parts[0]?.trim() || displayName;
}
