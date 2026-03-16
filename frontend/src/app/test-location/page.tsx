"use client";

import { useState, useEffect } from 'react';
import { MapPin, Globe, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function TestLocationPage() {
  const [locationData, setLocationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testGPSLocation = async () => {
    setLoading(true);
    setError(null);
    setLocationData(null);
    setLogs([]);
    
    addLog('Starting GPS location detection...');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      addLog('ERROR: Geolocation API not supported');
      setLoading(false);
      return;
    }

    try {
      addLog('Requesting GPS permission...');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 600000
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;
      addLog(`GPS coordinates obtained: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);

      // Try reverse geocoding
      addLog('Attempting reverse geocoding...');
      const geoServices = [
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
      ];

      for (const serviceUrl of geoServices) {
        try {
          addLog(`Trying service: ${serviceUrl.split('?')[0]}`);
          const response = await fetch(serviceUrl);
          if (response.ok) {
            const data = await response.json();
            
            let locationResult;
            if (serviceUrl.includes('bigdatacloud')) {
              locationResult = {
                country: data.countryName || 'Unknown',
                city: data.city || data.locality || 'Unknown',
                region: data.principalSubdivision || 'Unknown',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                coordinates: { lat: latitude, lng: longitude },
                accuracy: accuracy,
                source: 'GPS + BigDataCloud'
              };
            } else {
              locationResult = {
                country: data.address?.country || 'Unknown',
                city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
                region: data.address?.state || data.address?.region || 'Unknown',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                coordinates: { lat: latitude, lng: longitude },
                accuracy: accuracy,
                source: 'GPS + OpenStreetMap'
              };
            }
            
            addLog(`Location resolved: ${locationResult.city}, ${locationResult.country}`);
            setLocationData(locationResult);
            setLoading(false);
            return;
          }
        } catch (serviceError: any) {
          addLog(`Service failed: ${serviceError.message}`);
          continue;
        }
      }
      
      // If reverse geocoding fails, still show coordinates
      setLocationData({
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        coordinates: { lat: latitude, lng: longitude },
        accuracy: accuracy,
        source: 'GPS Only'
      });
      addLog('Reverse geocoding failed, showing coordinates only');
      
    } catch (gpsError: any) {
      addLog(`GPS error: ${gpsError.message}`);
      setError(`GPS Error: ${gpsError.message}`);
      
      // Fallback to IP-based location
      addLog('Falling back to IP-based location...');
      try {
        const response = await fetch('http://localhost:8000/api/utils/location');
        if (response.ok) {
          const ipLocation = await response.json();
          addLog(`IP location: ${ipLocation.city}, ${ipLocation.country}`);
          setLocationData({
            ...ipLocation,
            source: 'IP Fallback'
          });
        }
      } catch (ipError: any) {
        addLog(`IP location failed: ${ipError.message}`);
        setError(`Both GPS and IP location failed: ${gpsError.message}`);
      }
    }
    
    setLoading(false);
  };

  const testIPLocation = async () => {
    setLoading(true);
    setError(null);
    setLocationData(null);
    setLogs([]);
    
    addLog('Testing IP-based location detection...');
    
    try {
      const response = await fetch('http://localhost:8000/api/utils/location');
      if (response.ok) {
        const data = await response.json();
        addLog(`IP location resolved: ${data.city}, ${data.country}`);
        setLocationData({
          ...data,
          source: 'IP Detection'
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      addLog(`IP location failed: ${error.message}`);
      setError(`IP Location Error: ${error.message}`);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Location Detection Test
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Test GPS and IP-based location detection functionality
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={testGPSLocation}
            disabled={loading}
            className="flex items-center justify-center gap-3 p-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-colors font-semibold"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
            Test GPS Location
          </button>

          <button
            onClick={testIPLocation}
            disabled={loading}
            className="flex items-center justify-center gap-3 p-6 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl transition-colors font-semibold"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Globe size={20} />}
            Test IP Location
          </button>
        </div>

        {/* Results */}
        {locationData && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle size={20} className="text-green-500" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Location Detected
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Country</p>
                <p className="font-semibold text-slate-900 dark:text-white">{locationData.country}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">City</p>
                <p className="font-semibold text-slate-900 dark:text-white">{locationData.city}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Region</p>
                <p className="font-semibold text-slate-900 dark:text-white">{locationData.region}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Source</p>
                <p className="font-semibold text-slate-900 dark:text-white">{locationData.source}</p>
              </div>
              {locationData.coordinates && (
                <>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Latitude</p>
                    <p className="font-mono text-slate-900 dark:text-white">{locationData.coordinates.lat.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Longitude</p>
                    <p className="font-mono text-slate-900 dark:text-white">{locationData.coordinates.lng.toFixed(6)}</p>
                  </div>
                </>
              )}
              {locationData.accuracy && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Accuracy</p>
                  <p className="font-semibold text-slate-900 dark:text-white">{locationData.accuracy}m</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={20} className="text-red-500" />
              <h2 className="text-lg font-semibold text-red-900 dark:text-red-100">Error</h2>
            </div>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-6 border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Debug Logs</h2>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <p key={index} className="text-sm font-mono text-green-400">
                  {log}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}