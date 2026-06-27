import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import IncidentReportCard from '../components/cards/IncidentReportCard';
import { MOCK_CATEGORIES } from '../data/mockIncidents';
import { Grid, Map, Filter, RefreshCw, Info, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLiveIncidents, toggleVerification } from '../services/firebase/firestoreService';

const parseCoordinates = (locationText, incidentId = '') => {
  if (!locationText) {
    return { lat: 37.7749, lng: -122.4194 };
  }

  const decDirRegex = /(-?\d+\.\d+)\s*[°,°]?\s*([NS])\s*,\s*(-?\d+\.\d+)\s*[°,°]?\s*([EW])/i;
  const dirMatch = locationText.match(decDirRegex);
  if (dirMatch) {
    let lat = parseFloat(dirMatch[1]);
    let lng = parseFloat(dirMatch[3]);
    if (dirMatch[2].toUpperCase() === 'S') lat = -lat;
    if (dirMatch[4].toUpperCase() === 'W') lng = -lng;
    return { lat, lng };
  }

  const simpleDecRegex = /(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/;
  const simpleMatch = locationText.match(simpleDecRegex);
  if (simpleMatch) {
    return {
      lat: parseFloat(simpleMatch[1]),
      lng: parseFloat(simpleMatch[2])
    };
  }

  // Stable coordinates hashing fallback based on incident details
  let hash = 0;
  const str = incidentId || locationText;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const stableOffsetLat = Math.abs((hash % 100) / 2500); // 0.0 to 0.04
  const stableOffsetLng = Math.abs(((hash >> 8) % 100) / 2000); // 0.0 to 0.05

  return {
    lat: 37.75 + stableOffsetLat,
    lng: -122.45 + stableOffsetLng
  };
};

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

export default function Feed() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [verifiedMap, setVerifiedMap] = useState({}); // track local verification clicks
  const [selectedMapIncident, setSelectedMapIncident] = useState(null);

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

  // Filter criteria logic
  const filteredIncidents = incidents.filter(incident => {
    const dept = incident.authority?.department || '';
    const issueType = incident.analysis?.issueType || '';
    const category = getCategoryKey(dept, issueType);
    const severity = incident.analysis?.severity?.toLowerCase() || 'medium';

    const matchesCategory = selectedCategory === 'all' || category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || severity === selectedSeverity;
    return matchesCategory && matchesSeverity;
  });

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
        /* Telemetry Map Mock View */
        <Card className="p-0 h-[500px] md:h-[600px] relative overflow-hidden flex flex-col justify-end">
          {/* Vector grid background representing a city map */}
          <div className="absolute inset-0 bg-[#F1F5F9] bg-[linear-gradient(rgba(226,232,240,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(226,232,240,0.5)_1px,transparent_1px)] bg-[size:32px_32px] overflow-hidden">
            {/* Styled roads overlay */}
            <div className="absolute top-1/3 left-0 right-0 h-8 bg-white/70 border-y border-borders/50 rotate-[-4deg] flex items-center justify-center text-[10px] text-muted-text font-semibold uppercase tracking-wider select-none">
              Broadway Expressway
            </div>
            <div className="absolute top-0 bottom-0 left-1/3 w-8 bg-white/70 border-x border-borders/50 rotate-[12deg] flex items-center justify-center text-[10px] text-muted-text font-semibold uppercase tracking-wider select-none write-vertical">
              Oak Avenue Connector
            </div>
            <div className="absolute top-2/3 left-0 right-0 h-6 bg-white/70 border-y border-borders/50 rotate-[2deg]" />
            <div className="absolute top-0 bottom-0 left-2/3 w-6 bg-white/70 border-x border-borders/50 rotate-[-5deg]" />

            {/* Park Zone */}
            <div className="absolute top-12 right-12 w-32 h-32 rounded-3xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
              <span className="text-[10px] font-bold text-emerald-800/60 uppercase tracking-widest">Central Park</span>
            </div>

            {/* Interactive Pins */}
            {filteredIncidents.map(incident => {
              // Convert coordinates to mock CSS percentages
              // San Francisco coordinate mapper for demo consistency
              const coords = parseCoordinates(incident.location || '', incident.id);
              const xPercent = ((coords.lng + 122.45) / 0.06) * 100;
              const yPercent = ((37.80 - coords.lat) / 0.05) * 100;

              const severity = incident.analysis?.severity?.toLowerCase() || 'medium';
              const isCritical = severity === 'critical' || severity === 'high';
              const priorityScore = typeof incident.analysis?.riskScore === 'number'
                ? incident.analysis.riskScore
                : parseFloat(incident.analysis?.riskScore) || 5.0;

              return (
                <button
                  key={incident.id}
                  onClick={() => setSelectedMapIncident(incident)}
                  style={{ left: `${Math.max(10, Math.min(xPercent, 90))}%`, top: `${Math.max(10, Math.min(yPercent, 90))}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                >
                  {/* Pin Circle Ripple */}
                  <span className={`absolute -inset-2.5 rounded-full animate-ping opacity-45
                    ${isCritical ? 'bg-danger' : 'bg-warning'}
                  `} />
                  
                  {/* Pin Dot */}
                  <div className={`w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center font-display font-black text-[9px] text-white transition-transform group-hover:scale-125
                    ${isCritical ? 'bg-danger' : 'bg-warning'}
                  `}>
                    {priorityScore.toFixed(0)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Map Legend */}
          <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-xs border border-borders p-3 rounded-xl shadow-xs text-xs flex flex-col gap-1.5 select-none">
            <h4 className="font-bold text-primary-text mb-0.5">Map Priority Scale</h4>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-danger inline-block border border-white shadow-xs" />
              <span>High / Critical (Score 8.0+)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-warning inline-block border border-white shadow-xs" />
              <span>Medium (Score 5.0 - 7.9)</span>
            </div>
          </div>

          {/* Incident Detail Drawer/Overlay */}
          <AnimatePresence>
            {selectedMapIncident && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-10"
              >
                <Card className="p-4 shadow-xl border-primary-accent/20 bg-surface/95 backdrop-blur-xs text-left relative flex flex-col gap-3">
                  <button
                    onClick={() => setSelectedMapIncident(null)}
                    className="absolute top-3 right-3 text-muted-text hover:text-primary-text cursor-pointer"
                  >
                    ×
                  </button>

                  <div className="flex items-center gap-2">
                    <Badge variant={(selectedMapIncident.analysis?.severity?.toLowerCase() === 'critical' || selectedMapIncident.analysis?.severity?.toLowerCase() === 'high') ? 'danger' : 'warning'} size="xs">
                      {selectedMapIncident.analysis?.severity || 'Medium'}
                    </Badge>
                    <span className="text-[10px] text-muted-text font-bold uppercase tracking-wider">
                      {selectedMapIncident.authority?.department || 'General Operations'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-primary-text leading-tight pr-4">
                    {selectedMapIncident.analysis?.issueType || 'Incident Report'}
                  </h3>

                  <p className="text-xs text-secondary-text line-clamp-2 leading-relaxed">
                    {selectedMapIncident.summary || 'No summary details provided.'}
                  </p>

                  <div className="flex justify-between items-center pt-2 border-t border-borders/60 text-xs gap-3">
                    <span className="text-muted-text truncate flex-1">
                      {selectedMapIncident.location}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/incident/${selectedMapIncident.id}`)}
                        className="px-2.5 py-1 text-[10px] rounded-lg font-bold border border-borders hover:border-primary-accent hover:text-primary-accent bg-surface cursor-pointer select-none"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleVerify(selectedMapIncident.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded-lg font-bold border transition-all cursor-pointer
                          ${verifiedMap[selectedMapIncident.id]
                            ? 'bg-primary-accent/10 border-primary-accent/20 text-primary-accent'
                            : 'bg-surface border-borders text-secondary-text hover:border-primary-accent hover:text-primary-accent'
                          }
                        `}
                      >
                        Verify ({selectedMapIncident.verificationCount || 0})
                      </button>
                    </div>
                  </div>

                  {selectedMapIncident.authority?.department && (
                    <div className="mt-1 bg-secondary-surface/40 rounded-lg p-2.5 text-[10px] text-secondary-text flex flex-col gap-1 border border-borders/40">
                      <span className="font-bold text-primary-accent flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        AI Dispatch Route:
                      </span>
                      <p className="leading-normal">{selectedMapIncident.authority.department}</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}
    </div>
  );
}
