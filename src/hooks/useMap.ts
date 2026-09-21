import { useState, useEffect, useCallback, useRef } from 'react';
import L from 'leaflet';
import type { Coordinate, MapMarker, MapType } from '../types';
import { MAP_TYPES, MAP_ATTRIBUTIONS } from '../types';

// Custom icon for numbered pins
function createNumberedIcon(number: number): L.DivIcon {
  return L.divIcon({
    html: `<div style="background: #ff4444; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">${number}</div>`,
    className: 'numbered-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export interface MapHookResult {
  mapRef: React.RefObject<HTMLDivElement | null>;
  mapInstance: L.Map | null;
  markers: MapMarker[];
  addMarker: (coord: Coordinate, label?: string) => Promise<MapMarker | null>;
  removeMarker: (id: string) => void;
  clearAllMarkers: () => void;
  updateMarkerElevation: (id: string, elevation: number) => void;
  centerMap: (coord: Coordinate, zoom?: number) => void;
  changeMapType: (type: MapType) => void;
  getCurrentCenter: () => Coordinate | null;
  fitToMarkers: () => void;
}

export function useMap(initialMarkers: MapMarker[] = []): MapHookResult {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>(initialMarkers);
  const [mapType, setMapType] = useState<MapType>('standard');
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Check if map already exists
    if (mapInstance) return;

    const map = L.map(mapRef.current, {
      center: [0, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 19,
      attributionControl: false,
    });

    // Add attribution control
    map.attributionControl.setPrefix('');

    // Add tile layer
    updateTileLayer(map, mapType);

    // Handle map click
    // Click handler will be managed by parent component

    // Handle map move
    // Update center if needed

    setMapInstance(map);

    // Cleanup
    return () => {
      map.remove();
    };
  }, [mapRef.current, mapInstance]);

  // Update tile layer when map type changes
  useEffect(() => {
    if (!mapInstance) return;
    updateTileLayer(mapInstance, mapType);
  }, [mapInstance, mapType]);

  // Update markers on map when markers state changes
  useEffect(() => {
    if (!mapInstance) return;

    // Clear existing markers
    markerRefs.current.forEach(marker => mapInstance.removeLayer(marker));
    markerRefs.current.clear();

    // Add new markers
    markers.forEach((marker, index) => {
      const leafletMarker = L.marker([marker.position.lat, marker.position.lng], {
        icon: createNumberedIcon(index + 1),
        zIndexOffset: 1000,
      }).addTo(mapInstance);

      // Add popup
      const popupContent = createPopupContent(marker);
      leafletMarker.bindPopup(popupContent);

      // Open popup on click
      leafletMarker.on('click', () => {
        leafletMarker.openPopup();
      });

      markerRefs.current.set(marker.id, leafletMarker);
    });

    // Fit map to markers if there are any
    if (markers.length > 0) {
      const bounds = L.latLngBounds(
        markers.map(m => [m.position.lat, m.position.lng] as [number, number])
      );
      mapInstance.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [mapInstance, markers]);

  const updateTileLayer = useCallback((map: L.Map, type: MapType) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileLayer = L.tileLayer(MAP_TYPES[type], {
      attribution: MAP_ATTRIBUTIONS[type],
    }).addTo(map);

    tileLayerRef.current = tileLayer;
  }, []);

  const createPopupContent = useCallback((marker: MapMarker): string => {
    const elevationText = marker.elevation !== null
      ? `<div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">Elevation: ${Math.round(marker.elevation)} m</div>`
      : '<div style="font-size: 16px; color: #666;">Loading elevation...</div>';

    const locationText = marker.locationName
      ? `<div style="font-size: 14px; color: #666; margin-top: 8px;">${marker.locationName}</div>`
      : '';

    return `
      <div style="min-width: 180px; padding: 8px;">
        <div style="font-size: 14px; font-weight: bold; margin-bottom: 4px;">${marker.label}</div>
        <div style="font-size: 12px; color: #888; margin-bottom: 8px;">
          Lat: ${marker.position.lat.toFixed(6)}, Lng: ${marker.position.lng.toFixed(6)}
        </div>
        ${elevationText}
        ${locationText}
      </div>
    `;
  }, []);

  const addMarker = useCallback(async (coord: Coordinate, label?: string): Promise<MapMarker | null> => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newMarker: MapMarker = {
      id,
      position: coord,
      elevation: null,
      label: label || `Point ${markers.length + 1}`,
      timestamp: Date.now(),
    };

    setMarkers(prev => [...prev, newMarker]);
    return newMarker;
  }, [markers.length]);

  const removeMarker = useCallback((id: string) => {
    setMarkers(prev => prev.filter(m => m.id !== id));
  }, []);

  const clearAllMarkers = useCallback(() => {
    setMarkers([]);
  }, []);

  const updateMarkerElevation = useCallback((id: string, elevation: number) => {
    setMarkers(prev =>
      prev.map(m =>
        m.id === id ? { ...m, elevation } : m
      )
    );
  }, []);

  const centerMap = useCallback((coord: Coordinate, zoom: number = 15) => {
    if (!mapInstance) return;
    mapInstance.setView([coord.lat, coord.lng], zoom);
  }, [mapInstance]);

  const changeMapType = useCallback((type: MapType) => {
    setMapType(type);
  }, []);

  const getCurrentCenter = useCallback((): Coordinate | null => {
    if (!mapInstance) return null;
    const center = mapInstance.getCenter();
    return { lat: center.lat, lng: center.lng };
  }, [mapInstance]);

  const fitToMarkers = useCallback(() => {
    if (!mapInstance || markers.length === 0) return;
    const bounds = L.latLngBounds(
      markers.map(m => [m.position.lat, m.position.lng] as [number, number])
    );
    mapInstance.fitBounds(bounds, { padding: [50, 50] });
  }, [mapInstance, markers]);

  return {
    mapRef,
    mapInstance,
    markers,
    addMarker,
    removeMarker,
    clearAllMarkers,
    updateMarkerElevation,
    centerMap,
    changeMapType,
    getCurrentCenter,
    fitToMarkers,
  };
}

export default useMap;
