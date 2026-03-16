"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSubscription } from "./SubscriptionContext";
// import { queueNotification, getRateLimitStatus } from "../utils/apiRateLimiter";

export interface Notification {
  id: string;
  type: 'payment' | 'analysis' | 'profile' | 'system' | 'market' | 'alert' | 'local' | 'trending' | 'location';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: {
    paymentId?: string;
    analysisId?: string;
    region?: string;
    location?: string;
    businessType?: string;
    amount?: number;
    planName?: string;
    recommendationCount?: number;
    country?: string;
    city?: string;
    currency?: string;
    localTrend?: string;
    marketGrowth?: string;
    competitorCount?: number;
    investmentRange?: string;
    coordinates?: { lat: number; lng: number };
    detection_method?: string;
    profile_completion?: number;
    updated_at?: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  userLocation: { country: string; city: string; currency: string } | null;
  // rateLimitStatus: { requestsThisMinute: number; requestsThisHour: number; canMakeRequest: boolean } | null;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  refreshLocation: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { plan, isSubscribed } = useSubscription();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userLocation, setUserLocation] = useState<{ country: string; city: string; currency: string } | null>(null);
  // const [rateLimitStatus, setRateLimitStatus] = useState<{ requestsThisMinute: number; requestsThisHour: number; canMakeRequest: boolean } | null>(null);

  // Update rate limit status periodically - COMMENTED OUT
  // useEffect(() => {
  //   if (!session?.user?.email) return;

  //   const updateRateLimit = () => {
  //     if (!session?.user?.email) return;
  //     const status = getRateLimitStatus(session.user.email);
  //     setRateLimitStatus(status);
  //   };

  //   updateRateLimit();
  //   const interval = setInterval(updateRateLimit, 10000); // Update every 10 seconds

  //   return () => clearInterval(interval);
  // }, [session?.user?.email]);

  // Get user's location on mount with improved detection
  useEffect(() => {
    let watchId: number | undefined;
    
    // Clear any cached location with just country codes or unknown locations
    const cachedLocation = localStorage.getItem('user_location_data');
    if (cachedLocation) {
      try {
        const parsed = JSON.parse(cachedLocation);
        if (parsed.country && (parsed.country.length === 2 || parsed.country === 'Unknown' || parsed.city === 'Unknown')) {
          localStorage.removeItem('user_location_data');
          localStorage.removeItem('user_location_timestamp');
        }
      } catch (error) {
        localStorage.removeItem('user_location_data');
        localStorage.removeItem('user_location_timestamp');
      }
    }
    
    const initLocation = async () => {
      watchId = await getUserLocation() as any;
    };

    initLocation();

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const getUserLocation = async () => {
    try {
      // Check if we have cached location data (valid for 15 minutes for more frequent updates)
      const cachedLocation = localStorage.getItem('user_location_data');
      const cacheTimestamp = localStorage.getItem('user_location_timestamp');
      
      if (cachedLocation && cacheTimestamp) {
        const cacheAge = Date.now() - parseInt(cacheTimestamp);
        if (cacheAge < 15 * 60 * 1000) { // 15 minutes cache
          const parsed = JSON.parse(cachedLocation);
          // Only use cache if it has valid data
          if (parsed.country && parsed.country !== 'Unknown' && parsed.country.length > 2) {
            setUserLocation(parsed);
            return;
          }
        }
      }

      console.log('Fetching fresh location data...');

      // Setup real-time GPS watching if supported
      if (typeof window !== 'undefined' && navigator.geolocation) {
        console.log('Initializing real-time GPS tracking...');
        
        const handleSuccess = async (position: GeolocationPosition) => {
          const { latitude, longitude } = position.coords;
          console.log(`GPS Update: ${latitude}, ${longitude}`);
          
          // Reverse geocode if coordinates changed significantly or first time
          try {
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            if (response.ok) {
              const data = await response.json();
              const newLocation = {
                country: data.countryName || 'Unknown',
                city: data.locality || data.city || 'Unknown',
                area: data.localityInfo?.administrative?.[3]?.name || '',
                currency: getCurrencyByCountry(data.countryName || 'Unknown'),
                coordinates: { latitude, longitude },
                timestamp: Date.now()
              };

              const finalLocation = {
                ...newLocation,
                city: newLocation.area && newLocation.area !== newLocation.city ? `${newLocation.area}, ${newLocation.city}` : newLocation.city
              };

              setUserLocation(finalLocation);
              localStorage.setItem('user_location_data', JSON.stringify(finalLocation));
              localStorage.setItem('user_location_timestamp', Date.now().toString());
            }
          } catch (err) {
            console.error('Real-time reverse geocoding failed:', err);
          }
        };

        navigator.geolocation.getCurrentPosition(handleSuccess, 
          (err) => console.log('GPS Error:', err), 
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );

        // We no longer return a watchId as it's a one-time fetch
        return undefined;

      }

      // Fallback to IP-based location detection with enhanced services
      const locationServices = [
        {
          name: 'ipapi',
          url: 'https://ipapi.co/json/',
          parser: (data: any) => ({
            country: data.country_name || 'Unknown',
            city: data.city || data.region || 'Unknown',
            currency: data.currency || getCurrencyByCountry(data.country_name || 'Unknown')
          })
        },
        {
          name: 'ipgeolocation',
          url: 'https://api.ipgeolocation.io/ipgeo?apiKey=free',
          parser: (data: any) => ({
            country: data.country_name || 'Unknown',
            city: data.city || data.district || data.state_prov || 'Unknown',
            currency: data.currency?.code || getCurrencyByCountry(data.country_name || 'Unknown')
          })
        },
        {
          name: 'ipwhois',
          url: 'https://ipwho.is/',
          parser: (data: any) => ({
            country: data.country || 'Unknown',
            city: data.city || data.region || 'Unknown',
            currency: data.currency?.code || getCurrencyByCountry(data.country || 'Unknown')
          })
        },
        {
          name: 'ipinfo',
          url: 'https://ipinfo.io/json',
          parser: (data: any) => {
            const countryName = getCountryNameFromCode(data.country || 'Unknown');
            return {
              country: countryName,
              city: data.city || data.region || 'Unknown',
              currency: getCurrencyByCountry(countryName)
            };
          }
        }
      ];

      for (const service of locationServices) {
        try {
          console.log(`Trying IP location service: ${service.name}`);
          const response = await fetch(service.url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(5000)
          });
          
          if (response.ok) {
            const data = await response.json();
            const location = service.parser(data);
            
            if (location.country !== 'Unknown' && location.country.length > 2) {
              console.log(`IP location detected via ${service.name}:`, location);
              
              // Cache the successful result
              localStorage.setItem('user_location_data', JSON.stringify(location));
              localStorage.setItem('user_location_timestamp', Date.now().toString());
              
              setUserLocation(location);
              return;
            }
          }
        } catch (serviceError) {
          console.log(`Service ${service.name} failed:`, serviceError);
          continue;
        }
      }
      
      // All services failed, use default
      console.log('All location services failed, using default');
      const defaultLocation = { country: 'Global', city: 'Unknown', currency: 'USD' };
      setUserLocation(defaultLocation);
      
    } catch (error) {
      console.error('Error getting user location:', error);
      setUserLocation({ country: 'Global', city: 'Unknown', currency: 'USD' });
    }
  };

  const getCountryNameFromCode = (countryCode: string): string => {
    const countryCodeMap: { [key: string]: string } = {
      'AD': 'Andorra',
      'AE': 'United Arab Emirates',
      'AF': 'Afghanistan',
      'AG': 'Antigua and Barbuda',
      'AI': 'Anguilla',
      'AL': 'Albania',
      'AM': 'Armenia',
      'AO': 'Angola',
      'AQ': 'Antarctica',
      'AR': 'Argentina',
      'AS': 'American Samoa',
      'AT': 'Austria',
      'AU': 'Australia',
      'AW': 'Aruba',
      'AX': 'Åland Islands',
      'AZ': 'Azerbaijan',
      'BA': 'Bosnia and Herzegovina',
      'BB': 'Barbados',
      'BD': 'Bangladesh',
      'BE': 'Belgium',
      'BF': 'Burkina Faso',
      'BG': 'Bulgaria',
      'BH': 'Bahrain',
      'BI': 'Burundi',
      'BJ': 'Benin',
      'BL': 'Saint Barthélemy',
      'BM': 'Bermuda',
      'BN': 'Brunei',
      'BO': 'Bolivia',
      'BQ': 'Caribbean Netherlands',
      'BR': 'Brazil',
      'BS': 'Bahamas',
      'BT': 'Bhutan',
      'BV': 'Bouvet Island',
      'BW': 'Botswana',
      'BY': 'Belarus',
      'BZ': 'Belize',
      'CA': 'Canada',
      'CC': 'Cocos Islands',
      'CD': 'Democratic Republic of the Congo',
      'CF': 'Central African Republic',
      'CG': 'Republic of the Congo',
      'CH': 'Switzerland',
      'CI': 'Côte d\'Ivoire',
      'CK': 'Cook Islands',
      'CL': 'Chile',
      'CM': 'Cameroon',
      'CN': 'China',
      'CO': 'Colombia',
      'CR': 'Costa Rica',
      'CU': 'Cuba',
      'CV': 'Cape Verde',
      'CW': 'Curaçao',
      'CX': 'Christmas Island',
      'CY': 'Cyprus',
      'CZ': 'Czech Republic',
      'DE': 'Germany',
      'DJ': 'Djibouti',
      'DK': 'Denmark',
      'DM': 'Dominica',
      'DO': 'Dominican Republic',
      'DZ': 'Algeria',
      'EC': 'Ecuador',
      'EE': 'Estonia',
      'EG': 'Egypt',
      'EH': 'Western Sahara',
      'ER': 'Eritrea',
      'ES': 'Spain',
      'ET': 'Ethiopia',
      'FI': 'Finland',
      'FJ': 'Fiji',
      'FK': 'Falkland Islands',
      'FM': 'Micronesia',
      'FO': 'Faroe Islands',
      'FR': 'France',
      'GA': 'Gabon',
      'GB': 'United Kingdom',
      'GD': 'Grenada',
      'GE': 'Georgia',
      'GF': 'French Guiana',
      'GG': 'Guernsey',
      'GH': 'Ghana',
      'GI': 'Gibraltar',
      'GL': 'Greenland',
      'GM': 'Gambia',
      'GN': 'Guinea',
      'GP': 'Guadeloupe',
      'GQ': 'Equatorial Guinea',
      'GR': 'Greece',
      'GS': 'South Georgia',
      'GT': 'Guatemala',
      'GU': 'Guam',
      'GW': 'Guinea-Bissau',
      'GY': 'Guyana',
      'HK': 'Hong Kong',
      'HM': 'Heard Island',
      'HN': 'Honduras',
      'HR': 'Croatia',
      'HT': 'Haiti',
      'HU': 'Hungary',
      'ID': 'Indonesia',
      'IE': 'Ireland',
      'IL': 'Israel',
      'IM': 'Isle of Man',
      'IN': 'India',
      'IO': 'British Indian Ocean Territory',
      'IQ': 'Iraq',
      'IR': 'Iran',
      'IS': 'Iceland',
      'IT': 'Italy',
      'JE': 'Jersey',
      'JM': 'Jamaica',
      'JO': 'Jordan',
      'JP': 'Japan',
      'KE': 'Kenya',
      'KG': 'Kyrgyzstan',
      'KH': 'Cambodia',
      'KI': 'Kiribati',
      'KM': 'Comoros',
      'KN': 'Saint Kitts and Nevis',
      'KP': 'North Korea',
      'KR': 'South Korea',
      'KW': 'Kuwait',
      'KY': 'Cayman Islands',
      'KZ': 'Kazakhstan',
      'LA': 'Laos',
      'LB': 'Lebanon',
      'LC': 'Saint Lucia',
      'LI': 'Liechtenstein',
      'LK': 'Sri Lanka',
      'LR': 'Liberia',
      'LS': 'Lesotho',
      'LT': 'Lithuania',
      'LU': 'Luxembourg',
      'LV': 'Latvia',
      'LY': 'Libya',
      'MA': 'Morocco',
      'MC': 'Monaco',
      'MD': 'Moldova',
      'ME': 'Montenegro',
      'MF': 'Saint Martin',
      'MG': 'Madagascar',
      'MH': 'Marshall Islands',
      'MK': 'North Macedonia',
      'ML': 'Mali',
      'MM': 'Myanmar',
      'MN': 'Mongolia',
      'MO': 'Macao',
      'MP': 'Northern Mariana Islands',
      'MQ': 'Martinique',
      'MR': 'Mauritania',
      'MS': 'Montserrat',
      'MT': 'Malta',
      'MU': 'Mauritius',
      'MV': 'Maldives',
      'MW': 'Malawi',
      'MX': 'Mexico',
      'MY': 'Malaysia',
      'MZ': 'Mozambique',
      'NA': 'Namibia',
      'NC': 'New Caledonia',
      'NE': 'Niger',
      'NF': 'Norfolk Island',
      'NG': 'Nigeria',
      'NI': 'Nicaragua',
      'NL': 'Netherlands',
      'NO': 'Norway',
      'NP': 'Nepal',
      'NR': 'Nauru',
      'NU': 'Niue',
      'NZ': 'New Zealand',
      'OM': 'Oman',
      'PA': 'Panama',
      'PE': 'Peru',
      'PF': 'French Polynesia',
      'PG': 'Papua New Guinea',
      'PH': 'Philippines',
      'PK': 'Pakistan',
      'PL': 'Poland',
      'PM': 'Saint Pierre and Miquelon',
      'PN': 'Pitcairn',
      'PR': 'Puerto Rico',
      'PS': 'Palestine',
      'PT': 'Portugal',
      'PW': 'Palau',
      'PY': 'Paraguay',
      'QA': 'Qatar',
      'RE': 'Réunion',
      'RO': 'Romania',
      'RS': 'Serbia',
      'RU': 'Russia',
      'RW': 'Rwanda',
      'SA': 'Saudi Arabia',
      'SB': 'Solomon Islands',
      'SC': 'Seychelles',
      'SD': 'Sudan',
      'SE': 'Sweden',
      'SG': 'Singapore',
      'SH': 'Saint Helena',
      'SI': 'Slovenia',
      'SJ': 'Svalbard and Jan Mayen',
      'SK': 'Slovakia',
      'SL': 'Sierra Leone',
      'SM': 'San Marino',
      'SN': 'Senegal',
      'SO': 'Somalia',
      'SR': 'Suriname',
      'SS': 'South Sudan',
      'ST': 'São Tomé and Príncipe',
      'SV': 'El Salvador',
      'SX': 'Sint Maarten',
      'SY': 'Syria',
      'SZ': 'Eswatini',
      'TC': 'Turks and Caicos Islands',
      'TD': 'Chad',
      'TF': 'French Southern Territories',
      'TG': 'Togo',
      'TH': 'Thailand',
      'TJ': 'Tajikistan',
      'TK': 'Tokelau',
      'TL': 'Timor-Leste',
      'TM': 'Turkmenistan',
      'TN': 'Tunisia',
      'TO': 'Tonga',
      'TR': 'Turkey',
      'TT': 'Trinidad and Tobago',
      'TV': 'Tuvalu',
      'TW': 'Taiwan',
      'TZ': 'Tanzania',
      'UA': 'Ukraine',
      'UG': 'Uganda',
      'UM': 'United States Minor Outlying Islands',
      'US': 'United States',
      'UY': 'Uruguay',
      'UZ': 'Uzbekistan',
      'VA': 'Vatican City',
      'VC': 'Saint Vincent and the Grenadines',
      'VE': 'Venezuela',
      'VG': 'British Virgin Islands',
      'VI': 'U.S. Virgin Islands',
      'VN': 'Vietnam',
      'VU': 'Vanuatu',
      'WF': 'Wallis and Futuna',
      'WS': 'Samoa',
      'YE': 'Yemen',
      'YT': 'Mayotte',
      'ZA': 'South Africa',
      'ZM': 'Zambia',
      'ZW': 'Zimbabwe'
    };
    
    return countryCodeMap[countryCode.toUpperCase()] || countryCode;
  };

  const getCurrencyByCountry = (country: string): string => {
    const currencyMap: { [key: string]: string } = {
      'India': 'INR',
      'United States': 'USD',
      'United Kingdom': 'GBP',
      'Germany': 'EUR',
      'France': 'EUR',
      'Japan': 'JPY',
      'China': 'CNY',
      'Brazil': 'BRL',
      'Canada': 'CAD',
      'Australia': 'AUD',
      'South Korea': 'KRW',
      'Korea (the Republic of)': 'KRW',
      'Republic of Korea': 'KRW',
      'Singapore': 'SGD',
      'Thailand': 'THB',
      'Malaysia': 'MYR',
      'Indonesia': 'IDR',
      'Philippines': 'PHP',
      'Vietnam': 'VND',
      'Mexico': 'MXN',
      'Argentina': 'ARS',
      'Chile': 'CLP',
      'Colombia': 'COP',
      'Peru': 'PEN',
      'South Africa': 'ZAR',
      'Nigeria': 'NGN',
      'Egypt': 'EGP',
      'Turkey': 'TRY',
      'Russia': 'RUB',
      'Ukraine': 'UAH',
      'Poland': 'PLN',
      'Czech Republic': 'CZK',
      'Hungary': 'HUF',
      'Romania': 'RON',
      'Bulgaria': 'BGN',
      'Croatia': 'HRK',
      'Serbia': 'RSD',
      'Bosnia and Herzegovina': 'BAM',
      'North Macedonia': 'MKD',
      'Albania': 'ALL',
      'Montenegro': 'EUR',
      'Slovenia': 'EUR',
      'Slovakia': 'EUR',
      'Estonia': 'EUR',
      'Latvia': 'EUR',
      'Lithuania': 'EUR',
      'Finland': 'EUR',
      'Sweden': 'SEK',
      'Norway': 'NOK',
      'Denmark': 'DKK',
      'Iceland': 'ISK',
      'Switzerland': 'CHF',
      'Austria': 'EUR',
      'Belgium': 'EUR',
      'Netherlands': 'EUR',
      'Luxembourg': 'EUR',
      'Ireland': 'EUR',
      'Portugal': 'EUR',
      'Spain': 'EUR',
      'Italy': 'EUR',
      'Greece': 'EUR',
      'Cyprus': 'EUR',
      'Malta': 'EUR',
      'Israel': 'ILS',
      'Saudi Arabia': 'SAR',
      'United Arab Emirates': 'AED',
      'Qatar': 'QAR',
      'Kuwait': 'KWD',
      'Bahrain': 'BHD',
      'Oman': 'OMR',
      'Jordan': 'JOD',
      'Lebanon': 'LBP',
      'Iran': 'IRR',
      'Iraq': 'IQD',
      'Pakistan': 'PKR',
      'Bangladesh': 'BDT',
      'Sri Lanka': 'LKR',
      'Nepal': 'NPR',
      'Bhutan': 'BTN',
      'Maldives': 'MVR',
      'Afghanistan': 'AFN',
      'Myanmar': 'MMK',
      'Cambodia': 'KHR',
      'Laos': 'LAK',
      'Mongolia': 'MNT',
      'Kazakhstan': 'KZT',
      'Uzbekistan': 'UZS',
      'Kyrgyzstan': 'KGS',
      'Tajikistan': 'TJS',
      'Turkmenistan': 'TMT',
      'Azerbaijan': 'AZN',
      'Armenia': 'AMD',
      'Georgia': 'GEL',
      'Belarus': 'BYN',
      'Moldova': 'MDL',
      'New Zealand': 'NZD'
    };
    return currencyMap[country] || 'USD';
  };

  const refreshLocation = () => {
    // Clear cache and fetch fresh location
    localStorage.removeItem('user_location_data');
    localStorage.removeItem('user_location_timestamp');
    console.log('Refreshing location data...');
    setUserLocation(null); // Clear current location to show loading state
    getUserLocation();
  };

  // Load notifications from localStorage on mount (simplified)
  useEffect(() => {
    if (session?.user?.email) {
      loadLocalNotifications();
    }
  }, [session?.user?.email]);

  const loadLocalNotifications = () => {
    if (!session?.user?.email) return;
    
    try {
      const saved = localStorage.getItem(`notifications_${session.user.email}`);
      if (saved) {
        const parsed = JSON.parse(saved).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        setNotifications(parsed);
      }
    } catch (error) {
      console.error('Failed to load local notifications:', error);
      setNotifications([]);
    }
  };

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (session?.user?.email && notifications.length > 0) {
      localStorage.setItem(`notifications_${session.user.email}`, JSON.stringify(notifications));
    }
  }, [notifications, session?.user?.email]);

