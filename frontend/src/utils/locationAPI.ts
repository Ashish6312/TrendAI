// Country State City API Integration
const API_KEY = '2f0d244021227aff82ad8164aad0f2bf0d1eaa3a289b111307fbaeee16436922';
const BASE_URL = 'https://api.countrystatecity.in/v1';

interface Country {
  id: number;
  name: string;
  iso3: string;
  iso2: string;
  numeric_code: string;
  phone_code: string;
  capital: string;
  currency: string;
  currency_name: string;
  currency_symbol: string;
  tld: string;
  native: string;
  region: string;
  subregion: string;
  timezones: Array<{
    zoneName: string;
    gmtOffset: number;
    gmtOffsetName: string;
    abbreviation: string;
    tzName: string;
  }>;
  translations: Record<string, string>;
  latitude: string;
  longitude: string;
  emoji: string;
  emojiU: string;
}

interface State {
  id: number;
  name: string;
  country_code: string;
  country_name: string;
  state_code: string;
  type: string;
  latitude: string;
  longitude: string;
}

interface City {
  id: number;
  name: string;
  state_code: string;
  state_name: string;
  country_code: string;
  country_name: string;
  latitude: string;
  longitude: string;
  wikiDataId: string;
}

class LocationAPI {
  private headers = {
    'X-CSCAPI-KEY': API_KEY,
    'Content-Type': 'application/json'
  };

  async detectUserLocation(): Promise<{ city: string; country: string; countryCode: string } | null> {
    try {
      // 1. Try our own backend proxy first (solves CORS and rate limits)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const proxyRes = await fetch(`${apiUrl}/api/system/location`);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        console.log('🌍 Detected location via Proxy:', data);
        return {
          city: data.city || 'Unknown',
          country: data.country || 'Unknown',
          countryCode: data.country_code || 'IN'
        };
      }
    } catch (e) {
      console.warn('Backend location proxy failed, trying fallbacks...');
    }

