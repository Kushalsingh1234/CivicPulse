import React, { useState, useEffect, useRef, useMemo } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import IncidentReportCard from '../components/cards/IncidentReportCard';
import { MOCK_CATEGORIES } from '../data/mockIncidents';
import { Grid, Map, MapPin, Filter, RefreshCw, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLiveIncidents, toggleVerification, updateIncident } from '../services/firebase/firestoreService';
import IncidentMap from '../components/maps/IncidentMap';

const SkeletonCard = () => (
  <Card className="flex flex-col md:flex-row gap-6 p-0! h-full animate-pulse border-borders/60 select-none">
    <div className="w-full md:w-1/3 min-h-[200px] md:min-h-auto bg-[#e2e8f0]/40 shrink-0" />
    <div className="flex flex-col justify-between p-6 md:p-8 flex-1 gap-6">
      <div>
        <div className="flex gap-2 items-center mb-3">
          <div className="w-20 h-5 bg-[#e2e8f0]/50 rounded-full" />
          <div className="w-16 h-5 bg-[#e2e8f0]/50 rounded-full" />
        </div>
        <div className="w-3/4 h-6 bg-[#e2e8f0]/50 rounded-lg mb-2" />
        <div className="w-1/3 h-4 bg-[#e2e8f0]/50 rounded-lg mb-3" />
        <div className="w-full h-4 bg-[#e2e8f0]/50 rounded-lg mb-1.5" />
        <div className="w-5/6 h-4 bg-[#e2e8f0]/50 rounded-lg" />
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-borders/60">
        <div className="w-1/2 h-4 bg-[#e2e8f0]/50 rounded-lg" />
        <div className="w-24 h-8 bg-[#e2e8f0]/50 rounded-xl" />
      </div>
    </div>
  </Card>
);

const extractCityFromLocation = (location = '', fallbackCity = 'Unknown') => {
  const locLower = location.toLowerCase();
  if (locLower.includes('new delhi') || locLower.includes('delhi')) return 'New Delhi';
  if (locLower.includes('mumbai') || locLower.includes('bombay')) return 'Mumbai';
  if (locLower.includes('lucknow')) return 'Lucknow';
  if (locLower.includes('gorakhpur')) return 'Gorakhpur';
  return fallbackCity;
};