  // Enhanced real-time notifications
  useEffect(() => {
    if (!session?.user || !userLocation) return;

    const interval = setInterval(() => {
      const random = Math.random();
      
      // Increased frequency for 'real-time' feel
      if (random < 0.15) { // 15% chance every minute
        generateBasicSystemNotification();
      }
      
      // Location-specific market opportunities (15% chance)
      if (random < 0.30 && random >= 0.15) {
        generateLocationBasedNotification();
      }
      // Local trending business alerts (10% chance)
      else if (random < 0.40 && random >= 0.30) {
        generateTrendingBusinessAlert();
      }
      // Regional competitor insights (8% chance)
      else if (random < 0.48 && random >= 0.40) {
        generateCompetitorInsight();
      }
    }, 60000); // Check every 1 minute for a more active feel

    return () => clearInterval(interval);
  }, [session?.user, userLocation]);

  const generateBasicSystemNotification = () => {
    if (!userLocation) return;

    const basicAlerts = [
      { message: 'Profile updated successfully', actionUrl: '/profile' },
      { message: 'Welcome back to your dashboard', actionUrl: '/dashboard' },
      { message: 'Your session is secure and active', actionUrl: '/dashboard' },
      { message: 'System running smoothly', actionUrl: '/dashboard' }
    ];
    
    const alert = basicAlerts[Math.floor(Math.random() * basicAlerts.length)];
    
    addNotification({
      type: 'system',
      title: 'System Update',
      message: alert.message,
      priority: 'low',
      actionUrl: alert.actionUrl,
      metadata: {
        country: userLocation.country,
        city: userLocation.city
      }
    });
  };
  const generateLocationBasedNotification = () => {
    if (!userLocation) return;
 
    const sectors = ['E-commerce', 'SaaS', 'Fintech', 'Clean Energy', 'EdTech', 'AgriTech'];
    const businessType = sectors[Math.floor(Math.random() * sectors.length)];
    const growthRate = (Math.random() * 25 + 15).toFixed(1);
    
    if (isSubscribed) {
      addNotification({
        type: 'local',
        title: `${userLocation.city} Market Alert`,
        message: `The ${businessType} sector in ${userLocation.city} is seeing a massive surge of ${growthRate}% this week. Direct your focus here.`,
        priority: 'high',
        actionUrl: `/dashboard?area=${encodeURIComponent(userLocation.city)}`,
        metadata: {
          country: userLocation.country,
          city: userLocation.city,
          businessType,
          marketGrowth: `${growthRate}%`,
          currency: userLocation.currency,
          localTrend: 'Surging'
        }
      });
    } else {
      // Teaser for Free Users - Obfuscated Data
      addNotification({
        type: 'alert',
        title: 'Regional Surge Detected',
        message: `A high-potential business sector in ${userLocation.city} is growing rapidly. Upgrade your protocol to unlock this intelligence.`,
        priority: 'high',
        actionUrl: '/acquisition-tiers',
        metadata: {
          country: userLocation.country,
          city: userLocation.city,
          localTrend: 'Obfuscated'
        }
      });
    }
  };
 
