"use client";

import { useEffect, useRef, useState } from 'react';
import { MapPin, ExternalLink, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';

interface InteractiveMapProps {
  coordinates?: { lat: number; lng: number };
  locationName: string;
  businesses?: Array<{
    name: string;
    address: string;
    status: 'active' | 'closed' | 'unknown';
    distance?: string;
  }>;
  onOpenInMaps?: () => void;
}

export default function InteractiveMap({ 
  coordinates, 
  locationName, 
  businesses = [], 
  onOpenInMaps 
}: InteractiveMapProps) {
  const { theme } = useTheme();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!coordinates || !mapRef.current) {
      console.log('❌ Map initialization skipped:', { coordinates, mapRef: !!mapRef.current });
      setMapLoading(false);
      return;
    }

    console.log('🗺️ Initializing map with coordinates:', coordinates);
    console.log('📍 Location name:', locationName);

    // Load Leaflet CSS first
    const loadLeafletCSS = () => {
      if (document.querySelector('link[href*="leaflet"]')) return Promise.resolve();
      
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.onload = () => resolve(true);
        link.onerror = () => reject(false);
        document.head.appendChild(link);
      });
    };

    // Initialize map
    const initMap = async () => {
      try {
        setMapLoading(true);
        
        // Load CSS first
        await loadLeafletCSS();
        
        // Wait a bit for CSS to load
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Dynamically import Leaflet
        const L = (await import('leaflet')).default;
        
        // Fix for default markers in Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Clear existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // Create map with error handling
        if (!mapRef.current) {
          console.error('Map container ref is null');
          return;
        }

        const map = L.map(mapRef.current, {
          center: [coordinates.lat, coordinates.lng],
          zoom: 13,
          zoomControl: true,
          attributionControl: true
        });

        console.log('✅ Map created successfully at:', [coordinates.lat, coordinates.lng]);

        // Add tile layer with error handling
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
          errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2NjY2IiBmb250LXNpemU9IjE0Ij5NYXAgVGlsZSBOb3QgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg=='
        });

        tileLayer.addTo(map);

        // Add main location marker
        const mainIcon = L.divIcon({
          html: `<div style="
            width: 30px; 
            height: 30px; 
            background: linear-gradient(135deg, #10b981, #059669); 
            border: 3px solid white; 
            border-radius: 50%; 
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
          ">📍</div>`,
          className: 'custom-main-marker',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        const mainMarker = L.marker([coordinates.lat, coordinates.lng], { icon: mainIcon })
          .addTo(map)
          .bindPopup(`
            <div style="text-align: center; padding: 12px; background: ${isDark ? '#1f2937' : '#ffffff'}; color: ${isDark ? '#ffffff' : '#0f172a'}; border-radius: 8px; min-width: 200px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
              <strong style="color: #10b981; font-size: 16px;">${locationName}</strong><br>
              <small style="color: ${isDark ? '#9ca3af' : '#64748b'}; margin: 8px 0; display: block;">Business Location</small>
              <div style="background: ${isDark ? '#374151' : '#f1f5f9'}; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 12px; color: ${isDark ? '#d1d5db' : '#475569'};">
                ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}
              </div>
            </div>
          `);

        // Add business markers around the main location
        businesses.slice(0, 8).forEach((business, index) => {
          // Generate random nearby coordinates (within ~2km radius)
          const offsetLat = (Math.random() - 0.5) * 0.03;
          const offsetLng = (Math.random() - 0.5) * 0.03;
          const businessLat = coordinates.lat + offsetLat;
          const businessLng = coordinates.lng + offsetLng;

          // Choose marker color and icon based on business status
          const markerConfig = {
            active: { color: '#10b981', icon: '🏢', bgColor: '#059669' },
            closed: { color: '#ef4444', icon: '🏪', bgColor: '#dc2626' },
            unknown: { color: '#6b7280', icon: '🏬', bgColor: '#4b5563' }
          };

          const config = markerConfig[business.status] || markerConfig.unknown;

          const businessIcon = L.divIcon({
            html: `<div style="
              width: 24px; 
              height: 24px; 
              background: linear-gradient(135deg, ${config.color}, ${config.bgColor}); 
              border: 2px solid white; 
              border-radius: 50%; 
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
            ">${config.icon}</div>`,
            className: 'custom-business-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          const businessMarker = L.marker([businessLat, businessLng], { icon: businessIcon })
            .addTo(map);

          businessMarker.bindPopup(`
            <div style="padding: 12px; min-width: 250px; background: ${isDark ? '#1f2937' : '#ffffff'}; color: ${isDark ? '#ffffff' : '#0f172a'}; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 18px;">${config.icon}</span>
                <strong style="color: ${config.color}; font-size: 16px;">${business.name}</strong>
              </div>
              <div style="color: ${isDark ? '#9ca3af' : '#64748b'}; font-size: 14px; margin-bottom: 8px; line-height: 1.4;">
                📍 ${business.address}
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="
                  display: inline-block; 
                  padding: 4px 8px; 
                  border-radius: 6px; 
                  font-size: 11px; 
                  font-weight: bold;
                  background: ${config.color}20;
                  color: ${config.color};
                  border: 1px solid ${config.color}40;
                  text-transform: uppercase;
                ">
                  ${business.status}
                </span>
                ${business.distance ? `<small style="color: ${isDark ? '#9ca3af' : '#64748b'}; font-weight: 500;">📏 ${business.distance}</small>` : ''}
              </div>
            </div>
          `);
        });

        mapInstanceRef.current = map;

        // Add custom control for centering
        const CenterControl = L.Control.extend({
          onAdd: function() {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            div.style.cssText = `
              background: white;
              width: 34px;
              height: 34px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              border-radius: 4px;
              box-shadow: 0 1px 5px rgba(0,0,0,0.4);
            `;
            div.innerHTML = '🎯';
            div.title = 'Center on main location';
            
            div.onclick = function(e) {
              L.DomEvent.stopPropagation(e);
              map.setView([coordinates.lat, coordinates.lng], 13);
            };
            
            return div;
          }
        });

        new CenterControl({ position: 'topright' }).addTo(map);

        setMapLoading(false);
        setMapError(false);

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError(true);
        setMapLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, locationName, businesses, isDark]);

  if (!coordinates) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_70%)]" />
        <div className="text-center z-10">
          <MapPin className="text-emerald-400 mx-auto mb-2" size={32} />
          <p className="text-white font-bold">{locationName}</p>
          <p className="text-slate-400 text-sm">Location coordinates not available</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center relative">
        <div className="text-center z-10">
          <div className="text-red-400 mb-2">⚠️</div>
          <p className="text-white font-bold mb-2">Map Loading Error</p>
          <p className="text-slate-400 text-sm mb-4">Unable to load interactive map</p>
          <button 
            onClick={onOpenInMaps}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors text-white"
          >
            Open in Google Maps
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Loading Overlay */}
      {mapLoading && (
        <div className="absolute inset-0 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg flex items-center justify-center z-10 transition-colors duration-500">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
            <p className="text-slate-900 dark:text-white font-semibold">Loading Interactive Map...</p>
            <p className="text-slate-400 dark:text-slate-400 text-sm">Fetching location data</p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden bg-slate-800"
        style={{ minHeight: '350px' }}
      />
      
      {/* Map Controls Overlay */}
      {!mapLoading && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="bg-white/80 dark:bg-black/80 backdrop-blur-sm rounded-lg p-3 text-left border border-slate-200 dark:border-white/10 shadow-lg transition-colors duration-500">
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
                <span>Main Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-white" />
                <span>Active Businesses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-white" />
                <span>Closed Businesses</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onOpenInMaps}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors text-white shadow-lg"
          >
            <ExternalLink size={14} />
            Open in Maps
          </button>
        </div>
      )}
    </div>
  );
}