export default function Feed() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [verifiedMap, setVerifiedMap] = useState({}); // track local verification clicks

  const unsubscribeRef = useRef(null);

  const connectFeed = () => {
    setIsLoading(true);
    setError(null);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    try {
      unsubscribeRef.current = getLiveIncidents(
        (data) => {
          setIncidents(data);
          setIsLoading(false);
        },
        (err) => {
          console.error(err);
          setError(err.message || 'Failed to connect to the operations database.');
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to initialize feed connection.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    connectFeed();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const geocodingInProgress = useRef(new Set());

  // One-time geocoding recovery for incidents missing latitude/longitude
  useEffect(() => {
    if (incidents.length === 0) return;

    const incidentsToGeocode = incidents.filter(incident => {
      const missingCoords = typeof incident.latitude !== 'number' || typeof incident.longitude !== 'number';
      const hasAddressInfo = !!(incident.location || incident.city || incident.state || incident.country);
      const notInProgress = !geocodingInProgress.current.has(incident.id);
      return missingCoords && hasAddressInfo && notInProgress;
    });

    if (incidentsToGeocode.length === 0) return;

    const geocodeSequential = async () => {
      for (const incident of incidentsToGeocode) {
        geocodingInProgress.current.add(incident.id);

        let city = incident.city || 'Unknown';
        if (city === 'Unknown' && incident.location) {
          city = extractCityFromLocation(incident.location, 'Unknown');
        }

        const queryParts = [];
        if (incident.location) queryParts.push(incident.location);
        if (city && city !== 'Unknown') queryParts.push(city);
        if (incident.state && incident.state !== 'Unknown') queryParts.push(incident.state);
        if (incident.country && incident.country !== 'Unknown') queryParts.push(incident.country);

        const queryStr = queryParts.join(', ');
        if (!queryStr.trim()) continue;

        try {
          // Delay to respect OpenStreetMap Nominatim request guidelines (max 1/sec)
          await new Promise(resolve => setTimeout(resolve, 1000));

          let response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(queryStr)}&limit=1`,
            {
              headers: {
                'Accept-Language': 'en-US,en;q=0.9',
                'User-Agent': 'CivicPulse-AI-Operations'
              }
            }
          );

          let data = [];
          if (response.ok) {
            data = await response.json();
          }

          // Fallback geocoding at city level if specific address resolves to empty
          if ((!data || data.length === 0) && city !== 'Unknown') {
            const fallbackQuery = `${city}, ${incident.state || ''}, ${incident.country || 'India'}`;
            const fallbackResponse = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(fallbackQuery)}&limit=1`,
              {
                headers: {
                  'Accept-Language': 'en-US,en;q=0.9',
                  'User-Agent': 'CivicPulse-AI-Operations'
                }
              }
            );
            if (fallbackResponse.ok) {
              data = await fallbackResponse.json();
            }
          }

          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);

            if (!isNaN(lat) && !isNaN(lon)) {
              const addr = data[0].address || {};
              const resolvedCity = addr.city || addr.town || addr.village || addr.suburb || city;
              const resolvedState = addr.state || 'Unknown';
              const resolvedCountry = addr.country || 'Unknown';

              console.log(`Recovered coordinates for incident ${incident.id}: ${lat}, ${lon}, resolved city: ${resolvedCity}`);
              
              const fieldsToUpdate = {
                latitude: lat,
                longitude: lon,
                coordinateSource: 'Recovered'
              };

              // Update Firestore properties if empty/Unknown
              if (!incident.city || incident.city === 'Unknown') fieldsToUpdate.city = resolvedCity;
              if (!incident.state || incident.state === 'Unknown') fieldsToUpdate.state = resolvedState;
              if (!incident.country || incident.country === 'Unknown') fieldsToUpdate.country = resolvedCountry;

              await updateIncident(incident.id, fieldsToUpdate);
            }
          }
        } catch (err) {
          console.error(`Failed to geocode incident ${incident.id}:`, err);
        }
      }
    };

    geocodeSequential();
  }, [incidents]);

  // Toggle local verification upvote
  const handleVerify = async (id) => {
    const isAlreadyVerified = !!verifiedMap[id];
    
    // Optimistic UI updates
    setVerifiedMap(prev => ({
      ...prev,
      [id]: !isAlreadyVerified
    }));

    setIncidents(currentList =>
      currentList.map(item => {
        if (item.id === id) {
          return {
            ...item,
            verificationCount: isAlreadyVerified ? item.verificationCount - 1 : item.verificationCount + 1
          };
        }
        return item;
      })
    );

    try {
      await toggleVerification(id, !isAlreadyVerified);
    } catch (err) {
      console.error(err);
      // Revert updates on failure
      setVerifiedMap(prev => ({
        ...prev,
        [id]: isAlreadyVerified
      }));
      setIncidents(currentList =>
        currentList.map(item => {
          if (item.id === id) {
            return {
              ...item,
              verificationCount: isAlreadyVerified ? item.verificationCount + 1 : item.verificationCount - 1
            };
          }
          return item;
        })
      );
    }
  };

  const getCategoryKey = (dept = '', issueType = '') => {
    const text = `${dept} ${issueType}`.toLowerCase();
    if (text.includes('road') || text.includes('pothole') || text.includes('transit') || text.includes('transportation') || text.includes('highway') || text.includes('subsidence')) return 'roads';
    if (text.includes('water') || text.includes('sewer') || text.includes('utility') || text.includes('power') || text.includes('grid') || text.includes('electricity') || text.includes('flooding') || text.includes('leak')) return 'utilities';
    if (text.includes('light') || text.includes('lamp') || text.includes('illumination') || text.includes('lighting')) return 'lighting';
    if (text.includes('waste') || text.includes('trash') || text.includes('sanitation') || text.includes('dump') || text.includes('environmental') || text.includes('dumping')) return 'sanitation';
    if (text.includes('safety') || text.includes('police') || text.includes('fire') || text.includes('emergency') || text.includes('security') || text.includes('junction') || text.includes('hazard')) return 'safety';
    return 'roads';
  };

  // Dynamically extract unique cities from Firestore data to build select options
  const uniqueCities = useMemo(() => {
    const citiesSet = new Set();
    incidents.forEach(inc => {
      let city = inc.city || 'Unknown';
      if (city === 'Unknown' && inc.location) {
        city = extractCityFromLocation(inc.location, 'Unknown');
      }
      if (city && city !== 'Unknown') {
        citiesSet.add(city);
      }
    });
    return [...citiesSet].sort();
  }, [incidents]);

  // Memoize filtered incidents based on category, severity, and city scope
  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const dept = incident.authority?.department || '';
      const issueType = incident.analysis?.issueType || '';
      const category = getCategoryKey(dept, issueType);
      const severity = incident.analysis?.severity?.toLowerCase() || 'medium';
      
      let city = incident.city || 'Unknown';
      if (city === 'Unknown' && incident.location) {
        city = extractCityFromLocation(incident.location, 'Unknown');
      }

      const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
      const matchesSeverity = selectedSeverity === 'all' || severity === selectedSeverity;
      const matchesCity = selectedCity === 'All Cities' || city.toLowerCase() === selectedCity.toLowerCase();

      return matchesCategory && matchesSeverity && matchesCity;
    });
  }, [incidents, selectedCategory, selectedSeverity, selectedCity]);

  // Memoize GIS Analytics Panel metrics calculated directly from state
  const stats = useMemo(() => {
    let activeCount = filteredIncidents.length;
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let totalPriority = 0;
    let highestRiskIncident = null;

    filteredIncidents.forEach(inc => {
      const severity = inc.analysis?.severity?.toLowerCase() || 'medium';
      if (severity === 'critical') criticalCount++;
      else if (severity === 'high') highCount++;
      else if (severity === 'medium') mediumCount++;
      else if (severity === 'low') lowCount++;

      const score = typeof inc.analysis?.riskScore === 'number'
        ? inc.analysis.riskScore
        : parseFloat(inc.analysis?.riskScore) || 5.0;
      totalPriority += score;

      if (!highestRiskIncident) {
        highestRiskIncident = inc;
      } else {
        const currentHighestScore = typeof highestRiskIncident.analysis?.riskScore === 'number'
          ? highestRiskIncident.analysis.riskScore
          : parseFloat(highestRiskIncident.analysis?.riskScore) || 5.0;
        if (score > currentHighestScore) {
          highestRiskIncident = inc;
        }
      }
    });

    const averagePriority = activeCount > 0 ? (totalPriority / activeCount) : 0;
    const highestRiskArea = highestRiskIncident
      ? (highestRiskIncident.landmark || highestRiskIncident.location || 'N/A')
      : 'N/A';

    return {
      activeCount,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      averagePriority,
      highestRiskArea
    };
  }, [filteredIncidents]);

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Page Header */}
      <PageHeader
        title="Community Feed"
        description="Public log of civic infrastructure issues. Citizen verification helps prioritize dispatches in the Operations Center."
        actions={
          <div className="flex items-center gap-2 border border-borders bg-surface p-1 rounded-xl shadow-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer
                ${viewMode === 'list'
                  ? 'bg-primary-accent text-white shadow-xs'
                  : 'text-secondary-text hover:text-primary-text'
                }
              `}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer
                ${viewMode === 'map'
                  ? 'bg-primary-accent text-white shadow-xs'
                  : 'text-secondary-text hover:text-primary-text'
                }
              `}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Telemetry Map</span>
            </button>
          </div>
        }
      />

      {/* Filter Options */}
      <Card className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Categories (horizontal scroll on mobile, wrap on desktop) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none w-full md:w-auto -mx-4 px-4 md:mx-0 md:px-0">
          {MOCK_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border shrink-0 transition-all cursor-pointer
                ${selectedCategory === category.id
                  ? 'bg-primary-accent border-primary-accent text-white shadow-xs'
                  : 'bg-surface border-borders text-secondary-text hover:border-primary-accent/40'
                }
              `}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Dropdown filters */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-text" />
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="border border-borders rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-secondary-text focus:outline-none focus:border-primary-accent"
            >
              <option value="All Cities">All Cities</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-text" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="border border-borders rounded-xl bg-surface px-3 py-2 text-xs font-semibold text-secondary-text focus:outline-none focus:border-primary-accent"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* View Modes */}
      {error ? (
        /* Error State with Retry Button */
        <Card className="text-center py-16 flex flex-col items-center justify-center max-w-lg mx-auto">
          <AlertTriangle className="w-12 h-12 text-danger mb-4 stroke-[1.5]" />
          <h3 className="text-lg font-bold text-primary-text mb-1">Failed to Load Community Feed</h3>
          <p className="text-sm text-secondary-text mb-6">{error}</p>
          <Button variant="primary" onClick={connectFeed} icon={RefreshCw}>
            Retry Connection
          </Button>
        </Card>
      ) : isLoading ? (
        viewMode === 'list' ? (
          /* Loading Skeleton Cards */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : (
          /* Loading Map State */
          <Card className="flex flex-col items-center justify-center p-8 h-[500px] md:h-[600px] shadow-sm animate-pulse bg-secondary-surface/20 border border-borders/40">
            <Loader2 className="w-10 h-10 animate-spin text-primary-accent mb-4" />
            <p className="text-sm text-secondary-text">Loading telemetry positions...</p>
          </Card>
        )
      ) : viewMode === 'list' ? (
        filteredIncidents.length > 0 ? (
          /* List View Grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredIncidents.map(incident => (
              <IncidentReportCard
                key={incident.id}
                incident={incident}
                onVerify={handleVerify}
                isVerifying={verifiedMap[incident.id]}
                onViewDetails={() => navigate(`/incident/${incident.id}`)}
              />
            ))}
          </div>
        ) : (
          /* Empty state */
          <Card className="text-center py-16 flex flex-col items-center justify-center">
            <Info className="w-12 h-12 text-muted-text mb-4 stroke-[1.5]" />
            <h3 className="text-lg font-bold text-primary-text mb-1">No incidents reported yet</h3>
            <p className="text-sm text-secondary-text">Reported issues from the AI Incident Analyzer will appear here automatically.</p>
          </Card>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live City GIS Analytics Panel */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card className="p-6 border border-borders shadow-xs flex flex-col gap-5 text-left h-full justify-between">
              <div>
                <h3 className="text-sm font-bold text-primary-text border-b border-borders/60 pb-3 flex items-center gap-2 select-none">
                  <Grid className="w-4 h-4 text-primary-accent" />
                  City Analytics
                </h3>
                
                <div className="flex flex-col gap-4 text-xs mt-4">
                  <div className="flex justify-between items-center py-2 border-b border-borders/40">
                    <span className="font-semibold text-secondary-text">Current City:</span>
                    <span className="font-bold text-primary-text">{selectedCity}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-borders/40">
                    <span className="font-semibold text-secondary-text">Active Reports:</span>
                    <span className="font-bold text-primary-text">{stats.activeCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-borders/40">
                    <span className="font-semibold text-secondary-text">Critical Severity:</span>
                    <span className="font-bold text-danger">{stats.criticalCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-borders/40">
                    <span className="font-semibold text-secondary-text">High Severity:</span>
                    <span className="font-bold text-amber-600">{stats.highCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-borders/40">
                    <span className="font-semibold text-secondary-text">Medium Severity:</span>
                    <span className="font-bold text-amber-500">{stats.mediumCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-borders/40">
                    <span className="font-semibold text-secondary-text">Low Severity:</span>
                    <span className="font-bold text-emerald-600">{stats.lowCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-borders/40">
                    <span className="font-semibold text-secondary-text">Highest Risk Area:</span>
                    <span className="font-bold text-primary-text truncate max-w-[150px] text-right" title={stats.highestRiskArea}>
                      {stats.highestRiskArea}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-borders/60 text-xs">
                <span className="font-semibold text-secondary-text">Average Priority:</span>
                <span className="font-bold text-primary-accent text-sm">
                  {stats.averagePriority.toFixed(1)} / 10.0
                </span>
              </div>
            </Card>
          </div>

          {/* Leaflet GIS Map Container */}
          <div className="lg:col-span-2 h-[500px] md:h-[600px] w-full">
            <IncidentMap incidents={filteredIncidents} selectedCity={selectedCity} />
          </div>
        </div>
      )}
    </div>
  );
}