  const generateTrendingBusinessAlert = () => {
    if (!userLocation) return;
 
    const trending = ['AI-Driven Logistics', 'Sustainable Fashion', 'Pet Tech', 'Health Monitoring', 'Personalized Nutrition'];
    const business = trending[Math.floor(Math.random() * trending.length)];
    
    if (isSubscribed) {
      addNotification({
        type: 'trending',
        title: 'Global Trend Alert',
        message: `${business} is now trending in ${userLocation.country}. Early adopters are seeing 3x ROI.`,
        priority: 'medium',
        actionUrl: `/dashboard?q=${encodeURIComponent(business)}`,
        metadata: {
          country: userLocation.country,
          city: userLocation.city,
          businessType: business,
          currency: userLocation.currency,
          localTrend: 'Trending'
        }
      });
    } else {
      addNotification({
        type: 'alert',
        title: 'Global Opportunity Signal',
        message: `An emerging business model is trending in ${userLocation.country}. Early adopters are gaining ground. Unlock full details.`,
        priority: 'medium',
        actionUrl: '/acquisition-tiers'
      });
    }
  };
 
  const generateCompetitorInsight = () => {
    if (!userLocation || userLocation.city === 'Unknown') return;
 
    const competitorCount = Math.floor(Math.random() * 12 + 3);
    
    if (isSubscribed) {
      addNotification({
        type: 'market',
        title: 'Competitor Intelligence',
        message: `We've detected ${competitorCount} new business registrations in your immediate area of ${userLocation.city} today.`,
        priority: 'high',
        actionUrl: `/dashboard?area=${encodeURIComponent(userLocation.city)}`,
        metadata: {
          country: userLocation.country,
          city: userLocation.city,
          competitorCount,
          localTrend: 'Competitive'
        }
      });
    } else {
      addNotification({
        type: 'alert',
        title: 'Competitive Risk Alert',
        message: `New business activity detected in ${userLocation.city}. Monitor your sector's health with a professional plan.`,
        priority: 'high',
        actionUrl: '/acquisition-tiers'
      });
    }
  };

