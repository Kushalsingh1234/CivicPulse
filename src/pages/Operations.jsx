import React, { useState, useEffect, useRef, useMemo } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { 
  Layers, 
  Activity, 
  Truck, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle, 
  ShieldAlert, 
  Loader2, 
  Info,
  Calendar,
  Sparkles,
  MapPin,
  MessageSquare,
  X,
  Send,
  Trash2
} from 'lucide-react';
import { getLiveIncidents, updateIncidentStatus, getFirestoreCachedIntelligence, setFirestoreCachedIntelligence } from '../services/firebase/firestoreService';
import { generateCityIntelligence, generateDatasetFingerprint, getInMemoryCachedIntelligence, cacheIntelligenceInMemory } from '../services/gemini/cityIntelligenceService';
import { askCopilot } from '../services/gemini/copilotService';

const SkeletonMetrics = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
      <Card key={i} className="p-6 animate-pulse bg-secondary-surface/20 border border-borders/40">
        <div className="flex justify-between items-start mb-2">
          <div className="w-12 h-3 bg-[#e2e8f0]/50 rounded-lg" />
          <div className="w-4 h-4 bg-[#e2e8f0]/50 rounded-full" />
        </div>
        <div className="w-8 h-8 bg-[#e2e8f0]/50 rounded-lg" />
      </Card>
    ))}
  </div>
);

const SkeletonQueue = () => (
  <div className="divide-y divide-borders">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="p-5 flex items-start gap-4 animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-[#e2e8f0]/50 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="w-16 h-3 bg-[#e2e8f0]/50 rounded-lg mb-2" />
          <div className="w-3/4 h-4 bg-[#e2e8f0]/50 rounded-lg mb-1.5" />
          <div className="w-1/2 h-3 bg-[#e2e8f0]/50 rounded-lg" />
        </div>
        <div className="w-4 h-4 bg-[#e2e8f0]/50 rounded-full shrink-0 self-center" />
      </div>
    ))}
  </div>
);

const parseWorkloadVal = (workloadText) => {
  if (!workloadText) return 0;
  const cleaned = String(workloadText).toLowerCase();
  if (cleaned.includes('%')) {
    return parseInt(cleaned) || 0;
  }
  if (cleaned.includes('critical') || cleaned.includes('high') || cleaned.includes('heavy')) return 85;
  if (cleaned.includes('moderate') || cleaned.includes('medium')) return 50;
  if (cleaned.includes('routine') || cleaned.includes('low')) return 25;
  return 30;
};

const getShortWorkload = (workloadText) => {
  if (!workloadText) return 'Routine';
  const cleaned = String(workloadText).toLowerCase();
  
  // Check for percentage formats first
  const percentMatch = cleaned.match(/\d+%/);
  if (percentMatch) {
    let label = 'Active';
    if (cleaned.includes('critical')) label = 'Critical';
    else if (cleaned.includes('high') || cleaned.includes('heavy')) label = 'Heavy';
    else if (cleaned.includes('moderate') || cleaned.includes('medium')) label = 'Moderate';
    else if (cleaned.includes('routine') || cleaned.includes('low')) label = 'Low';
    return `${percentMatch[0]} - ${label}`;
  }

  // Map keywords to uniform status levels
  if (cleaned.includes('critical')) return 'Critical Load';
  if (cleaned.includes('high') || cleaned.includes('heavy') || cleaned.includes('severe')) return 'Heavy Load';
  if (cleaned.includes('moderate') || cleaned.includes('medium') || cleaned.includes('normal')) return 'Moderate Load';
  if (cleaned.includes('routine') || cleaned.includes('low') || cleaned.includes('minimal')) return 'Low Load';
  
  // Fallback to splitting by common separators or first two words
  const parts = workloadText.split(/[-:,(]/);
  const fallback = parts[0].trim();
  const words = fallback.split(/\s+/);
  if (words.length > 2) {
    return words.slice(0, 2).join(' ');
  }
  return fallback.charAt(0).toUpperCase() + fallback.slice(1);
};

const CopilotMessageContent = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let currentList = [];
  let listType = null; // 'ul' | 'ol'

  const flushList = (key) => {
    if (currentList.length > 0) {
      if (listType === 'ul') {
        elements.push(
          <ul key={key} className="list-disc pl-4 mb-2 flex flex-col gap-1 text-secondary-text">
            {currentList}
          </ul>
        );
      } else if (listType === 'ol') {
        elements.push(
          <ol key={key} className="list-decimal pl-4 mb-2 flex flex-col gap-1 text-secondary-text">
            {currentList}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    }
  };

  const parseInlineBold = (str) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-extrabold text-primary-text">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (listType !== 'ul') {
        flushList(`list-before-${idx}`);
        listType = 'ul';
      }
      currentList.push(
        <li key={`li-${idx}`} className="leading-relaxed">
          {parseInlineBold(trimmed.slice(2))}
        </li>
      );
    }
    else if (/^\d+\.\s/.test(trimmed)) {
      if (listType !== 'ol') {
        flushList(`list-before-${idx}`);
        listType = 'ol';
      }
      const markerLength = trimmed.match(/^\d+\.\s/)[0].length;
      currentList.push(
        <li key={`li-${idx}`} className="leading-relaxed">
          {parseInlineBold(trimmed.slice(markerLength))}
        </li>
      );
    }
    else {
      flushList(`list-before-plain-${idx}`);
      if (trimmed === '') {
        elements.push(<div key={`space-${idx}`} className="h-1.5" />);
      } else {
        elements.push(
          <p key={`p-${idx}`} className="leading-relaxed mb-2 text-secondary-text">
            {parseInlineBold(trimmed)}
          </p>
        );
      }
    }
  });

  flushList(`list-final`);

  return <div className="text-[11px] leading-relaxed flex flex-col">{elements}</div>;
};

