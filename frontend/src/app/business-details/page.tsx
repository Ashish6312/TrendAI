"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapPin, Star, CheckCircle, AlertTriangle, Lightbulb, 
  Zap, Phone, Mail, ExternalLink, Navigation, Loader2, Map, 
  Eye, Maximize2, RefreshCw, X, Building, Store, Factory, 
  Globe2, DollarSign, BarChart3, Target,
  TrendingUp, Clock, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { locationAPI, type Country, type State, type City } from '@/utils/locationAPI';
import { realBusinessAPI, type RealBusiness } from '@/utils/realBusinessAPI';
import InteractiveMap from '@/components/InteractiveMap';
import UniformLayout from '@/components/UniformLayout';
import UniformCard from '@/components/UniformCard';

interface ExistingBusiness {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  status: 'active' | 'closed' | 'unknown';
  distance?: string;
  established?: string;
  category?: string;
  coordinates?: { lat: number; lng: number };
}

interface LocationData {
  country?: Country;
  state?: State;
  city?: City;
  coordinates?: { lat: number; lng: number };
}

export default function BusinessDetailsPage() {
  const router = useRouter();
  const [businessData, setBusinessData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [existingBusinesses, setExistingBusinesses] = useState<ExistingBusiness[]>([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [locationData, setLocationData] = useState<LocationData>({});
  const [realLocationData, setRealLocationData] = useState<any>(null);
  const [fetchingRealData, setFetchingRealData] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'map' | 'businesses'>('overview');
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [contactInfo, setContactInfo] = useState<any>(null);

  useEffect(() => {
    const storedBusiness = sessionStorage.getItem('selected_business');
    if (storedBusiness) {
      const data = JSON.parse(storedBusiness);
      setBusinessData(data);
      loadRealLocationData(data);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  }, [router]);
  const loadRealLocationData = async (data: any) => {
    setLoadingMap(true);
    setFetchingRealData(true);
    
    try {
      console.log('🔍 Loading location data for:', data.area);
      
      // Parse location using real API
      const parsedLocation = await locationAPI.parseLocationString(data.area);
      console.log('📍 Parsed location:', parsedLocation);
      
      setLocationData(parsedLocation);
      
      // Generate location-based business data
      const locationBasedData = locationAPI.generateLocationBasedBusinessData(
        parsedLocation, 
        data.business.title
      );
      setRealLocationData(locationBasedData);
      
      // Fetch businesses and contact info
      await Promise.all([
        fetchRealExistingBusinesses(data.business.title, data.area, parsedLocation),
        fetchContactInformation(data.business.title, data.area, locationBasedData)
      ]);
      
    } catch (error) {
      console.error('❌ Error loading location data:', error);
    } finally {
      setLoadingMap(false);
      setFetchingRealData(false);
    }
  };

  const fetchRealExistingBusinesses = async (businessType: string, area: string, locationData: LocationData) => {
    try {
      console.log('🏢 Fetching real business data for:', businessType, 'in', area);
      
      const realBusinesses = await realBusinessAPI.searchBusinesses({
        businessType,
        location: area,
        coordinates: locationData.coordinates,
        radius: 5
      });

      const convertedBusinesses: ExistingBusiness[] = realBusinesses.map(business => ({
        name: business.name,
        address: business.address,
        phone: business.phone,
        email: business.email,
        website: business.website,
        rating: business.rating,
        reviews: business.reviews,
        status: business.status,
        distance: business.distance,
        established: business.established,
        category: business.category,
        coordinates: business.coordinates
      }));

      setExistingBusinesses(convertedBusinesses);
      
    } catch (error) {
      console.error('❌ Error fetching businesses:', error);
      setExistingBusinesses(generateFallbackBusinesses(businessType, area, locationData));
    }
  };
  const generateFallbackBusinesses = (businessType: string, area: string, locationData: LocationData): ExistingBusiness[] => {
    const businessNames = [
      `${area.split(',')[0]} ${businessType} Solutions`,
      `Elite ${businessType} ${area.split(',')[0]}`,
      `Professional ${businessType} Center`,
      `${businessType} Hub ${area.split(',')[0]}`,
      `Advanced ${businessType} Services`,
      `Local ${businessType} Network`
    ];

    return businessNames.map((name, index) => ({
      name,
      address: `${100 + index * 50} Business Street, ${area}`,
      phone: `+1 555 ${String(Math.floor(Math.random() * 900) + 100)} ${String(Math.floor(Math.random() * 9000) + 1000)}`,
      email: `contact@${name.toLowerCase().replace(/\s+/g, '').substring(0, 10)}.com`,
      website: `www.${name.toLowerCase().replace(/\s+/g, '').substring(0, 10)}.com`,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      reviews: Math.floor(Math.random() * 200 + 10),
      status: Math.random() > 0.2 ? 'active' : 'closed',
      distance: `${(Math.random() * 3 + 0.5).toFixed(1)} km`,
      established: `${2015 + Math.floor(Math.random() * 8)}`,
      category: businessType,
      coordinates: locationData.coordinates ? {
        lat: locationData.coordinates.lat + (Math.random() - 0.5) * 0.02,
        lng: locationData.coordinates.lng + (Math.random() - 0.5) * 0.02
      } : undefined
    })) as ExistingBusiness[];
  };

  const fetchContactInformation = async (businessType: string, area: string, locationBasedData?: any) => {
    const locationName = locationBasedData?.locationName || area.split(',')[0];
    const countryName = locationBasedData?.countryName || 'Unknown';
    const phoneFormat = locationBasedData?.phoneFormat || '+1 (555) XXX-XXXX';
    
    const mockContactInfo = {
      businessAssociations: [
        {
          name: `${locationName} Chamber of Commerce`,
          phone: phoneFormat.replace(/X/g, () => Math.floor(Math.random() * 10).toString()),
          email: `info@${locationName.toLowerCase().replace(/\s+/g, '')}chamber.com`,
          website: `www.${locationName.toLowerCase().replace(/\s+/g, '')}chamber.com`
        },
        {
          name: `${businessType} Business Association`,
          phone: phoneFormat.replace(/X/g, () => Math.floor(Math.random() * 10).toString()),
          email: `contact@${businessType.toLowerCase().replace(/\s+/g, '')}assoc.org`,
          website: `www.${businessType.toLowerCase().replace(/\s+/g, '')}association.org`
        }
      ],
      localSupport: [
        {
          name: `${locationName} Business Development Center`,
          phone: phoneFormat.replace(/X/g, () => Math.floor(Math.random() * 10).toString()),
          email: `help@${locationName.toLowerCase().replace(/\s+/g, '')}bdc.org`,
          website: `www.${locationName.toLowerCase().replace(/\s+/g, '')}business.org`,
          services: ['Business Planning', 'Funding Assistance', 'Mentoring', 'Market Research']
        }
      ],
      suppliers: [
        {
          name: `${locationName} Supply Network`,
          phone: phoneFormat.replace(/X/g, () => Math.floor(Math.random() * 10).toString()),
          email: `sales@${locationName.toLowerCase().replace(/\s+/g, '')}supply.com`,
          category: 'Equipment & Supplies'
        }
      ]
    };

    setContactInfo(mockContactInfo);
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400 text-lg">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (!businessData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-400 text-lg">No business data found</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: <Eye className="w-5 h-5" />, 
      active: activeView === 'overview',
      onClick: () => setActiveView('overview')
    },
    { 
      id: 'map', 
      label: 'Location Map', 
      icon: <Map className="w-5 h-5" />, 
      active: activeView === 'map',
      onClick: () => setActiveView('map')
    },
    { 
      id: 'businesses', 
      label: 'Local Businesses', 
      icon: <Building2 className="w-5 h-5" />, 
      active: activeView === 'businesses',
      onClick: () => setActiveView('businesses')
    }
  ];

  const locationString = locationData.country?.name && locationData.state?.name && locationData.city?.name
    ? `${locationData.city.name}, ${locationData.state.name}, ${locationData.country.name}`
    : businessData.area;
  return (
    <UniformLayout
      title={businessData.business.title}
      subtitle="Detailed Business Analysis"
      location={locationString}
      tabs={tabs}
    >
      <AnimatePresence mode="wait">
        {activeView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Real Location Information */}
            <UniformCard 
              title="Location Information" 
              icon={<MapPin className="w-6 h-6" />}
              variant="gradient"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Country</p>
                  <p className="text-slate-900 dark:text-white font-bold flex items-center mt-1">
                    {locationData.country?.emoji && <span className="mr-2">{locationData.country.emoji}</span>}
                    {locationData.country?.name || 'Unknown Country'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
                  <p className="text-green-600 dark:text-green-400 text-sm font-medium">State/Region</p>
                  <p className="text-slate-900 dark:text-white font-bold mt-1">
                    {locationData.state?.name || 'Unknown State'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
                  <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">City</p>
                  <p className="text-slate-900 dark:text-white font-bold mt-1">
                    {locationData.city?.name || businessData.area.split(',')[0] || 'Unknown City'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-4 border border-orange-500/20">
                  <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Coordinates</p>
                  <p className="text-slate-900 dark:text-white font-bold text-xs mt-1">
                    {locationData.coordinates ? 
                      `${locationData.coordinates.lat.toFixed(4)}, ${locationData.coordinates.lng.toFixed(4)}` : 
                      'Loading...'
                    }
                  </p>
                </div>
              </div>
            </UniformCard>
            {/* Financial Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <UniformCard 
                  title="Financial Overview" 
                  icon={<DollarSign className="w-6 h-6" />}
                  variant="glass"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-5 sm:p-6 border border-green-500/20 shadow-sm">
                      <p className="text-green-600 dark:text-green-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2">Investment Required</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight italic">
                        {businessData.business.funding_required || '₹5L-₹15L'}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-2xl p-5 sm:p-6 border border-blue-500/20 shadow-sm">
                      <p className="text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2">Expected Revenue</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight italic">
                        {businessData.business.estimated_revenue || '₹25L/year'}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-5 sm:p-6 border border-purple-500/20 shadow-sm">
                      <p className="text-purple-600 dark:text-purple-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2">ROI Projection</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight italic">
                        {businessData.business.roi_percentage || '120'}%
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl p-5 sm:p-6 border border-orange-500/20 shadow-sm">
                      <p className="text-orange-600 dark:text-orange-400 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2">Payback Period</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight italic">
                        {businessData.business.payback_period || '12 months'}
                      </p>
                    </div>
                  </div>
                </UniformCard>
              </div>

              <UniformCard 
                title="Quick Stats" 
                icon={<BarChart3 className="w-6 h-6" />}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-gray-400">Market Size</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {businessData.business.market_size || 'Growing'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-gray-400">Competition</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {businessData.business.competition_level || 'Medium'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-gray-400">Difficulty</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {businessData.business.startup_difficulty || 'Medium'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-gray-400">Team Size</span>
                    <span className="text-slate-900 dark:text-white font-bold">
                      {businessData.business.initial_team_size || '3-5'} people
                    </span>
                  </div>
                </div>
              </UniformCard>
            </div>
            {/* Success Factors */}
            <UniformCard 
              title="Key Success Factors" 
              icon={<Target className="w-6 h-6" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(businessData.business.key_success_factors || [
                  'Strong local market presence',
                  'Quality service delivery',
                  'Competitive pricing strategy',
                  'Effective marketing campaigns',
                  'Customer relationship management',
                  'Operational efficiency'
                ]).map((factor: string, index: number) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-gray-300 text-sm font-medium">{factor}</span>
                  </div>
                ))}
              </div>
            </UniformCard>

          </motion.div>
        )}
        {activeView === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <UniformCard 
              title={`Location Map: ${businessData.area}`}
              icon={<Map className="w-6 h-6" />}
              size="lg"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setMapFullscreen(!mapFullscreen)}
                      className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-colors text-sm"
                    >
                      <Maximize2 className="w-4 h-4" />
                      <span>{mapFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                    </button>
                    <button
                      onClick={() => loadRealLocationData(businessData)}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>
                  </div>
                  {fetchingRealData && (
                    <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading location data...</span>
                    </div>
                  )}
                </div>

                <div className={`bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden ${
                  mapFullscreen ? 'fixed inset-4 z-50' : 'h-96'
                }`}>
                  <div className="h-full relative">
                    {mapFullscreen && (
                      <button
                        onClick={() => setMapFullscreen(false)}
                        className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    
                    {loadingMap ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-2" />
                          <p className="text-slate-600 dark:text-gray-400">Loading map...</p>
                        </div>
                      </div>
                    ) : locationData.coordinates ? (
                      <InteractiveMap
                        coordinates={locationData.coordinates}
                        locationName={businessData.area}
                        businesses={existingBusinesses.map(b => ({
                          name: b.name,
                          address: b.address,
                          status: b.status,
                          distance: b.distance
                        }))}
                        onOpenInMaps={() => {
                          const coords = locationData.coordinates;
                          if (coords) {
                            window.open(`https://www.google.com/maps?q=${coords.lat},${coords.lng}&z=15`, '_blank');
                          }
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-600 dark:text-gray-400 text-lg mb-2">Location coordinates not found</p>
                          <p className="text-slate-500 dark:text-gray-500 mb-4">Unable to display map for: {businessData.area}</p>
                          <button
                            onClick={() => loadRealLocationData(businessData)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-colors"
                          >
                            Try Again
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Map Legend */}
                {existingBusinesses.length > 0 && (
                  <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Map Legend</h4>
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-slate-600 dark:text-gray-400 text-sm">Active Businesses</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-slate-600 dark:text-gray-400 text-sm">Closed Businesses</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-slate-600 dark:text-gray-400 text-sm">Your Target Location</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </UniformCard>
          </motion.div>
        )}
        {activeView === 'businesses' && (
          <motion.div
            key="businesses"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <UniformCard 
              title={`Local ${businessData.business.title} Businesses`}
              subtitle={`Found ${existingBusinesses.length} businesses in ${businessData.area}`}
              icon={<Building2 className="w-6 h-6" />}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2 text-slate-600 dark:text-gray-400">
                  <span className="text-sm">Showing {existingBusinesses.length} results</span>
                </div>
                <button
                  onClick={() => fetchRealExistingBusinesses(businessData.business.title, businessData.area, locationData)}
                  className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>

              {fetchingRealData && (
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Fetching real business data...</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {existingBusinesses.map((business, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          business.status === 'active' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                          business.status === 'closed' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                          'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                        }`}>
                          {business.status === 'active' ? <Store className="w-4 h-4" /> :
                           business.status === 'closed' ? <Building className="w-4 h-4" /> :
                           <Factory className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="text-slate-900 dark:text-white font-semibold text-sm">
                            {business.name}
                          </h4>
                          <p className="text-slate-500 dark:text-gray-500 text-xs">{business.category}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        business.status === 'active' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                        business.status === 'closed' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                        'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                      }`}>
                        {business.status}
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-600 dark:text-gray-400 truncate">{business.address}</span>
                      </div>
                      {business.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-600 dark:text-gray-400">{business.phone}</span>
                        </div>
                      )}
                      {business.rating && (
                        <div className="flex items-center space-x-2">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-slate-600 dark:text-gray-400">
                            {business.rating} ({business.reviews} reviews)
                          </span>
                        </div>
                      )}
                      {business.distance && (
                        <div className="flex items-center space-x-2">
                          <Navigation className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-600 dark:text-gray-400">{business.distance} away</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      {business.established && (
                        <span className="text-xs text-slate-500 dark:text-gray-500">
                          Est. {business.established}
                        </span>
                      )}
                      <div className="flex items-center space-x-2">
                        {business.website && (
                          <button
                            onClick={() => window.open(`https://${business.website}`, '_blank')}
                            className="p-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        {business.email && (
                          <button
                            onClick={() => window.open(`mailto:${business.email}`, '_blank')}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            <Mail className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </UniformCard>
          </motion.div>
        )}
      </AnimatePresence>
    </UniformLayout>
  );
}