    try {
      // 2. Fallback to direct lookups if proxy fails
      const apis = [
        'https://ipapi.co/json/',
        'https://ip-api.com/json/',
        'https://api.bigdatacloud.net/data/reverse-geocode-client'
      ];

      for (const api of apis) {
        try {
          const res = await fetch(api, { timeout: 3000 } as any);
          if (res.ok) {
            const data = await res.json();
            console.log('🌍 Detected location:', data);
            return {
              city: data.city || data.cityName || 'Unknown',
              country: data.country_name || data.countryName || 'Unknown',
              countryCode: data.country_code || data.countryCode || 'IN'
            };
          }
        } catch (e) {
          continue;
        }
      }
      return null;
    } catch (error) {
      console.error('Error detecting location:', error);
      return null;
    }
  }

  async getAllCountries(): Promise<Country[]> {
    try {
      const response = await fetch(`${BASE_URL}/countries`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching countries:', error);
      return [];
    }
  }

  async getCountryByCode(countryCode: string): Promise<Country | null> {
    try {
      const response = await fetch(`${BASE_URL}/countries/${countryCode}`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching country:', error);
      return null;
    }
  }

  async getStatesByCountry(countryCode: string): Promise<State[]> {
    try {
      const response = await fetch(`${BASE_URL}/countries/${countryCode}/states`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching states:', error);
      return [];
    }
  }

  async getCitiesByCountryAndState(countryCode: string, stateCode: string): Promise<City[]> {
    try {
      const response = await fetch(`${BASE_URL}/countries/${countryCode}/states/${stateCode}/cities`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  }

  async getCitiesByCountry(countryCode: string): Promise<City[]> {
    try {
      const response = await fetch(`${BASE_URL}/countries/${countryCode}/cities`, {
        headers: this.headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  }

  // Helper method to parse location string and get geographical data
  async parseLocationString(locationString: string): Promise<{
    country?: Country;
    state?: State;
    city?: City;
    coordinates?: { lat: number; lng: number };
  }> {
    try {
      console.log('🔍 Parsing location string:', locationString);
      
      // Clean and split the location string
      const parts = locationString.split(',').map(part => part.trim().toLowerCase());
      console.log('📍 Location parts:', parts);
      
      // Get all countries to find a match
      const countries = await this.getAllCountries();
      let matchedCountry: Country | undefined;
      
      // First, try to find explicit country mentions
      for (const country of countries) {
        const countryName = country.name.toLowerCase();
        const iso2 = country.iso2.toLowerCase();
        const iso3 = country.iso3.toLowerCase();
        const native = country.native?.toLowerCase() || '';
        
        // Exact matches for ISO codes, includes/match for full names
        if (parts.some(part => 
          part === iso2 || 
          part === iso3 || 
          part === countryName ||
          (part.length > 3 && (countryName.includes(part) || part.includes(countryName))) ||
          (native && (part === native || (part.length > 3 && native.includes(part))))
        )) {
          matchedCountry = country;
          console.log('🌍 Found country match:', country.name);
          break;
        }
      }
      
      // If no explicit country found, try to infer from city/state names
      if (!matchedCountry) {
        console.log('🔍 No explicit country found, trying to infer...');
        
        // Check for common Indian cities/states patterns
        const indianCities = ['berasia', 'bhopal', 'mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata', 'hyderabad'];
        const indianStates = ['madhya pradesh', 'maharashtra', 'karnataka', 'tamil nadu', 'west bengal', 'rajasthan'];
        
        if (parts.some(part => 
          indianCities.some(city => part.includes(city) || city.includes(part)) ||
          indianStates.some(state => part.includes(state) || state.includes(part))
        )) {
          matchedCountry = countries.find(c => c.iso2 === 'IN');
          console.log('🇮🇳 Inferred India from city/state pattern');
        }
        
        // If still no match, try US patterns
        if (!matchedCountry) {
          const usCities = ['new york', 'los angeles', 'chicago', 'houston', 'phoenix'];
          const usStates = ['california', 'texas', 'florida', 'new york', 'illinois'];
          
          if (parts.some(part => 
            usCities.some(city => part.includes(city) || city.includes(part)) ||
            usStates.some(state => part.includes(state) || state.includes(part))
          )) {
            matchedCountry = countries.find(c => c.iso2 === 'US');
            console.log('🇺🇸 Inferred USA from city/state pattern');
          }
        }
        
        // Default fallback
        if (!matchedCountry) {
          matchedCountry = countries.find(c => c.iso2 === 'IN') || countries.find(c => c.iso2 === 'US') || countries[0];
          console.log('🌍 Using fallback country:', matchedCountry?.name);
        }
      }
      
      let matchedState: State | undefined;
      let matchedCity: City | undefined;
      
      if (matchedCountry) {
        console.log('🔍 Searching in country:', matchedCountry.name);
        
        // Get states for the matched country
        const states = await this.getStatesByCountry(matchedCountry.iso2);
        console.log('📍 Found states:', states.length);
        
        // Look for state match with fuzzy matching
        matchedState = states.find(state => {
          const stateName = state.name.toLowerCase();
          return parts.some(part => 
            stateName.includes(part) || 
            part.includes(stateName) ||
            this.fuzzyMatch(part, stateName)
          );
        });
        
        if (matchedState) {
          console.log('🏛️ Found state match:', matchedState.name);
        }
        
        // Get cities
        let cities: City[] = [];
        if (matchedState) {
          cities = await this.getCitiesByCountryAndState(matchedCountry.iso2, matchedState.state_code);
        } else {
          // Get all cities in country if no state match
          cities = await this.getCitiesByCountry(matchedCountry.iso2);
        }
        
        console.log('🏙️ Found cities:', cities.length);
        
        // Look for city match with fuzzy matching
        matchedCity = cities.find(city => {
          const cityName = city.name.toLowerCase();
          return parts.some(part => 
            cityName.includes(part) || 
            part.includes(cityName) ||
            this.fuzzyMatch(part, cityName)
          );
        });
        
        if (matchedCity) {
          console.log('🏙️ Found city match:', matchedCity.name);
        }
      }
      
      // Get coordinates from the most specific location available
      let coordinates: { lat: number; lng: number } | undefined;
      if (matchedCity && matchedCity.latitude && matchedCity.longitude) {
        coordinates = {
          lat: parseFloat(matchedCity.latitude),
          lng: parseFloat(matchedCity.longitude)
        };
        console.log('📍 Using city coordinates:', coordinates);
      } else if (matchedState && matchedState.latitude && matchedState.longitude) {
        coordinates = {
          lat: parseFloat(matchedState.latitude),
          lng: parseFloat(matchedState.longitude)
        };
        console.log('📍 Using state coordinates:', coordinates);
      } else if (matchedCountry && matchedCountry.latitude && matchedCountry.longitude) {
        coordinates = {
          lat: parseFloat(matchedCountry.latitude),
          lng: parseFloat(matchedCountry.longitude)
        };
        console.log('📍 Using country coordinates:', coordinates);
      }
      
      // If we still don't have coordinates, try manual lookup for known locations
      if (!coordinates) {
        coordinates = this.getKnownLocationCoordinates(locationString);
        if (coordinates) {
          console.log('📍 Using known location coordinates:', coordinates);
        }
      }
      
      const result = {
        country: matchedCountry,
        state: matchedState,
        city: matchedCity,
        coordinates
      };
      
      console.log('✅ Final location result:', {
        country: result.country?.name,
        state: result.state?.name,
        city: result.city?.name,
        coordinates: result.coordinates
      });
      
      return result;
    } catch (error) {
      console.error('❌ Error parsing location string:', error);
      return {};
    }
  }

  // Fuzzy matching helper
  private fuzzyMatch(str1: string, str2: string, threshold: number = 0.7): boolean {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return true;
    
    const distance = this.levenshteinDistance(longer, shorter);
    const similarity = (longer.length - distance) / longer.length;
    
    return similarity >= threshold;
  }

  // Levenshtein distance calculation
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Known location coordinates for manual lookup
  private getKnownLocationCoordinates(locationString: string): { lat: number; lng: number } | undefined {
    const knownLocations: Record<string, { lat: number; lng: number }> = {
      'berasia': { lat: 23.6345, lng: 77.4365 },
      'berasia, india': { lat: 23.6345, lng: 77.4365 },
      'berasia, madhya pradesh': { lat: 23.6345, lng: 77.4365 },
      'berasia, mp': { lat: 23.6345, lng: 77.4365 },
      'american samoa': { lat: -14.2710, lng: -170.1322 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'paris': { lat: 48.8566, lng: 2.3522 },
      'sydney': { lat: -33.8688, lng: 151.2093 },
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'delhi': { lat: 28.7041, lng: 77.1025 },
      'bangalore': { lat: 12.9716, lng: 77.5946 },
      'bhopal': { lat: 23.2599, lng: 77.4126 }
    };

    const key = locationString.toLowerCase().trim();
    return knownLocations[key] || 
           knownLocations[key.split(',')[0].trim()] ||
           Object.entries(knownLocations).find(([k]) => 
             k.includes(key.split(',')[0].trim()) || 
             key.includes(k)
           )?.[1];
  }

  // Generate realistic business data based on location
  generateLocationBasedBusinessData(locationData: {
    country?: Country;
    state?: State;
    city?: City;
    coordinates?: { lat: number; lng: number };
  }, businessType: string) {
    const { country, state, city } = locationData;
    const locationName = city?.name || state?.name || country?.name || 'Unknown Location';
    const countryName = country?.name || 'Unknown Country';
    
    // Generate realistic business names based on location and type
    const businessNames = [
      `${locationName} ${businessType.split(' ')[0]} Solutions`,
      `${businessType.split(' ')[0]} Hub ${locationName}`,
      `Elite ${businessType.split(' ')[0]} ${locationName}`,
      `${locationName} Premium ${businessType.split(' ')[0]}`,
      `Local ${businessType.split(' ')[0]} Network`,
      `${businessType.split(' ')[0]} Express ${locationName}`,
      `${locationName} Professional ${businessType.split(' ')[0]}`,
      `Quality ${businessType.split(' ')[0]} ${locationName}`
    ];
    
    // Generate contact information based on country
    const phoneFormats = {
      'United States': '+1 (555) XXX-XXXX',
      'India': '+91 XXXXX XXXXX',
      'United Kingdom': '+44 XXXX XXXXXX',
      'Canada': '+1 (XXX) XXX-XXXX',
      'Australia': '+61 X XXXX XXXX',
      'Germany': '+49 XXX XXXXXXX',
      'France': '+33 X XX XX XX XX',
      'default': '+XX XXX XXX XXXX'
    };
    
    const phoneFormat = phoneFormats[countryName as keyof typeof phoneFormats] || phoneFormats.default;
    
    return {
      locationName,
      countryName,
      businessNames,
      phoneFormat,
      currency: country?.currency_symbol || '$',
      timezone: country?.timezones?.[0]?.tzName || 'UTC',
      coordinates: locationData.coordinates
    };
  }
}

export const locationAPI = new LocationAPI();
export type { Country, State, City };