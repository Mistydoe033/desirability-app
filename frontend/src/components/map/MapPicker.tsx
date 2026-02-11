import { Box, Typography } from '@mui/material';
import { useEffect, useRef } from 'react';
import { Coordinates } from '../../types';

declare global {
  interface Window {
    L?: {
      map: (element: HTMLElement) => {
        setView: (coordinates: [number, number], zoom: number) => unknown;
        on: (
          event: string,
          callback: (event: { latlng: { lat?: number; lng?: number; latitude?: number; longitude?: number } }) => void
        ) => void;
        remove: () => void;
      };
      tileLayer: (template: string, options: Record<string, unknown>) => { addTo: (map: unknown) => void };
      marker: (coordinates: [number, number]) => { addTo: (map: unknown) => unknown; setLatLng: (coords: [number, number]) => void };
    };
  }
}

interface MapPickerProps {
  center: Coordinates;
  selectedSpot: Coordinates | null;
  onSelectSpot: (spot: Coordinates) => void;
}

export function MapPicker({ center, selectedSpot, onSelectSpot }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<unknown | null>(null);
  const markerRef = useRef<ReturnType<NonNullable<typeof window.L>['marker']> | null>(null);

  useEffect(() => {
    if (!window.L || !mapRef.current || mapInstanceRef.current) {
      return;
    }

    const map = window.L.map(mapRef.current);
    map.setView([center.latitude, center.longitude], 8);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', (event) => {
      const latitude = Number.isFinite(event.latlng.lat) ? event.latlng.lat : event.latlng.latitude;
      const longitude = Number.isFinite(event.latlng.lng) ? event.latlng.lng : event.latlng.longitude;

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return;
      }

      onSelectSpot({
        latitude,
        longitude
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [center.latitude, center.longitude, onSelectSpot]);

  useEffect(() => {
    if (!window.L || !mapInstanceRef.current) {
      return;
    }

    if (selectedSpot) {
      if (!markerRef.current) {
        markerRef.current = window.L.marker([selectedSpot.latitude, selectedSpot.longitude]);
        markerRef.current.addTo(mapInstanceRef.current);
      } else {
        markerRef.current.setLatLng([selectedSpot.latitude, selectedSpot.longitude]);
      }
    }
  }, [selectedSpot]);

  if (!window.L) {
    return <Typography color="text.secondary">Map engine unavailable.</Typography>;
  }

  return <Box ref={mapRef} sx={{ width: '100%', height: 360, borderRadius: 2, overflow: 'hidden' }} />;
}
