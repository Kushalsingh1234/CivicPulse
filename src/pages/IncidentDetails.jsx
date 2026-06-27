import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { 
  MapPin, 
  Calendar, 
  ArrowLeft, 
  CheckCircle, 
  ShieldAlert, 
  FileText, 
  Loader2, 
  ThumbsUp, 
  Zap, 
  Clock, 
  Info,
  Copy
} from 'lucide-react';
import { getIncidentById } from '../services/firebase/firestoreService';

const CategoryPlaceholder = ({ category }) => {
  const styles = {
    roads: {
      bg: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-600',
      label: 'Roads & Potholes',
      svg: (
        <svg className="w-16 h-16 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 22h16" />
        </svg>
      )
    },
    utilities: {
      bg: 'from-blue-500/10 to-cyan-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-600',
      label: 'Utilities & Water',
      svg: (
        <svg className="w-16 h-16 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    lighting: {
      bg: 'from-yellow-500/10 to-amber-500/10',
      border: 'border-yellow-500/20',
      text: 'text-yellow-600',
      label: 'Street Lighting',
      svg: (
        <svg className="w-16 h-16 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      )
    },
    sanitation: {
      bg: 'from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-600',
      label: 'Sanitation & Waste',
      svg: (
        <svg className="w-16 h-16 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    },
    safety: {
      bg: 'from-rose-500/10 to-red-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-600',
      label: 'Public Safety',
      svg: (
        <svg className="w-16 h-16 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  };

  const activeStyle = styles[category] || styles.roads;

  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${activeStyle.bg} ${activeStyle.text} p-8 text-center select-none rounded-2xl`}>
      {activeStyle.svg}
      <span className="text-xs font-bold tracking-widest uppercase mt-4 select-none">
        {activeStyle.label}
      </span>
    </div>
  );
};

const getDispatchTemplate = (result) => {
  if (!result) return '';
  
  const { analysis = {}, locationAnalysis = {}, authority = {}, resolution = {}, impactPrediction = {}, summary = '', location = '' } = result;
  
  return `CIVIC PULSE OPERATIONS DISPATCH TICKET
==========================================
STATUS: ACTIVE OPERATIONAL DISPATCH
TELEMETRY ADDRESS: ${location || 'Not Available'}
GPS DETECTED CONTEXT: ${locationAnalysis?.detectedContext || 'Not Available'}
GPS CONTEXT CONFIDENCE: ${(locationAnalysis?.locationConfidence * 100 || 100).toFixed(0)}%

[1] INCIDENT DETECTED:
- Type: ${analysis?.issueType || 'Unclassified Hazard'}
- Severity: ${(analysis?.severity || 'Medium').toUpperCase()}
- Priority Score: ${analysis?.riskScore || '5.0'}/10.0

[2] ASSIGNED DISPATCH:
- Primary Department: ${authority?.department || 'Operations Team'}
- Dispatch Urgency: ${(authority?.urgency || 'Routine').toUpperCase()}

[3] OPERATIONAL INSTRUCTIONS:
- Immediate Action Required:
  "${resolution?.immediateAction || 'Deploy standard assessment.'}"
- Short-term Mitigations:
  "${resolution?.shortTerm || 'Monitor and report updates.'}"
- Long-term Resolution:
  "${resolution?.longTerm || 'Schedule standard maintenance.'}"

[4] IMPACT ANALYSIS:
- One-Week Outlook: "${impactPrediction?.oneWeek || 'Stable.'}"
- One-Month Outlook: "${impactPrediction?.oneMonth || 'Resolved.'}"

[5] AI SUMMARY DESCRIPTION:
"${summary || 'No further summary data provided.'}"
==========================================
GENERATED VIA CIVICPULSE AI DISPATCH KERNEL`;
};

export default function IncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchIncident = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getIncidentById(id);
        setIncident(data);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Incident not found or database read failed.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncident();
  }, [id]);

  const handleCopyTicket = () => {
    const text = getDispatchTemplate(incident);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'just now';
    try {
      const now = new Date();
      const date = new Date(dateStr);
      const seconds = Math.floor((now - date) / 1000);
      
      if (seconds < 60) return 'just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'just now';
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-left">
        <Loader2 className="w-12 h-12 animate-spin text-primary-accent" />
        <span className="text-sm font-semibold text-secondary-text animate-pulse">Loading Incident Details...</span>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="flex flex-col gap-6 text-left max-w-lg mx-auto py-12">
        <Card className="text-center py-12 flex flex-col items-center justify-center">
          <ShieldAlert className="w-12 h-12 text-danger mb-4 stroke-[1.5]" />
          <h3 className="text-lg font-bold text-primary-text mb-1">Failed to Load Incident</h3>
          <p className="text-sm text-secondary-text mb-6">{error || 'Incident document not found.'}</p>
          <Button variant="primary" onClick={() => navigate('/feed')} icon={ArrowLeft}>
            Return to Community Feed
          </Button>
        </Card>
      </div>
    );
  }

  const {
    analysis = {},
    authority = {},
    resolution = {},
    impactPrediction = {},
    summary = '',
    location = '',
    status = 'Open',
    verificationCount = 0,
    createdAt,
    imageUrl,
    aiModel = 'gemini-2.5-flash',
    source = 'Citizen'
  } = incident;

  const departmentName = authority.department || 'General Operations';
  const categoryKey = getCategoryKey(departmentName, analysis.issueType || '');
  const displayCategory = categoryLabels[categoryKey] || 'General Operations';
  const severity = analysis.severity || 'medium';
  const priorityScore = typeof analysis.riskScore === 'number' ? analysis.riskScore : parseFloat(analysis.riskScore) || 5.0;

  const severityBadgeVariant = severity?.toLowerCase() === 'critical' || severity?.toLowerCase() === 'high' ? 'danger' : (severity?.toLowerCase() === 'medium' ? 'warning' : 'neutral');
  const statusBadgeVariant = status?.toLowerCase() === 'resolved' ? 'success' : (status?.toLowerCase() === 'dispatched' ? 'info' : 'primary');

  return (
    <div className="flex flex-col gap-6 md:gap-8 text-left animate-fade-in">
      {/* Top back button and action bar */}
      <div className="flex items-center justify-between pb-2 border-b border-borders/60">
        <button
          onClick={() => navigate('/feed')}
          className="flex items-center gap-2 text-sm font-semibold text-secondary-text hover:text-primary-accent transition-colors cursor-pointer select-none"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Community Feed</span>
        </button>

        <span className="text-xs text-muted-text flex items-center gap-1.5 font-medium select-none">
          <Calendar className="w-3.5 h-3.5" />
          Logged {getRelativeTime(createdAt)}
        </span>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Images and Telemetry Details (Col: 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="p-0! overflow-hidden relative min-h-[260px] md:min-h-[300px] border border-borders shadow-xs shrink-0 select-none">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={analysis.issueType}
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <CategoryPlaceholder category={categoryKey} />
            )}
          </Card>

          {/* Telemetry Address Details */}
          <Card className="flex flex-col gap-4 p-5 md:p-6 border border-borders shadow-xs">
            <h3 className="text-xs font-bold text-muted-text uppercase tracking-widest border-b border-borders pb-2.5">
              Incident Telemetry
            </h3>
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-primary-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-primary-text mb-1">Reported Location</p>
                <p className="text-xs text-secondary-text leading-relaxed">{location}</p>
              </div>
            </div>
          </Card>

          {/* AI Metadata Details */}
          <Card className="flex flex-col gap-4 p-5 md:p-6 border border-borders shadow-xs">
            <h3 className="text-xs font-bold text-muted-text uppercase tracking-widest border-b border-borders pb-2.5">
              System Metadata
            </h3>
            <div className="flex flex-col gap-3.5 text-xs text-secondary-text">
              <div className="flex justify-between items-center">
                <span className="font-medium">AI Model Model:</span>
                <code className="bg-primary-accent/10 text-primary-accent px-1.5 py-0.5 rounded font-mono text-[10px] font-bold">
                  {aiModel}
                </code>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Report Source:</span>
                <span className="font-semibold text-primary-text">{source}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Citizen Verifications:</span>
                <div className="flex items-center gap-1.5 text-primary-accent font-bold">
                  <ThumbsUp className="w-3.5 h-3.5 fill-current" />
                  <span>{verificationCount} Upvotes</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Operational Summaries (Col: 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <Card className="flex flex-col gap-6 p-6 md:p-8 border border-borders shadow-xs">
            {/* Header Details */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-5 border-b border-borders/60 gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="primary">{displayCategory}</Badge>
                  <Badge variant={severityBadgeVariant}>{severity.toUpperCase()} SEVERITY</Badge>
                  <Badge variant={statusBadgeVariant}>{status.toUpperCase()}</Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-primary-text tracking-tight leading-tight">
                  {analysis.issueType || 'Incident Report'}
                </h1>
              </div>

              {/* Priority Rating */}
              <div className="flex flex-col items-center justify-center shrink-0 border border-borders rounded-2xl px-5 py-4 bg-secondary-surface/40 select-none">
                <span className="text-[10px] tracking-wider uppercase font-bold text-secondary-text mb-1">
                  Priority Rating
                </span>
                <span className="font-display font-black text-3xl text-primary-accent">
                  {priorityScore.toFixed(1)}
                </span>
                <span className="text-[9px] text-muted-text mt-0.5">Scale 0.0 - 10.0</span>
              </div>
            </div>

            {/* AI Summary Section */}
            <div className="text-left flex flex-col gap-2">
              <h3 className="text-xs font-bold text-muted-text uppercase tracking-widest flex items-center gap-1">
                <Info className="w-4 h-4 text-primary-accent" />
                AI Summary Assessment
              </h3>
              <p className="text-sm leading-relaxed text-secondary-text font-medium bg-secondary-surface/20 border border-borders/40 rounded-xl p-4">
                {summary || 'No summary text generated for this report.'}
              </p>
            </div>

            {/* Operations Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="flex flex-col gap-2 p-4 bg-danger/5 border border-danger/10 rounded-xl">
                <span className="text-[10px] font-black uppercase text-danger tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  Immediate Action
                </span>
                <p className="text-xs leading-relaxed text-secondary-text">
                  {resolution.immediateAction || 'Standard visual inspection.'}
                </p>
              </div>

              <div className="flex flex-col gap-2 p-4 bg-warning/5 border border-warning/10 rounded-xl">
                <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Short-Term Action
                </span>
                <p className="text-xs leading-relaxed text-secondary-text">
                  {resolution.shortTerm || 'Establish safety boundaries.'}
                </p>
              </div>

              <div className="flex flex-col gap-2 p-4 bg-primary-accent/5 border border-primary-accent/10 rounded-xl">
                <span className="text-[10px] font-black uppercase text-primary-accent tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Long-Term Action
                </span>
                <p className="text-xs leading-relaxed text-secondary-text">
                  {resolution.longTerm || 'Schedule permanent structure repair.'}
                </p>
              </div>
            </div>

            {/* Forecast Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-borders/60 pt-6">
              <div>
                <h4 className="text-xs font-bold text-muted-text uppercase tracking-widest mb-2">
                  1-Week Hazard Forecast
                </h4>
                <p className="text-xs leading-relaxed text-secondary-text">
                  {impactPrediction.oneWeek || 'Stable impact anticipated.'}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-muted-text uppercase tracking-widest mb-2">
                  1-Month Environmental Forecast
                </h4>
                <p className="text-xs leading-relaxed text-secondary-text">
                  {impactPrediction.oneMonth || 'No severe changes anticipated.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Dispatch ticket terminal log card */}
          <Card className="p-6 md:p-8 border border-borders shadow-xs flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b border-borders pb-4">
              <h3 className="text-xs font-bold text-muted-text uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary-accent" />
                Operational Dispatch Brief
              </h3>
              <button
                onClick={handleCopyTicket}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-borders text-secondary-text hover:bg-secondary-surface transition-colors cursor-pointer select-none"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied Brief' : 'Copy Ticket'}</span>
              </button>
            </div>

            {/* Terminal display */}
            <pre className="font-mono text-left text-xs bg-slate-900 border border-slate-950 p-4 rounded-xl text-teal-400 overflow-x-auto whitespace-pre leading-relaxed shadow-inner select-text select-none">
              {getDispatchTemplate(incident)}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
}