export default function Operations() {
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeQueueId, setActiveQueueId] = useState(null);
  const [selectedCity, setSelectedCity] = useState('All Cities');

  // AI city intelligence states
  const [intelData, setIntelData] = useState(null);
  const [isIntelLoading, setIsIntelLoading] = useState(true);
  const [isIntelError, setIsIntelError] = useState(false);
  const [intelMetadata, setIntelMetadata] = useState(null);
  const [timeTick, setTimeTick] = useState(0);

  // AI Operations Copilot states
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isCopilotRendered, setIsCopilotRendered] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState([]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [copilotError, setCopilotError] = useState(null);

  const handleOpenCopilot = () => {
    setIsCopilotRendered(true);
    setTimeout(() => {
      setIsCopilotOpen(true);
    }, 20);
  };

  const handleCloseCopilot = () => {
    setIsCopilotOpen(false);
    setTimeout(() => {
      setIsCopilotRendered(false);
    }, 300); // matches Tailwind duration-300
  };
  
  const messagesEndRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages, isCopilotLoading]);

  const handleSendCopilotMessage = async (messageText) => {
    const trimmedText = (messageText || copilotInput).trim();
    if (!trimmedText || isCopilotLoading) return;

    setCopilotInput('');
    setCopilotError(null);

    // Push User message
    const userMsg = { id: `user-${Date.now()}`, role: 'user', text: trimmedText };
    setCopilotMessages(prev => [...prev, userMsg]);
    setIsCopilotLoading(true);

    try {
      // Build conversation payload omitting system/error messages
      const history = copilotMessages.filter(m => m.role === 'user' || m.role === 'model');
      
      const responseText = await askCopilot(
        selectedCity,
        filteredIncidents,
        intelData,
        history,
        trimmedText
      );

      const copilotMsg = { id: `copilot-${Date.now()}`, role: 'model', text: responseText };
      setCopilotMessages(prev => [...prev, copilotMsg]);
    } catch (err) {
      console.error('AI Copilot request failed:', err);
      setCopilotError('AI Copilot is temporarily unavailable.');
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // Auto-refresh cache relative age indicators every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeTick(t => t + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const intelStatusLabel = useMemo(() => {
    if (timeTick === -1) return ''; // reference timeTick to satisfy eslint exhaustive-deps
    if (!intelMetadata || isIntelLoading) return '';
    if (intelMetadata.source === 'fresh') {
      return 'Updated just now';
    }
    const elapsedMs = Date.now() - intelMetadata.timestamp;
    const elapsedMins = Math.floor(elapsedMs / 60000);
    if (elapsedMins === 0) {
      return 'Cached Intelligence';
    }
    return `Generated ${elapsedMins} minute${elapsedMins === 1 ? '' : 's'} ago`;
  }, [intelMetadata, isIntelLoading, timeTick]);

  // Derived filteredIncidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter(i => {
      if (selectedCity === 'All Cities') return true;
      return i.city === selectedCity;
    });
  }, [incidents, selectedCity]);

  const fetchCityIntelligence = async (cityName, incList) => {
    if (incList.length === 0) {
      setIntelData(null);
      setIsIntelLoading(false);
      setIsIntelError(false);
      setIntelMetadata(null);
      return;
    }

    // 1. Check in-memory cache first (Zero loader delay, instantaneous reuse)
    const memCache = getInMemoryCachedIntelligence(cityName, incList);
    if (memCache) {
      setIntelData(memCache.data);
      setIntelMetadata({ source: 'cache', timestamp: memCache.timestamp });
      setIsIntelLoading(false);
      setIsIntelError(false);
      return;
    }

    // Cache miss or different fingerprint: activate loading state
    setIsIntelLoading(true);
    setIsIntelError(false);
    try {
      const fingerprint = generateDatasetFingerprint(incList);

      // 2. Check Firestore persistent cache second
      const fsCache = await getFirestoreCachedIntelligence(cityName);
      if (fsCache && fsCache.fingerprint === fingerprint) {
        // Save to in-memory cache for fast session navigation
        cacheIntelligenceInMemory(cityName, fsCache.data, fingerprint, fsCache.timestamp);

        setIntelData(fsCache.data);
        setIntelMetadata({ source: 'cache', timestamp: fsCache.timestamp });
        return;
      }

      // 3. Request Gemini third
      const result = await generateCityIntelligence(cityName, incList);

      // Save to Firestore persistent collection
      await setFirestoreCachedIntelligence(cityName, result, fingerprint);

      // Save to in-memory cache
      cacheIntelligenceInMemory(cityName, result, fingerprint, Date.now());

      setIntelData(result);
      setIntelMetadata({ source: 'fresh', timestamp: Date.now() });
    } catch (err) {
      console.error('API Error in intelligence fetch:', err);
      setIsIntelError(true);
    } finally {
      setIsIntelLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe = getLiveIncidents(
      (data) => {
        setIncidents(data);
        setIsLoading(false);

        // Auto-select the highest priority incident on first data load
        if (data.length > 0) {
          const sorted = [...data].sort((a, b) => {
            const scoreA = typeof a.analysis?.riskScore === 'number' ? a.analysis.riskScore : parseFloat(a.analysis?.riskScore) || 0;
            const scoreB = typeof b.analysis?.riskScore === 'number' ? b.analysis.riskScore : parseFloat(b.analysis?.riskScore) || 0;
            return scoreB - scoreA;
          });

          setActiveQueueId((currentId) => {
            if (!currentId || !data.some(item => item.id === currentId)) {
              return sorted[0].id;
            }
            return currentId;
          });
        } else {
          setActiveQueueId(null);
        }
      },
      (err) => {
        console.error(err);
        setError(err.message || 'Failed to connect to the operations database.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Decoupled Effect: Trigger AI summary fetch whenever the incidents database snapshot list changes
  useEffect(() => {
    if (!isLoading) {
      fetchCityIntelligence(selectedCity, filteredIncidents);
    }
  }, [selectedCity, filteredIncidents, isLoading]);

  const handleUpdateStatus = async (id, newStatus) => {
    // Optimistic UI updates
    setIncidents(prevList =>
      prevList.map(item => {
        if (item.id === id) {
          return {
            ...item,
            status: newStatus
          };
        }
        return item;
      })
    );

    try {
      await updateIncidentStatus(id, newStatus);
    } catch (err) {
      console.error(err);
      alert('Failed to update operational status: ' + err.message);
    }
  };

  // Metrics computation
  const uniqueCities = [...new Set(incidents.map(i => i.city).filter(Boolean))].sort();



  const totalCount = filteredIncidents.length;
  const openCount = filteredIncidents.filter(i => i.status?.toLowerCase() === 'open' || i.status?.toLowerCase() === 'reported').length;
  const inProgressCount = filteredIncidents.filter(i => i.status?.toLowerCase() === 'in progress' || i.status?.toLowerCase() === 'dispatched').length;
  const resolvedCount = filteredIncidents.filter(i => i.status?.toLowerCase() === 'resolved').length;
  const criticalCount = filteredIncidents.filter(i => i.analysis?.severity?.toLowerCase() === 'critical' || i.analysis?.severity?.toLowerCase() === 'high').length;

  const totalPriorityScore = filteredIncidents.reduce((sum, i) => {
    const score = typeof i.analysis?.riskScore === 'number' ? i.analysis.riskScore : parseFloat(i.analysis?.riskScore) || 0;
    return sum + score;
  }, 0);
  const avgPriorityScore = totalCount > 0 ? totalPriorityScore / totalCount : 0.0;

  // Filter reported today count
  const todayCount = filteredIncidents.filter(i => {
    if (!i.createdAt) return false;
    const createdDate = new Date(i.createdAt);
    const today = new Date();
    return createdDate.getDate() === today.getDate() &&
           createdDate.getMonth() === today.getMonth() &&
           createdDate.getFullYear() === today.getFullYear();
  }).length;

  const metrics = [
    { label: 'Total Logs', value: totalCount, icon: Layers, color: 'text-primary-accent' },
    { label: 'Open Queue', value: openCount, icon: AlertCircle, color: 'text-amber-500' },
    { label: 'In Progress', value: inProgressCount, icon: Truck, color: 'text-secondary-accent' },
    { label: 'Resolved', value: resolvedCount, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Critical Esc', value: criticalCount, icon: ShieldAlert, color: 'text-danger' },
    { label: 'Avg Priority', value: avgPriorityScore.toFixed(1), icon: Activity, color: 'text-primary-accent' },
    { label: 'Reported Today', value: todayCount, icon: Calendar, color: 'text-primary-accent' }
  ];

  // Sorting priorities descending
  const sortedQueue = [...filteredIncidents].sort((a, b) => {
    const scoreA = typeof a.analysis?.riskScore === 'number' ? a.analysis.riskScore : parseFloat(a.analysis?.riskScore) || 0;
    const scoreB = typeof b.analysis?.riskScore === 'number' ? b.analysis.riskScore : parseFloat(b.analysis?.riskScore) || 0;
    return scoreB - scoreA;
  });

  const activeIncident = incidents.find(item => item.id === activeQueueId);

  const categoryLabels = {
    roads: 'Roads & Potholes',
    utilities: 'Utilities & Water',
    lighting: 'Street Lighting',
    sanitation: 'Sanitation & Waste',
    safety: 'Public Safety'
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

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'just now';
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const seconds = Math.floor((now - date) / 1000);
      
      if (seconds < 60) return 'just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'just now';
    }
  };

  // Get department workload percentage from AI intel or direct calculation
  const getDeptPercentage = (deptName) => {
    if (!intelData?.departmentWorkload || !Array.isArray(intelData.departmentWorkload)) {
      if (incidents.length === 0) return 0;
      const activeInc = incidents.filter(i => i.status?.toLowerCase() !== 'resolved');
      if (activeInc.length === 0) return 0;
      const deptCount = activeInc.filter(i => {
        const dName = (i.authority?.department || '').toLowerCase();
        return dName.includes(deptName.toLowerCase());
      }).length;
      return Math.round((deptCount / activeInc.length) * 100);
    }
    const match = intelData.departmentWorkload.find(item => {
      const name = item?.department ? String(item.department).toLowerCase() : '';
      return name.includes(deptName.toLowerCase());
    });
    return match ? Number(match.percentage) || 0 : 0;
  };

  const dpwLoad = getDeptPercentage('Works') || getDeptPercentage('road') || 0;
  const waterLoad = getDeptPercentage('Water') || getDeptPercentage('utility') || 0;
  const electLoad = getDeptPercentage('Electrical') || getDeptPercentage('lighting') || 0;
  const sanitationLoad = getDeptPercentage('Sanitation') || getDeptPercentage('waste') || 0;
  const safetyLoad = getDeptPercentage('Safety') || getDeptPercentage('police') || 0;

  return (
    <>
      <div className="flex flex-col gap-8 text-left">
      {/* Header */}
      <PageHeader
        title="Operations Center"
        description="AI-Prioritized municipal dashboard. View realtime visual analyses, resolve incidents, and dispatch responder teams."
      />

      {/* City Selector Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-borders bg-surface p-4 rounded-2xl shadow-xs select-none">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-accent" />
          <div>
            <p className="text-sm font-bold text-primary-text">Operational Scope Area</p>
            <p className="text-xs text-secondary-text">Filter queue, diagnostics, and metrics by municipality</p>
          </div>
        </div>
        
        <div className="relative min-w-[200px]">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full bg-surface border border-borders text-secondary-text text-xs rounded-xl px-3 py-2.5 font-semibold cursor-pointer outline-none hover:border-primary-accent transition-colors"
          >
            <option value="All Cities">All Cities</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      {isLoading ? (
        <SkeletonMetrics />
      ) : error ? (
        <Card className="p-6 border-danger/25 bg-danger/5 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-danger" />
          <div className="text-xs">
            <p className="font-bold text-primary-text">Operational Database Sync Issue</p>
            <p className="text-secondary-text mt-0.5">{error}</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
          {metrics.map((metric, idx) => (
            <Card key={idx} className="p-6 border border-borders shadow-xs hover:border-primary-accent/10 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-secondary-text uppercase tracking-wider">{metric.label}</span>
                <metric.icon className={`w-4 h-4 ${metric.color}`} />
              </div>
              <span className="text-2xl font-extrabold text-primary-text font-display">
                {metric.value}
              </span>
            </Card>
          ))}
        </div>
      )}

      {/* Dashboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Queue List & AI Intelligence (Col: 2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-0! overflow-hidden border border-borders shadow-xs">
            <div className="px-6 py-5 border-b border-borders flex items-center justify-between bg-secondary-surface/40 select-none">
              <h2 className="text-sm font-bold text-primary-text flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-primary-accent animate-pulse" />
                Live Incident Dispatch Queue
              </h2>
              <span className="text-xs text-muted-text font-semibold">Priority Ordering</span>
            </div>

            {isLoading ? (
              <SkeletonQueue />
            ) : sortedQueue.length > 0 ? (
              <div className="divide-y divide-borders">
                {sortedQueue.map((item) => {
                  const isSelected = item.id === activeQueueId;
                  const severity = item.analysis?.severity?.toLowerCase() || 'medium';
                  const isCritical = severity === 'critical' || severity === 'high';
                  const score = typeof item.analysis?.riskScore === 'number' ? item.analysis.riskScore : parseFloat(item.analysis?.riskScore) || 5.0;
                  
                  const dept = item.authority?.department || 'General Operations';
                  const categoryKey = getCategoryKey(dept, item.analysis?.issueType || '');
                  const displayCategory = categoryLabels[categoryKey];

                  const statusText = item.status || 'Open';
                  const badgeVariant = statusText.toLowerCase() === 'resolved' ? 'success' : (statusText.toLowerCase() === 'in progress' ? 'info' : 'warning');

                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveQueueId(item.id)}
                      className={`p-5 flex items-start gap-4 cursor-pointer transition-all hover:bg-secondary-surface/20
                        ${isSelected ? 'bg-primary-accent/5 hover:bg-primary-accent/5 border-l-4 border-primary-accent' : ''}
                      `}
                    >
                      {/* Priority Score Circle */}
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-xs font-display font-black text-sm border select-none
                        ${isCritical 
                          ? 'bg-danger/8 border-danger/25 text-danger' 
                          : 'bg-primary-accent/8 border-primary-accent/20 text-primary-accent'
                        }
                      `}>
                        {score.toFixed(1)}
                      </div>

                      {/* Metadata & Title */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] text-muted-text uppercase font-bold tracking-wide">
                            {displayCategory}
                          </span>
                          <Badge variant={badgeVariant} size="xs">
                            {statusText.toUpperCase()}
                          </Badge>
                          <span className="text-[10px] text-muted-text ml-auto select-none">
                            {getRelativeTime(item.createdAt)}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-primary-text leading-tight truncate">
                          {item.analysis?.issueType || 'Incident Report'}
                        </h3>
                        <p className="text-xs text-secondary-text mt-1.5 truncate">
                          {item.location}
                        </p>
                      </div>

                      <ChevronRight className="w-5 h-5 text-muted-text shrink-0 self-center" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 flex flex-col items-center justify-center">
                <Info className="w-12 h-12 text-muted-text mb-3 stroke-[1.5]" />
                <h3 className="text-sm font-bold text-primary-text mb-1">Queue is empty</h3>
                <p className="text-xs text-secondary-text px-6 max-w-sm">No operational incidents reported. Incidents created in the Analyzer will load here in real time.</p>
              </div>
            )}
          </Card>

          {/* AI City Intelligence Section */}
          <Card className="p-6 md:p-8 border border-borders shadow-xs flex flex-col gap-6">
            <div className="flex flex-col border-b border-borders pb-4 gap-1">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-primary-text flex items-center gap-2 uppercase tracking-wider select-none">
                  <Sparkles className="w-5 h-5 text-secondary-accent animate-pulse" />
                  AI City Intelligence Desk
                </h2>
                {isIntelLoading && (
                  <span className="text-xs text-muted-text flex items-center gap-1 font-medium select-none">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating insights...
                  </span>
                )}
              </div>
              {intelStatusLabel && (
                <span className="text-[10px] text-muted-text font-medium select-none pl-7 text-left mt-0.5">
                  {intelStatusLabel}
                </span>
              )}
            </div>

            {isIntelLoading && !intelData ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary-accent" />
                <p className="text-xs text-secondary-text">Synthesizing city-wide database reports...</p>
              </div>
            ) : isIntelError ? (
              <Card className="p-6 border-amber-500/25 bg-amber-500/5 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                <div className="text-xs">
                  <p className="font-bold text-primary-text">AI Intelligence is temporarily unavailable.</p>
                  <p className="text-secondary-text mt-0.5">Please check your configuration or API key limits.</p>
                </div>
              </Card>
            ) : intelData ? (
              <div className="flex flex-col gap-6 text-xs text-secondary-text">
                {/* Overall Strategic Risk Alert Row */}
                <div className={`flex items-center gap-3 border p-4 rounded-xl font-medium ${
                  intelData.overallRiskLevel?.toLowerCase() === 'critical' ? 'border-danger/30 bg-danger/5 text-danger' :
                  intelData.overallRiskLevel?.toLowerCase() === 'high' ? 'border-orange-500/30 bg-orange-500/5 text-orange-500' :
                  intelData.overallRiskLevel?.toLowerCase() === 'moderate' ? 'border-amber-500/30 bg-amber-500/5 text-amber-500' :
                  'border-emerald-500/30 bg-emerald-500/5 text-emerald-500'
                }`}>
                  <ShieldAlert className={`w-5 h-5 shrink-0 ${
                    intelData.overallRiskLevel?.toLowerCase() === 'critical' || intelData.overallRiskLevel?.toLowerCase() === 'high'
                      ? 'text-danger animate-pulse'
                      : 'text-amber-500'
                  }`} />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-text block select-none">Strategic Threat Outlook</span>
                    <span className="text-xs font-bold text-primary-text">
                      Overall Risk: {intelData.overallRiskLevel || 'Low'}
                    </span>
                  </div>
                  <div className="ml-auto">
                    <Badge variant={
                      intelData.overallRiskLevel?.toLowerCase() === 'critical' || intelData.overallRiskLevel?.toLowerCase() === 'high' ? 'danger' :
                      intelData.overallRiskLevel?.toLowerCase() === 'moderate' ? 'warning' : 'success'
                    } size="xs">
                      {intelData.overallRiskLevel?.toUpperCase() || 'LOW'}
                    </Badge>
                  </div>
                </div>

                {/* Executive Operations Brief */}
                <div className="flex flex-col gap-2 text-left">
                  <span className="font-bold text-primary-text uppercase tracking-wider text-xs text-muted-text flex items-center gap-1.5 select-none">
                    Executive Operations Brief
                  </span>
                  <p className="text-xs leading-relaxed text-secondary-text bg-primary-accent/5 border border-primary-accent/10 rounded-xl p-4 font-medium">
                    "{intelData.executiveBrief}"
                  </p>
                </div>

                {/* Recommendations and Forecast */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recommendations */}
                  <div className="flex flex-col gap-3 text-left">
                    <span className="font-bold text-primary-text uppercase tracking-wider text-xs text-muted-text select-none border-b border-borders/60 pb-1.5">
                      Strategic Action Directives
                    </span>
                    <ul className="flex flex-col gap-2 list-disc pl-4 leading-relaxed">
                      {intelData.recommendedActions?.map((action, i) => (
                        <li key={i} className="text-secondary-text">{action}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Forecast */}
                  <div className="flex flex-col gap-3 text-left">
                    <span className="font-bold text-primary-text uppercase tracking-wider text-xs text-muted-text select-none border-b border-borders/60 pb-1.5">
                      One-Week Risk Forecast
                    </span>
                    <p className="text-sm leading-relaxed text-secondary-text p-4 bg-secondary-surface/40 rounded-xl border border-borders/40">
                      {intelData.oneWeekForecast}
                    </p>
                  </div>
                </div>

                {/* Trending & Hotspots */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-borders/60 pt-6">
                  {/* Trending Issues */}
                  <div className="flex flex-col gap-3.5 text-left">
                    <span className="font-bold text-primary-text uppercase tracking-wider text-xs text-muted-text select-none border-b border-borders/60 pb-1.5">
                      Trending Civic Issues
                    </span>
                    <div className="flex flex-col gap-2">
                      {intelData.trendingIssues?.map((issue, i) => (
                        <div key={i} className="flex justify-between items-center bg-secondary-surface/20 px-3 py-2 rounded-lg border border-borders/40">
                          <span className="font-medium text-primary-text">{issue.category}</span>
                          <Badge variant="neutral" size="xs">{issue.count} Reports</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hotspots */}
                  <div className="flex flex-col gap-3.5 text-left">
                    <span className="font-bold text-primary-text uppercase tracking-wider text-xs text-muted-text select-none border-b border-borders/60 pb-1.5">
                      Identified Hazard Hotspots
                    </span>
                    <div className="flex flex-col gap-2">
                      {intelData.hotspots && intelData.hotspots.length > 0 ? (
                        intelData.hotspots.map((hotspot, i) => (
                          <div key={i} className="flex flex-col gap-1.5 p-3 bg-secondary-surface/20 border border-borders/40 rounded-lg">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-primary-text truncate max-w-[200px]">{hotspot.location}</span>
                              <Badge variant={
                                hotspot.risk?.toLowerCase() === 'high' || hotspot.risk?.toLowerCase() === 'critical' ? 'danger' :
                                hotspot.risk?.toLowerCase() === 'moderate' || hotspot.risk?.toLowerCase() === 'medium' ? 'warning' : 'neutral'
                              } size="xs">
                                {hotspot.risk || 'Medium'}
                              </Badge>
                            </div>
                            <span className="text-xs text-secondary-text mt-0.5 block break-words leading-normal">{hotspot.reason}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-text italic">No hotspots identified currently.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Department Workload Card inside AI intelligence section */}
                <div className="flex flex-col gap-3.5 text-left border-t border-borders/60 pt-6">
                  <span className="font-bold text-primary-text uppercase tracking-wider text-xs text-muted-text select-none border-b border-borders/60 pb-1.5">
                    Strategic Department Workloads
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    {intelData.departmentWorkload?.map((work, i) => {
                      const percentage = parseWorkloadVal(work.workload);
                      return (
                        <Card key={i} className="p-4 border border-borders/60 bg-secondary-surface/10 flex flex-col gap-2.5 shadow-xs min-w-0">
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-bold text-primary-text text-xs tracking-tight leading-tight block break-words">
                              {work.department}
                            </span>
                            <span className="text-[8px] font-bold text-muted-text uppercase select-none tracking-wider">
                              Department
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex flex-col gap-0.5 text-left">
                              <span className="text-muted-text uppercase select-none text-[8px] font-bold tracking-wider">Status</span>
                              <span className={`font-bold block break-words text-xs leading-none ${percentage > 70 ? 'text-danger' : 'text-primary-accent'}`}>
                                {getShortWorkload(work.workload)}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-borders rounded-full overflow-hidden mt-1">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${percentage > 70 ? 'bg-danger' : percentage > 45 ? 'bg-amber-500' : 'bg-primary-accent'}`} 
                                style={{ width: `${percentage}%` }} 
                              />
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-muted-text italic">Failed to generate city intelligence brief.</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Operations Desk (Col: 1/3) */}
        <div className="flex flex-col gap-6">
          {isLoading ? (
            <Card className="p-6 animate-pulse h-96 bg-secondary-surface/20 border border-borders/40 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-accent" />
            </Card>
          ) : activeIncident ? (
            (() => {
              const dept = activeIncident.authority?.department || 'General Operations';
              const categoryKey = getCategoryKey(dept, activeIncident.analysis?.issueType || '');
              const displayCategory = categoryLabels[categoryKey];
              const severity = activeIncident.analysis?.severity?.toLowerCase() || 'medium';
              const priorityScore = typeof activeIncident.analysis?.riskScore === 'number' ? activeIncident.analysis.riskScore : parseFloat(activeIncident.analysis?.riskScore) || 5.0;

              const severityBadgeVariant = severity === 'critical' || severity === 'high' ? 'danger' : (severity === 'medium' ? 'warning' : 'neutral');
              const statusBadgeVariant = activeIncident.status?.toLowerCase() === 'resolved' ? 'success' : (activeIncident.status?.toLowerCase() === 'in progress' ? 'info' : 'primary');

              return (
                <Card className="p-6 border border-borders shadow-xs flex flex-col gap-6 relative">
                  <span className="absolute top-4 right-4 text-[10px] text-muted-text font-mono font-bold select-none truncate max-w-[120px]">
                    ID: {activeIncident.id}
                  </span>
                  
                  <h3 className="text-sm font-bold text-primary-text pr-20 leading-snug border-b border-borders/60 pb-3 uppercase tracking-wider select-none">
                    Operations Desk
                  </h3>

                  {/* Summary Block */}
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-sm font-bold text-primary-text leading-snug leading-tight break-words">
                      {activeIncident.analysis?.issueType || 'Incident Report'}
                    </h2>
                    <span className="text-[10px] text-primary-accent font-semibold uppercase tracking-wider">{displayCategory}</span>
                  </div>

                  {/* Badges & Scores */}
                  <div className="flex flex-wrap gap-2.5 items-center bg-secondary-surface/30 p-3 rounded-xl border border-borders/40 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-muted-text font-bold uppercase">Severity</span>
                      <Badge variant={severityBadgeVariant} size="xs">{severity.toUpperCase()}</Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-muted-text font-bold uppercase">Status</span>
                      <Badge variant={statusBadgeVariant} size="xs">{(activeIncident.status || 'Open').toUpperCase()}</Badge>
                    </div>
                    <div className="flex flex-col gap-1 ml-auto text-right select-none">
                      <span className="text-[9px] text-muted-text font-bold uppercase">Score</span>
                      <span className="font-display font-black text-sm text-primary-accent">{priorityScore.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div className="flex flex-col gap-1.5 text-xs text-secondary-text">
                    <span className="font-bold text-primary-text uppercase tracking-wider text-[10px] text-muted-text flex items-center gap-1 select-none">
                      <Info className="w-3.5 h-3.5 text-primary-accent" />
                      AI Summary Assessment
                    </span>
                    <p className="leading-relaxed bg-secondary-surface/20 border border-borders/40 rounded-xl p-3">
                      {activeIncident.summary || 'No summary text generated.'}
                    </p>
                  </div>

                  {/* Risk Assessment */}
                  <div className="grid grid-cols-2 gap-3.5 text-[10px]">
                    <div className="flex flex-col gap-1 p-3 bg-danger/5 border border-danger/10 rounded-xl min-w-0">
                      <span className="font-bold text-danger uppercase tracking-wider block break-words leading-tight">Pedestrian/Public Safety Risk</span>
                      <p className="leading-relaxed text-secondary-text mt-0.5">{activeIncident.analysis?.publicSafetyRisk || 'None evaluated.'}</p>
                    </div>
                    <div className="flex flex-col gap-1 p-3 bg-warning/5 border border-warning/10 rounded-xl min-w-0">
                      <span className="font-bold text-amber-700 uppercase tracking-wider block break-words leading-tight">Environmental/Property Risk</span>
                      <p className="leading-relaxed text-secondary-text mt-0.5">{activeIncident.analysis?.environmentalRisk || 'None evaluated.'}</p>
                    </div>
                  </div>

                  {/* Recommendations Plans */}
                  <div className="flex flex-col gap-3 text-xs border-t border-borders/60 pt-4">
                    <span className="font-bold text-primary-text uppercase tracking-wider text-[10px] text-muted-text select-none">
                      Resolution Plans
                    </span>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-start gap-2">
                        <Badge variant="danger" size="xs">IMMEDIATE</Badge>
                        <p className="text-[11px] leading-relaxed text-secondary-text">{activeIncident.resolution?.immediateAction || 'Standard evaluation.'}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="warning" size="xs">SHORT-TERM</Badge>
                        <p className="text-[11px] leading-relaxed text-secondary-text">{activeIncident.resolution?.shortTerm || 'Safety cordoning.'}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="neutral" size="xs">LONG-TERM</Badge>
                        <p className="text-[11px] leading-relaxed text-secondary-text">{activeIncident.resolution?.longTerm || 'Permanent restoration scheduling.'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch and predictions */}
                  <div className="flex flex-col gap-3.5 text-xs border-t border-borders/60 pt-4">
                    <div className="flex justify-between">
                      <span className="font-bold text-primary-text">Assigned Department:</span>
                      <span className="text-secondary-text text-right font-medium">{dept}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-primary-text">Dispatch Urgency:</span>
                      <span className="text-primary-accent font-semibold uppercase">{activeIncident.authority?.urgency || 'routine'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-primary-text">Citizen Upvotes:</span>
                      <span className="text-secondary-text font-medium">{activeIncident.verificationCount || 0} Verifications</span>
                    </div>
                  </div>

                  {/* Action Board Status Transitions */}
                  <div className="flex flex-col gap-2.5 pt-4 border-t border-borders/60">
                    <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider select-none">
                      Update Operational Status
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleUpdateStatus(activeIncident.id, 'Open')}
                        disabled={activeIncident.status === 'Open'}
                        className={`px-3 py-2 text-[10px] rounded-xl font-bold border transition-all cursor-pointer select-none text-center
                          ${activeIncident.status === 'Open'
                            ? 'bg-neutral/10 border-neutral/30 text-neutral-text opacity-50 cursor-not-allowed'
                            : 'bg-surface border-borders text-secondary-text hover:border-primary-accent hover:text-primary-accent'
                          }
                        `}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(activeIncident.id, 'In Progress')}
                        disabled={activeIncident.status === 'In Progress'}
                        className={`px-3 py-2 text-[10px] rounded-xl font-bold border transition-all cursor-pointer select-none text-center
                          ${activeIncident.status === 'In Progress'
                            ? 'bg-info/10 border-info/30 text-info opacity-50 cursor-not-allowed'
                            : 'bg-surface border-borders text-secondary-text hover:border-primary-accent hover:text-primary-accent'
                          }
                        `}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(activeIncident.id, 'Resolved')}
                        disabled={activeIncident.status === 'Resolved'}
                        className={`px-3 py-2 text-[10px] rounded-xl font-bold border transition-all cursor-pointer select-none text-center
                          ${activeIncident.status === 'Resolved'
                            ? 'bg-success/10 border-success/30 text-success opacity-50 cursor-not-allowed'
                            : 'bg-surface border-borders text-secondary-text hover:border-primary-accent hover:text-primary-accent'
                          }
                        `}
                      >
                        Resolved
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })()
          ) : (
            <Card className="text-center py-16 flex flex-col items-center justify-center">
              <AlertCircle className="w-10 h-10 text-muted-text mb-3" />
              <span className="text-sm font-semibold text-secondary-text">No active incident selected</span>
            </Card>
          )}

          {/* Department operations load indicator */}
          <Card className="p-6 border border-borders shadow-xs">
            <h4 className="text-xs font-bold text-secondary-text uppercase tracking-wider mb-4 border-b border-borders/60 pb-2 select-none">
              Department Operations Loads
            </h4>
            <div className="flex flex-col gap-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-secondary-text">Public Works (DPW)</span>
                  <span className={`font-bold ${dpwLoad > 75 ? 'text-danger' : 'text-primary-accent'}`}>{dpwLoad}% Load</span>
                </div>
                <div className="h-2 w-full bg-borders rounded-full overflow-hidden">
                  <div className="h-full bg-danger rounded-full transition-all duration-500" style={{ width: `${dpwLoad}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-secondary-text">Water Department</span>
                  <span className={`font-bold ${waterLoad > 75 ? 'text-danger' : 'text-primary-accent'}`}>{waterLoad}% Load</span>
                </div>
                <div className="h-2 w-full bg-borders rounded-full overflow-hidden">
                  <div className="h-full bg-primary-accent rounded-full transition-all duration-500" style={{ width: `${waterLoad}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-secondary-text">Electrical Department</span>
                  <span className={`font-bold ${electLoad > 75 ? 'text-danger' : 'text-primary-accent'}`}>{electLoad}% Load</span>
                </div>
                <div className="h-2 w-full bg-borders rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${electLoad}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-secondary-text">Sanitation</span>
                  <span className={`font-bold ${sanitationLoad > 75 ? 'text-danger' : 'text-primary-accent'}`}>{sanitationLoad}% Load</span>
                </div>
                <div className="h-2 w-full bg-borders rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${sanitationLoad}%` }} />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-semibold">
                  <span className="text-secondary-text">Public Safety</span>
                  <span className={`font-bold ${safetyLoad > 75 ? 'text-danger' : 'text-primary-accent'}`}>{safetyLoad}% Load</span>
                </div>
                <div className="h-2 w-full bg-borders rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${safetyLoad}%` }} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>

      {/* AI Operations Copilot Panel */}
      {/* Floating Circular Launcher Badge */}
      <button
        onClick={handleOpenCopilot}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-tr from-primary-accent to-[#14B8A6] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group active:scale-95 z-40 flex items-center gap-2 border border-white/10"
        title="Open AI Operations Copilot"
      >
        <MessageSquare className="w-5.5 h-5.5 animate-pulse" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out text-xs font-bold uppercase tracking-wider select-none leading-none">
          AI Copilot
        </span>
      </button>

      {/* Slide-over Drawer Backdrop & sliding panel drawer container */}
      {isCopilotRendered && (
        <>
          {/* Backdrop Overlay */}
          <div 
            onClick={handleCloseCopilot}
            className={`fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300 z-40 ${
              isCopilotOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />

          <div 
            className={`fixed top-0 right-0 h-full w-[380px] max-w-[100vw] bg-surface border-l border-borders shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${
              isCopilotOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-borders flex items-center justify-between bg-secondary-surface/40 select-none">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary-accent text-white">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-extrabold text-primary-text uppercase tracking-wider leading-none">AI Operations Copilot</span>
                  <span className="text-[9px] text-muted-text mt-1 leading-none font-medium">Scope: {selectedCity}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {copilotMessages.length > 0 && (
                  <button 
                    onClick={() => setCopilotMessages([])}
                    className="p-1.5 rounded-lg text-muted-text hover:text-danger hover:bg-secondary-surface transition-colors cursor-pointer"
                    title="Reset conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={handleCloseCopilot}
                  className="p-1.5 rounded-lg text-muted-text hover:text-primary-text hover:bg-secondary-surface transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Conversation History pane */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {copilotMessages.length === 0 ? (
                <div className="py-6 flex flex-col gap-4">
                  {/* Copilot Welcome instructions card */}
                  <div className="p-5 bg-primary-accent/5 border border-primary-accent/15 rounded-2xl text-center flex flex-col gap-2.5 shadow-xs">
                    <div className="w-10 h-10 rounded-full bg-primary-accent/10 flex items-center justify-center mx-auto text-primary-accent">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="font-extrabold text-primary-text text-xs uppercase tracking-wider">AI Operations Advisor</h4>
                    <p className="text-[11px] text-secondary-text leading-relaxed">
                      Welcome to the Operations Copilot. Ask me analytical queries about the active database inside <strong>{selectedCity}</strong>. I can calculate loads, summarize reports, isolate safety concerns, or organize priorities.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {copilotMessages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div 
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          isUser ? 'ml-auto text-right items-end' : 'mr-auto text-left items-start'
                        }`}
                      >
                        <span className="text-[8px] font-bold text-muted-text uppercase tracking-wider mb-1 select-none">
                          {isUser ? 'Public Official' : 'Copilot'}
                        </span>
                        <div 
                          className={`px-4 py-3 rounded-2xl text-xs select-text shadow-xs ${
                            isUser 
                              ? 'bg-primary-accent text-white rounded-tr-none' 
                              : 'bg-secondary-surface/50 border border-borders/60 text-secondary-text rounded-tl-none'
                          }`}
                        >
                          {isUser ? (
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          ) : (
                            <CopilotMessageContent text={msg.text} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Thinking loading state bubble */}
              {isCopilotLoading && (
                <div className="flex flex-col items-start mr-auto max-w-[85%]">
                  <span className="text-[8px] font-bold text-muted-text uppercase tracking-wider mb-1 select-none">Copilot</span>
                  <div className="flex gap-2 items-center bg-secondary-surface/50 border border-borders/60 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-muted-text shadow-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-accent" />
                    <span className="font-medium animate-pulse">Analyzing operations dataset...</span>
                  </div>
                </div>
              )}

              {/* Copilot Error display */}
              {copilotError && (
                <div className="p-4 bg-danger/5 border border-danger/20 rounded-xl flex items-center gap-3 text-left">
                  <AlertCircle className="w-5 h-5 text-danger shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-primary-text">{copilotError}</p>
                    <p className="text-muted-text text-[10px] mt-0.5">Please check network connection or API limits.</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested Question Chips */}
            <div className="p-3 border-t border-borders/40 bg-secondary-surface/20 flex flex-col gap-1.5 text-left select-none">
              <span className="text-[9px] font-bold text-muted-text uppercase tracking-wider">Quick Suggestions</span>
              <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth shrink-0">
                {[
                  "Summarize today's incidents",
                  "Which area needs immediate attention?",
                  "Which department is overloaded?",
                  "What should I prioritize today?",
                  "Show unresolved critical incidents"
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendCopilotMessage(chip)}
                    disabled={isCopilotLoading}
                    className="shrink-0 px-3 py-1.5 bg-surface border border-borders rounded-full text-[10px] font-semibold text-secondary-text hover:border-primary-accent hover:text-primary-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Typing Input Form footer */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendCopilotMessage();
              }}
              className="p-4 border-t border-borders bg-surface flex gap-2"
            >
              <input
                type="text"
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                disabled={isCopilotLoading}
                placeholder="Ask copilot about municipal operations..."
                className="flex-1 bg-secondary-surface/40 border border-borders text-secondary-text text-xs rounded-xl px-3.5 py-2.5 outline-none hover:border-primary-accent focus:border-primary-accent focus:bg-surface transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isCopilotLoading || !copilotInput.trim()}
                className="p-2.5 bg-primary-accent text-white rounded-xl shadow-sm hover:shadow hover:bg-primary-accent/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