  const generateInvestmentOpportunity = () => {
    if (!userLocation) return;

    const opportunities = ['Startup Incubator', 'Digital Infrastructure', 'Renewable Energy', 'Healthcare Innovation', 'EdTech Platform'];
    const opportunity = opportunities[Math.floor(Math.random() * opportunities.length)];
    const investmentRange = userLocation.country === 'India' ? '₹50L - ₹5Cr' : '$100k - $1M';
    
    addNotification({
      type: 'alert',
      title: 'Investment Opportunity',
      message: `${opportunity} investment opportunity in ${userLocation.city}. ${investmentRange} funding available.`,
      priority: 'high',
      actionUrl: '/acquisition-tiers',
      metadata: {
        country: userLocation.country,
        city: userLocation.city,
        businessType: opportunity,
        investmentRange,
        currency: userLocation.currency,
        localTrend: 'Investment Ready'
      }
    });
  };

  const generateSystemAlert = () => {
    if (!userLocation) return;

    const alerts = [
      `New government incentives for startups in ${userLocation.country}`,
      `${userLocation.city} business registration simplified - 50% faster process`,
      `Local tax benefits for trending businesses in ${userLocation.country}`,
      `${userLocation.country} market report updated with new opportunities`
    ];
    
    addNotification({
      type: 'system',
      title: 'Local Business Update',
      message: alerts[Math.floor(Math.random() * alerts.length)],
      priority: 'medium',
      actionUrl: '/dashboard',
      metadata: {
        country: userLocation.country,
        city: userLocation.city,
        localTrend: 'Policy Update'
      }
    });
  };

