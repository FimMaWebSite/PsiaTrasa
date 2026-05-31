import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Place, SafetyAlert, LostDog } from '../types';

// Import leaflet styles
import 'leaflet/dist/leaflet.css';

interface MapProps {
  places: Place[];
  alerts: SafetyAlert[];
  lostDogs: LostDog[];
  selectedPlace: Place | null;
  selectedAlert: SafetyAlert | null;
  selectedLostDog: LostDog | null;
  onSelectPlace: (place: Place) => void;
  onSelectAlert: (alert: SafetyAlert) => void;
  onSelectLostDog: (dog: LostDog) => void;
  isDrawingRoute: boolean;
  drawingPoints: [number, number][];
  onAddDrawingPoint: (point: [number, number]) => void;
  onClickMapToAddSpot: (lat: number, lng: number) => void;
  activeFilters: string[];
  searchTerm: string;
  categoryTab: string;
  triggerUserLocate: number;
}

export const Map: React.FC<MapProps> = ({
  places,
  alerts,
  lostDogs,
  selectedPlace,
  selectedAlert,
  selectedLostDog,
  onSelectPlace,
  onSelectAlert,
  onSelectLostDog,
  isDrawingRoute,
  drawingPoints,
  onAddDrawingPoint,
  onClickMapToAddSpot,
  activeFilters,
  searchTerm,
  categoryTab,
  triggerUserLocate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const drawingLayerRef = useRef<L.Polyline | null>(null);
  const itemRefs = useRef<Record<string, L.Marker | L.Polyline>>({});

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default center on Wrocław, Poland
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([51.1079, 17.0385], 13);

    // CartoDB Voyager tiles (better greens and contrast)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({
      position: 'bottomright',
    }).addTo(map);

    mapRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Try to get user geolocated position
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 14);
          
          // Add marker for user location
          const userIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div style="
                width: 18px; 
                height: 18px; 
                background: #10b981; 
                border: 3px solid #fff; 
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
              "></div>
            `,
            iconSize: [18, 18],
          });
          L.marker([latitude, longitude], { icon: userIcon }).addTo(map);
        },
        () => console.log('Geolocation permission denied or error.')
      );
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Trigger GPS Centering from Parent Button
  useEffect(() => {
    if (triggerUserLocate === 0 || !mapRef.current) return;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          mapRef.current?.flyTo([latitude, longitude], 15, { animate: true, duration: 1.5 });
        },
        () => alert('Błąd lokalizacji GPS lub brak uprawnień. Upewnij się, że lokalizacja w przeglądarce jest włączona.')
      );
    }
  }, [triggerUserLocate]);

  // Handle map clicks (for adding spot or drawing routes)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      if (isDrawingRoute) {
        onAddDrawingPoint([lat, lng]);
      } else {
        onClickMapToAddSpot(lat, lng);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [isDrawingRoute, onAddDrawingPoint, onClickMapToAddSpot]);

  // Draw temporary polyline when drawing route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (drawingLayerRef.current) {
      drawingLayerRef.current.remove();
      drawingLayerRef.current = null;
    }

    if (isDrawingRoute && drawingPoints.length > 0) {
      drawingLayerRef.current = L.polyline(drawingPoints, {
        color: '#8b5cf6',
        weight: 4,
        dashArray: '5, 10',
        lineCap: 'round',
      }).addTo(map);
    }
  }, [drawingPoints, isDrawingRoute]);

  // Update Markers (Places, Alerts, LostDogs)
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    itemRefs.current = {};

    // 1. Render Places
    places.forEach((place) => {
      // Apply filters if any are active
      if (activeFilters.length > 0) {
        const matchesFilters = activeFilters.every(filter => {
          if (filter === 'ogrodzony') return place.tags.includes('ogrodzony');
          if (filter === 'woda') return place.tags.includes('woda');
          if (filter === 'cień') return place.tags.includes('cień');
          if (filter === 'oświetlenie') return place.tags.includes('oświetlenie');
          if (filter === 'route') return place.type === 'route';
          if (filter === 'enclosure') return place.type === 'enclosure';
          if (filter === 'vet') return place.type === 'vet';
          return true;
        });
        if (!matchesFilters) return;
      }

      // Category tab filtering
      if (categoryTab !== 'all') {
        if (categoryTab === 'enclosure' && place.type !== 'enclosure') return;
        if (categoryTab === 'park' && place.type !== 'park') return;
        if (categoryTab === 'water' && place.type !== 'water') return;
        if (categoryTab === 'route' && place.type !== 'route') return;
      }

      // Search term filtering
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesSearch = place.name.toLowerCase().includes(query) || 
                              place.description.toLowerCase().includes(query);
        if (!matchesSearch) return;
      }

      // Icon Selector based on type
      let emoji = '🌲';
      if (place.type === 'enclosure') emoji = '🦮';
      if (place.type === 'water') emoji = '🌊';
      if (place.type === 'cafe') emoji = '☕';
      if (place.type === 'vet') emoji = '🩺';
      if (place.type === 'route') emoji = '🥾';

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="marker-pin ${place.type}">
            <span class="marker-inner">${emoji}</span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const marker = L.marker([place.lat, place.lng], { icon: customIcon });
      
      const popupHtml = `
        <div class="custom-leaflet-popup">
          <strong class="popup-title">${place.name}</strong>
          <p class="popup-desc">${place.description.substring(0, 80)}...</p>
          <div class="popup-actions">
            <a href="https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}" target="_blank" rel="noopener noreferrer" class="popup-nav-btn">
              🗺️ Nawiguj w Google Maps
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { minWidth: 200 });
      marker.on('click', () => onSelectPlace(place));
      layer.addLayer(marker);
      itemRefs.current[place.id] = marker;

      // If it is a route/trail, draw its complete polyline
      if (place.type === 'route' && place.routePoints) {
        const polyline = L.polyline(place.routePoints, {
          color: '#8b5cf6',
          weight: 4,
          opacity: 0.8,
        });
        polyline.on('click', () => onSelectPlace(place));
        layer.addLayer(polyline);
      }
    });

    // 2. Render Safety Alerts (Active only)
    alerts.forEach((alert) => {
      if (alert.resolved) return;

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="marker-pin alert">
            <span class="marker-inner">⚠️</span>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([alert.lat, alert.lng], { icon: customIcon });
      marker.on('click', () => onSelectAlert(alert));
      
      const popupHtml = `
        <div class="custom-leaflet-popup">
          <strong class="popup-title" style="color: #ef4444;">⚠️ Zagrożenie!</strong>
          <p class="popup-desc">${alert.description}</p>
        </div>
      `;
      marker.bindPopup(popupHtml, { minWidth: 200 });
      layer.addLayer(marker);
      itemRefs.current[alert.id] = marker;
    });

    // 3. Render Lost Dog Alerts (Active only)
    lostDogs.forEach((dog) => {
      if (dog.resolved) return;

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="marker-pin lost">
            <span class="marker-inner">🚨</span>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
      });

      const marker = L.marker([dog.lat, dog.lng], { icon: customIcon });
      marker.on('click', () => onSelectLostDog(dog));

      const popupHtml = `
        <div class="custom-leaflet-popup">
          <strong class="popup-title" style="color: #dc2626;">🚨 Zaginął ${dog.dogName}!</strong>
          <p class="popup-desc">${dog.description}</p>
          <div class="popup-actions">
            <a href="tel:${dog.contactPhone}" class="popup-nav-btn" style="background-color: #dc2626;">
              📞 Zadzwoń: ${dog.contactPhone}
            </a>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml, { minWidth: 200 });
      layer.addLayer(marker);
      itemRefs.current[dog.id] = marker;
    });
  }, [places, alerts, lostDogs, activeFilters, searchTerm, categoryTab, onSelectPlace, onSelectAlert, onSelectLostDog]);

  // Center Map & Open Popup on Selected Item
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedPlace) {
      map.flyTo([selectedPlace.lat, selectedPlace.lng], 15, { animate: true, duration: 1.5 });
      const marker = itemRefs.current[selectedPlace.id];
      if (marker && marker instanceof L.Marker) {
        marker.openPopup();
      }
    } else if (selectedAlert) {
      map.flyTo([selectedAlert.lat, selectedAlert.lng], 15, { animate: true, duration: 1.5 });
      const marker = itemRefs.current[selectedAlert.id];
      if (marker && marker instanceof L.Marker) {
        marker.openPopup();
      }
    } else if (selectedLostDog) {
      map.flyTo([selectedLostDog.lat, selectedLostDog.lng], 15, { animate: true, duration: 1.5 });
      const marker = itemRefs.current[selectedLostDog.id];
      if (marker && marker instanceof L.Marker) {
        marker.openPopup();
      }
    }
  }, [selectedPlace, selectedAlert, selectedLostDog]);

  return <div id="map" ref={mapContainerRef} />;
};
