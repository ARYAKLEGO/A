export interface Coordinate {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  position: Coordinate;
  elevation: number | null;
  label: string;
  timestamp: number;
  locationName?: string;
}

export interface ElevationData {
  latitude: number;
  longitude: number;
  elevation: number;
}

export interface MapSettings {
  darkMode: boolean;
  mapType: 'standard' | 'terrain' | 'satellite';
  unit: 'meters' | 'feet';
}

export interface ElevationStats {
  min: number | null;
  max: number | null;
  avg: number | null;
  totalGain: number;
  totalLoss: number;
  count: number;
}

export interface LocationResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    [key: string]: string;
  };
}

export interface GPXTrack {
  name: string;
  description: string;
  timestamp: string;
  trackPoints: Array<{
    lat: number;
    lon: number;
    ele: number;
    time: string;
  }>;
}

export interface HistoryEntry {
  id: string;
  name: string;
  markers: MapMarker[];
  timestamp: number;
}

export type MapType = 'standard' | 'terrain' | 'satellite';

export const MAP_TYPES: Record<MapType, string> = {
  standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

export const MAP_ATTRIBUTIONS: Record<MapType, string> = {
  standard: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  terrain: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
  satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
};
