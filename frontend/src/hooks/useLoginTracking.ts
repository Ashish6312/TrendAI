"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

interface LoginTrackingData {
  user_email: string;
  session_token: string;
  provider: string;
  ip_address?: string;
  user_agent: string;
  device_info: {
    browser: string;
    os: string;
    device: string;
    screen_resolution: string;
    timezone: string;
    language: string;
  };
  location_info?: {
    country?: string;
    city?: string;
    region?: string;
    timezone?: string;
  };
  login_method: string;
}

// Helper function to detect browser
function getBrowserInfo() {
  const userAgent = navigator.userAgent;
  let browser = "Unknown";
  
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Opera")) browser = "Opera";
  
  return browser;
}

// Helper function to detect OS
function getOSInfo() {
  const userAgent = navigator.userAgent;
  let os = "Unknown";
  
  if (userAgent.includes("Windows NT")) os = "Windows";
  else if (userAgent.includes("Mac OS X")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) os = "iOS";
  
  return os;
}

// Helper function to detect device type
function getDeviceType() {
  const userAgent = navigator.userAgent;
  
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return "Tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return "Mobile";
  return "Desktop";
}

// Helper function to get location from IP and GPS
async function getLocationInfo(): Promise<any> {
  // First try to get GPS location if available and user grants permission
  if (navigator.geolocation) {
    try {
      console.log('Attempting GPS location detection...');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          reject, 
          {
            enableHighAccuracy: true,
            timeout: 8000, // Reduced timeout
            maximumAge: 600000 // 10 minutes cache
          }
        );
      });

      // Get location details from coordinates
      const { latitude, longitude } = position.coords;
      console.log(`GPS coordinates obtained: ${latitude}, ${longitude} (accuracy: ${position.coords.accuracy}m)`);
      
      try {
        // Try multiple reverse geocoding services
        const geoServices = [
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
        ];

        for (const serviceUrl of geoServices) {
          try {
            const response = await fetch(serviceUrl);
            if (response.ok) {
              const data = await response.json();
              
              let locationData;
              if (serviceUrl.includes('bigdatacloud')) {
                locationData = {
                  country: data.countryName || 'Unknown',
                  city: data.city || data.locality || 'Unknown',
                  region: data.principalSubdivision || 'Unknown',
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  ip: 'GPS Location',
                  accuracy: position.coords.accuracy,
                  coordinates: { lat: latitude, lng: longitude },
                  source: 'GPS + BigDataCloud'
                };
              } else {
                // OpenStreetMap Nominatim
                locationData = {
                  country: data.address?.country || 'Unknown',
                  city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
                  region: data.address?.state || data.address?.region || 'Unknown',
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  ip: 'GPS Location',
                  accuracy: position.coords.accuracy,
                  coordinates: { lat: latitude, lng: longitude },
                  source: 'GPS + OpenStreetMap'
                };
              }
              
              console.log('GPS location resolved:', locationData);
              return locationData;
            }
          } catch (serviceError) {
            console.log(`Geocoding service failed: ${serviceUrl}`, serviceError);
            continue;
          }
        }
      } catch (error) {
        console.log('Failed to get location from coordinates:', error);
      }
    } catch (error) {
      console.log('GPS location not available or denied:', error instanceof Error ? error.message : 'Unknown error');
    }
  } else {
    console.log('Geolocation API not supported by browser');
  }

  // Fallback to IP-based location
  console.log('Falling back to IP-based location detection...');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const services = [
    `${apiUrl}/api/utils/location`,
    'https://ipapi.co/json/',
    'https://ipwho.is',
    'https://ipinfo.io/json'
  ];

  for (const service of services) {
    try {
      console.log(`Trying location service: ${service}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(service, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        // Normalize response based on service
        let locationData;
        if (service.includes('ipapi.co')) {
          locationData = {
            country: data.country_name,
            city: data.city,
            region: data.region,
            timezone: data.timezone,
            ip: data.ip,
            source: 'IP-API'
          };
        } else if (service.includes('ipwho.is')) {
          locationData = {
            country: data.country,
            city: data.city,
            region: data.region,
            timezone: data.timezone?.name,
            ip: data.ip,
            source: 'IP-WHO'
          };
        } else if (service.includes('ipinfo.io')) {
          locationData = {
            country: data.country,
            city: data.city,
            region: data.region,
            timezone: data.timezone,
            ip: data.ip,
            source: 'IP-INFO'
          };
        } else {
          // Backend service
          locationData = {
            country: data.country,
            city: data.city,
            region: data.region,
            timezone: data.timezone,
            ip: data.ip,
            source: 'Backend'
          };
        }
        
        if (locationData.country && locationData.country !== 'Unknown') {
          console.log('IP location resolved:', locationData);
          return locationData;
        }
      }
    } catch (error) {
      console.log(`Failed to get location from ${service}:`, error instanceof Error ? error.message : 'Unknown error');
      continue;
    }
  }
  
  // Ultimate fallback
  console.log('All location services failed, using fallback');
  return {
    country: 'Unknown',
    city: 'Unknown',
    region: 'Unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ip: 'Unknown',
    source: 'Fallback'
  };
}

export function useLoginTracking() {
  const { data: session, status } = useSession();
  const hasTracked = useRef(false);

  useEffect(() => {
    const trackLogin = async () => {
      // Only track once per session and when user is authenticated
      if (status !== "authenticated" || !session?.user?.email || hasTracked.current) {
        return;
      }

      hasTracked.current = true;

      try {
        // Get location info
        const locationInfo = await getLocationInfo();
        
        // Prepare tracking data
        const trackingData: LoginTrackingData = {
          user_email: session.user.email,
          session_token: (session as any).sessionId || `client_${Date.now()}`,
          provider: "google", // Default to google since that's what we're using
          ip_address: locationInfo?.ip,
          user_agent: navigator.userAgent,
          device_info: {
            browser: getBrowserInfo(),
            os: getOSInfo(),
            device: getDeviceType(),
            screen_resolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language
          },
          location_info: locationInfo ? {
            country: locationInfo.country,
            city: locationInfo.city,
            region: locationInfo.region,
            timezone: locationInfo.timezone
          } : undefined,
          login_method: "oauth"
        };

        // Send tracking data to backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/users/login-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trackingData)
        });

        if (response.ok) {
          console.log('Login tracked successfully');
        } else {
          console.error('Failed to track login');
        }

      } catch (error) {
        console.error('Error tracking login:', error);
      }
    };

    trackLogin();
  }, [session, status]);

  return { session, status };
}