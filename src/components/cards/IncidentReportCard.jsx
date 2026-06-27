import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { MapPin, ThumbsUp, Calendar, ArrowRight } from 'lucide-react';

const CategoryPlaceholder = ({ category }) => {
  const styles = {
    roads: {
      bg: 'from-amber-500/10 to-orange-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-600',
      label: 'Roads & Potholes',
      svg: (
        <svg className="w-10 h-10 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
        <svg className="w-10 h-10 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
        <svg className="w-10 h-10 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
        <svg className="w-10 h-10 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
        <svg className="w-10 h-10 stroke-[1.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    }
  };

  const activeStyle = styles[category] || styles.roads;

  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${activeStyle.bg} border-b md:border-b-0 md:border-r ${activeStyle.border} ${activeStyle.text} p-6 text-center select-none`}>
      {activeStyle.svg}
      <span className="text-[10px] font-bold tracking-widest uppercase mt-3 opacity-90 select-none">
        {activeStyle.label}
      </span>
    </div>
  );
};

export default function IncidentReportCard({
  incident,
  onViewDetails,
  onVerify,
  isVerifying = false
}) {
  const {
    id,
    analysis = {},
    authority = {},
    summary = '',
    location = '',
    status = 'Open',
    verificationCount = 0,
    createdAt,
    imageUrl
  } = incident;

  const title = analysis.issueType || 'Incident Report';
  const severity = analysis.severity || 'medium';
  const priorityScore = typeof analysis.riskScore === 'number' ? analysis.riskScore : parseFloat(analysis.riskScore) || 0;
  const department = authority.department || 'General Operations';

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

  const categoryKey = getCategoryKey(department, title);
  const displayCategory = categoryLabels[categoryKey];

  // Calculate relative time helper
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

  // Map severity to badges
  const getSeverityBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <Badge variant="danger">{level.toUpperCase()} SEVERITY</Badge>;
      case 'medium':
        return <Badge variant="warning">MEDIUM SEVERITY</Badge>;
      case 'low':
      default:
        return <Badge variant="neutral">LOW SEVERITY</Badge>;
    }
  };

  // Map status to badges
  const getStatusBadge = (stat) => {
    switch (stat?.toLowerCase()) {
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'dispatched':
        return <Badge variant="info">Dispatched</Badge>;
      case 'analyzing':
        return <Badge variant="primary">Analyzing</Badge>;
      case 'reported':
      case 'open':
      default:
        return <Badge variant="neutral">Reported</Badge>;
    }
  };

  return (
    <Card hoverable className="flex flex-col md:flex-row gap-6 p-0! h-full md:items-stretch text-left animate-fade-in overflow-hidden">
      {/* Side Image Column */}
      <div className="w-full md:w-60 min-h-[220px] md:min-h-auto relative overflow-hidden bg-secondary-surface border-b md:border-b-0 md:border-r border-borders shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        ) : (
          <CategoryPlaceholder category={categoryKey} />
        )}

        {/* Priority Score Floating Overlay */}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs text-white rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-sm border border-white/10 select-none z-10">
          <span className="text-[10px] tracking-wider uppercase font-bold text-teal-300">Priority</span>
          <span className="font-display font-black text-sm">{priorityScore.toFixed(1)}</span>
        </div>
      </div>

      {/* Content Column */}
      <div className="flex flex-col justify-between p-5 md:p-6 flex-1 min-w-0 gap-5">
        <div>
          {/* Metadata Row */}
          <div className="flex flex-wrap gap-2 items-center mb-3">
            {getSeverityBadge(severity)}
            {getStatusBadge(status)}
            <span className="text-xs text-muted-text flex items-center gap-1.5 ml-auto">
              <Calendar className="w-3.5 h-3.5" />
              {getRelativeTime(createdAt)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg md:text-xl font-bold tracking-tight text-primary-text mb-1.5 line-clamp-2 overflow-hidden break-words leading-snug">
            {title}
          </h3>

          {/* Category Tag */}
          <p className="text-xs font-semibold text-primary-accent mb-3.5 uppercase tracking-wider">
            {displayCategory}
          </p>

          {/* AI Summary (2-line preview) */}
          <p className="text-sm text-secondary-text leading-relaxed line-clamp-2 overflow-hidden mb-4 break-words">
            {summary || 'No summary details provided.'}
          </p>
        </div>

        {/* Footer info/actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-borders/60">
          {/* Location details */}
          <div className="flex items-center gap-2 text-secondary-text min-w-0 flex-1">
            <MapPin className="w-4 h-4 text-primary-accent shrink-0" />
            <span className="text-xs truncate font-medium">{location}</span>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
            {/* Verify Button */}
            {onVerify && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVerify(id);
                }}
                disabled={isVerifying || status?.toLowerCase() === 'resolved'}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-semibold border transition-all cursor-pointer disabled:opacity-50
                  ${isVerifying
                    ? 'bg-primary-accent/10 border-primary-accent/20 text-primary-accent'
                    : 'bg-surface border-borders text-secondary-text hover:border-primary-accent hover:text-primary-accent hover:bg-primary-accent/5'
                  }
                `}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${isVerifying ? 'fill-current' : ''}`} />
                <span>{verificationCount} {isVerifying ? 'Verified' : 'Verify'}</span>
              </button>
            )}

            {/* View Details Button */}
            {onViewDetails && (
              <Button
                variant="ghost"
                size="sm"
                className="px-2! hover:translate-x-1"
                onClick={onViewDetails}
              >
                <span className="text-xs font-semibold flex items-center gap-1 text-primary-accent">
                  Details <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