  // Placeholder for helper functions if needed in future

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!session?.user?.email) return;

    // Check for duplicates based on type, title, and recent timestamp (within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isDuplicate = notifications.some((n: Notification) => 
      n.type === notification.type && 
      n.title === notification.title && 
      n.timestamp > fiveMinutesAgo &&
      n.message === notification.message
    );

    if (isDuplicate) {
      return;
    }

    // Create simple local notification
    const newNotification: Notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      actionUrl: notification.actionUrl,
      metadata: notification.metadata,
      timestamp: new Date(),
      read: false
    };

    // Add to state and save to localStorage
    setNotifications((prev: Notification[]) => {
      const updated = [newNotification, ...prev].slice(0, 50); // Keep only 50 most recent
      if (session?.user?.email) {
        localStorage.setItem(`notifications_${session.user.email}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications((prev: Notification[]) => {
      const updated = prev.map((n: Notification) => n.id === id ? { ...n, read: true } : n);
      if (session?.user?.email) {
        localStorage.setItem(`notifications_${session.user.email}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const markAllAsRead = () => {
    if (!session?.user?.email) return;
    
    setNotifications((prev: Notification[]) => {
      const updated = prev.map((n: Notification) => ({ ...n, read: true }));
      if (session?.user?.email) {
        localStorage.setItem(`notifications_${session.user.email}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev: Notification[]) => {
      const updated = prev.filter((n: Notification) => n.id !== id);
      if (session?.user?.email) {
        localStorage.setItem(`notifications_${session.user.email}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearAll = () => {
    if (!session?.user?.email) return;
    
    setNotifications([]);
    localStorage.removeItem(`notifications_${session.user.email}`);
  };

  const triggerTestNotification = () => {
    // Test function removed for production
    console.log('Test notifications disabled in production');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      userLocation,
      // rateLimitStatus,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearAll,
      refreshLocation
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}