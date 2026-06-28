import React, { useMemo, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet.heat';
import Card from '../ui/Card';
import { Eye, EyeOff, Layers, RotateCcw, MapPin } from 'lucide-react';

// Custom component to dynamically pan/zoom map viewport to visible markers
function ChangeMapBounds({ bounds, resetKey }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, animate: true, duration: 1.5 });
    }
  }, [bounds, map, resetKey]);
  return null;
}

const getCategoryKey = (dept = '', issueType = '') => {
  const text = `${dept} ${issueType}`.toLowerCase();
  if (text.includes('road') || text.includes('pothole') || text.includes('transit') || text.includes('transportation') || text.includes('highway') || text.includes('subsidence')) return 'roads';
  if (text.includes('water') || text.includes('sewer') || text.includes('utility') || text.includes('power') || text.includes('grid') || text.includes('electricity') || text.includes('flooding') || text.includes('leak')) return 'utilities';
  if (text.includes('light') || text.includes('lamp') || text.includes('illumination') || text.includes('lighting')) return 'lighting';
  if (text.includes('waste') || text.includes('trash') || text.includes('sanitation') || text.includes('dump') || text.includes('environmental') || text.includes('dumping')) return 'sanitation';
  if (text.includes('safety') || text.includes('police') || text.includes('fire') || text.includes('emergency') || text.includes('security') || text.includes('junction') || text.includes('hazard')) return 'safety';
  return 'roads';
};

// Custom Marker Clustering and Heatmap Layers Controller using useMap hook
function CommandLayers({ incidents, showClusters, showHeatmap, navigate }) {
  const map = useMap();
  const layersRef = useRef({ clusterGroup: null, heatLayer: null });

  useEffect(() => {
    if (!map) return;

    const currentLayers = layersRef.current;

    // Clean up existing layers
    if (currentLayers.clusterGroup) {
      map.removeLayer(currentLayers.clusterGroup);
      currentLayers.clusterGroup = null;
    }
    if (currentLayers.heatLayer) {
      map.removeLayer(currentLayers.heatLayer);
      currentLayers.heatLayer = null;
    }

    // 1. Setup Marker Clustering or Standard Layer Group
    const groupOptions = {
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster) => {
        const childMarkers = cluster.getAllChildMarkers();
        
        // Find highest severity inside cluster
        const severities = childMarkers.map(m => m.options.severity?.toLowerCase() || 'medium');
        let highestSeverity = 'low';
        if (severities.includes('critical')) highestSeverity = 'critical';
        else if (severities.includes('high')) highestSeverity = 'high';
        else if (severities.includes('medium')) highestSeverity = 'medium';

        const colors = {
          critical: 'bg-danger/90 border-danger text-white ring-danger/25',
          high: 'bg-amber-600/90 border-amber-600 text-white ring-amber-600/25',
          medium: 'bg-amber-500/90 border-amber-500 text-white ring-amber-500/25',
          low: 'bg-emerald-500/90 border-emerald-500 text-white ring-emerald-500/25'
        };
        const colorClass = colors[highestSeverity] || colors.medium;

        return L.divIcon({
          html: `<div class="w-9 h-9 rounded-full border border-white flex items-center justify-center font-bold text-xs shadow-md ring-4 ${colorClass}">${childMarkers.length}</div>`,
          className: 'custom-cluster-icon',
          iconSize: L.point(36, 36)
        });
      }
    };

    const targetGroup = showClusters
      ? L.markerClusterGroup(groupOptions)
      : L.layerGroup();

    // 2. Add individual Incident Markers
    incidents.forEach(incident => {
      const lat = incident.latitude;
      const lon = incident.longitude;
      if (typeof lat !== 'number' || typeof lon !== 'number') return;

      const severity = incident.analysis?.severity || 'medium';
      
      const colors = {
        critical: 'bg-danger shadow-danger/45',
        high: 'bg-amber-600 shadow-amber-600/45',
        medium: 'bg-amber-500 shadow-amber-500/45',
        low: 'bg-emerald-500 shadow-emerald-500/45'
      };
      const colorClass = colors[severity?.toLowerCase()] || colors.medium;

      const markerIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="relative w-8 h-8 flex items-center justify-center">
            <span class="absolute -inset-1.5 rounded-full animate-ping opacity-35 ${colorClass}"></span>
            <div class="w-3.5 h-3.5 rounded-full border border-white shadow-sm ${colorClass}"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -10]
      });

      const marker = L.marker([lat, lon], {
        icon: markerIcon,
        severity: severity
      });

      // Bind detailed command popup
      const title = incident.analysis?.issueType || 'Incident Report';
      const summary = incident.summary || incident.description || 'No summary details provided.';
      const address = incident.location || 'Unknown Address';
      const priorityScore = typeof incident.analysis?.riskScore === 'number'
        ? incident.analysis.riskScore
        : parseFloat(incident.analysis?.riskScore) || 5.0;
      const status = incident.status || 'Open';
      const reportedTime = incident.createdAt || 'just now';
      const dept = incident.authority?.department || 'Operations Team';
      const verificationCount = incident.verificationCount || 0;
      
      const imageTag = incident.imageUrl
        ? `<img src="${incident.imageUrl}" class="w-full h-24 object-cover rounded-xl mb-2.5 border border-borders/30 select-none pointer-events-none" />`
        : '';

      const severityColors = {
        critical: 'bg-danger/10 text-danger border-danger/20',
        high: 'bg-amber-600/10 text-amber-600 border-amber-600/20',
        medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      };
      const sevClass = severityColors[severity.toLowerCase()] || severityColors.medium;

      const popupContent = `
        <div class="p-2.5 flex flex-col gap-2.5 max-w-[285px] text-left select-text custom-popup-container font-sans">
          ${imageTag}
          <div class="flex flex-col gap-0.5">
            <div class="flex items-center justify-between gap-2.5">
              <span class="text-[9px] uppercase font-black text-primary-accent tracking-widest leading-none bg-primary-accent/10 px-1.5 py-0.5 rounded">
                ${status.toUpperCase()}
              </span>
              <span class="text-[9px] text-muted-text font-bold leading-none">
                ${reportedTime}
              </span>
            </div>
            <h4 class="text-xs font-black text-primary-text leading-snug mt-1.5">
              ${title}
            </h4>
          </div>
          
          <p class="text-[10px] text-secondary-text leading-relaxed line-clamp-3 select-none">
            ${summary}
          </p>

          <div class="flex flex-col gap-1.5 text-[9px] text-muted-text border-t border-borders/40 pt-2 font-medium">
            <div><strong class="text-secondary-text font-bold">Dept:</strong> ${dept}</div>
            <div><strong class="text-secondary-text font-bold">Address:</strong> ${address}</div>
            
            <div class="flex items-center justify-between mt-1 pt-1 border-t border-borders/20">
              <span class="px-1.5 py-0.5 rounded border text-[8px] uppercase font-extrabold ${sevClass}">
                ${severity}
              </span>
              <span class="text-secondary-text font-bold">
                ${verificationCount} Upvotes
              </span>
            </div>
            
            <div class="flex justify-between items-center bg-secondary-surface/40 p-1.5 rounded-lg border border-borders/30 mt-1">
              <span class="font-bold text-secondary-text">AI Priority Rating:</span>
              <span class="font-black text-primary-accent text-xs">${priorityScore.toFixed(1)} / 10.0</span>
            </div>
          </div>

          <button
            class="w-full mt-1.5 px-3 py-2 bg-primary-accent hover:bg-primary-accent/90 text-white rounded-lg text-center text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer select-none border-none outline-none popup-open-button"
            data-id="${incident.id}"
          >
            Open Incident
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      targetGroup.addLayer(marker);
    });

    map.addLayer(targetGroup);
    layersRef.current.clusterGroup = targetGroup;

    // 3. Setup Leaflet Heatmap Layer
    if (showHeatmap && incidents.length > 0) {
      const heatPoints = incidents.map(inc => {
        const lat = inc.latitude;
        const lon = inc.longitude;
        if (typeof lat !== 'number' || typeof lon !== 'number') return null;

        const severity = inc.analysis?.severity?.toLowerCase() || 'medium';
        let severityWeight = 0.5;
        if (severity === 'critical') severityWeight = 1.0;
        else if (severity === 'high') severityWeight = 0.8;
        else if (severity === 'medium') severityWeight = 0.6;
        else if (severity === 'low') severityWeight = 0.4;

        const priorityScore = typeof inc.analysis?.riskScore === 'number'
          ? inc.analysis.riskScore
          : parseFloat(inc.analysis?.riskScore) || 5.0;
        const priorityWeight = priorityScore / 10.0;
        const intensity = (severityWeight + priorityWeight) / 2;

        return [lat, lon, intensity];
      }).filter(Boolean);

      if (heatPoints.length > 0) {
        const heatLayer = L.heatLayer(heatPoints, {
          radius: 25,
          blur: 15,
          maxZoom: 14,
          gradient: {
            0.4: 'blue',
            0.6: 'cyan',
            0.7: 'lime',
            0.8: 'yellow',
            1.0: 'red'
          }
        });
        heatLayer.addTo(map);
        layersRef.current.heatLayer = heatLayer;
      }
    }

    // Setup popup action listener redirection
    const handlePopupClick = (e) => {
      if (e.target && e.target.classList.contains('popup-open-button')) {
        const id = e.target.getAttribute('data-id');
        if (id) {
          navigate(`/incident/${id}`);
        }
      }
    };

    map.on('popupopen', () => {
      document.querySelectorAll('.popup-open-button').forEach(btn => {
        btn.addEventListener('click', handlePopupClick);
      });
    });

    return () => {
      if (currentLayers.clusterGroup) {
        map.removeLayer(currentLayers.clusterGroup);
      }
      if (currentLayers.heatLayer) {
        map.removeLayer(currentLayers.heatLayer);
      }
      map.off('popupopen');
    };
  }, [incidents, showClusters, showHeatmap, map, navigate]);

  return null;
}

export default function IncidentMap({ incidents, selectedCity = 'All Cities' }) {
  const navigate = useNavigate();

  // Control variables for cluster and heatmap layers
  const [showClusters, setShowClusters] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [activeCategories, setActiveCategories] = useState({
    roads: true,
    utilities: true,
    lighting: true,
    sanitation: true,
    safety: true
  });

  // Filter valid incidents with coordinates
  const validIncidents = useMemo(() => {
    return incidents.filter(
      (inc) => typeof inc.latitude === 'number' && typeof inc.longitude === 'number'
    );
  }, [incidents]);

  // Apply map-level interactive category filter layer toggles
  const visibleIncidents = useMemo(() => {
    return validIncidents.filter(incident => {
      const dept = incident.authority?.department || '';
      const issueType = incident.analysis?.issueType || '';
      const category = getCategoryKey(dept, issueType);
      return activeCategories[category] !== false;
    });
  }, [validIncidents, activeCategories]);

  // Coordinates boundaries list
  const bounds = useMemo(() => {
    return visibleIncidents.map((inc) => [inc.latitude, inc.longitude]);
  }, [visibleIncidents]);

  // Initial map center
  const initialCenter = useMemo(() => {
    if (visibleIncidents.length > 0) {
      return [visibleIncidents[0].latitude, visibleIncidents[0].longitude];
    }
    return [28.6139, 77.2090];
  }, [visibleIncidents]);

  const toggleCategory = (cat) => {
    setActiveCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };

  return (
    <div className="w-full h-full overflow-hidden rounded-2xl relative border border-borders/60 shadow-inner flex">
      <MapContainer
        center={initialCenter}
        zoom={visibleIncidents.length > 0 ? 11 : 4}
        minZoom={4}
        maxBounds={[[5.0, 65.0], [38.0, 99.0]]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {/* Dynamic pan/bounds change tracker */}
        <ChangeMapBounds bounds={bounds} resetKey={resetKey} />
        {/* Custom controller injecting marker clustering & OSM heatmaps */}
        <CommandLayers
          incidents={visibleIncidents}
          showClusters={showClusters}
          showHeatmap={showHeatmap}
          navigate={navigate}
        />
      </MapContainer>

      {/* Floating Panel Open Trigger */}
      {!isPanelOpen && (
        <button
          onClick={() => setIsPanelOpen(true)}
          className="absolute top-4 right-4 z-[400] bg-surface/95 border border-borders rounded-xl px-3.5 py-2.5 font-bold flex items-center gap-1.5 shadow-lg cursor-pointer hover:border-primary-accent hover:text-primary-accent transition-all text-xs text-secondary-text select-none"
        >
          <Layers className="w-4 h-4 text-primary-accent animate-pulse" />
          <span>Open Control Deck</span>
        </button>
      )}

      {/* Floating Glassmorphic GIS Command Control Deck */}
      {isPanelOpen && (
        <Card className="absolute top-4 right-4 z-[400] w-64 bg-surface/90 backdrop-blur-md border border-borders p-4 rounded-2xl shadow-xl flex flex-col gap-4 text-xs select-none max-h-[90%] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-borders/50 pb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary-accent" />
              <h4 className="font-bold text-primary-text text-sm">GIS Control Deck</h4>
            </div>
            <button
              onClick={() => setIsPanelOpen(false)}
              className="text-muted-text hover:text-primary-text cursor-pointer text-sm font-semibold p-1 hover:bg-secondary-surface rounded"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-text font-semibold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary-accent" />
              City Scope: {selectedCity}
            </span>
          </div>

        {/* Layer Toggles */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">Map Layers</span>
          <button
            onClick={() => setShowClusters(prev => !prev)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all
              ${showClusters
                ? 'bg-primary-accent/10 border-primary-accent/30 text-primary-accent'
                : 'bg-secondary-surface/40 border-borders text-secondary-text hover:border-primary-accent/40'
              }
            `}
          >
            <span>Incident Clustering</span>
            {showClusters ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowHeatmap(prev => !prev)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all
              ${showHeatmap
                ? 'bg-primary-accent/10 border-primary-accent/30 text-primary-accent'
                : 'bg-secondary-surface/40 border-borders text-secondary-text hover:border-primary-accent/40'
              }
            `}
          >
            <span>Density Heatmap</span>
            {showHeatmap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-col gap-2 border-t border-borders/50 pt-2.5">
          <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">Category Layers</span>
          <div className="flex flex-col gap-1.5">
            {[
              { id: 'roads', label: 'Roads & Potholes', color: 'bg-primary-accent' },
              { id: 'utilities', label: 'Utilities & Water', color: 'bg-blue-500' },
              { id: 'lighting', label: 'Street Lighting', color: 'bg-yellow-500' },
              { id: 'sanitation', label: 'Sanitation & Waste', color: 'bg-emerald-500' },
              { id: 'safety', label: 'Public Safety', color: 'bg-danger' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all text-left
                  ${activeCategories[cat.id]
                    ? 'bg-surface border-borders text-primary-text'
                    : 'bg-secondary-surface/30 border-borders/40 text-muted-text opacity-60'
                  }
                `}
              >
                <span className={`w-2 h-2 rounded-full ${cat.color} shrink-0`} />
                <span className="flex-1 truncate">{cat.label}</span>
                {activeCategories[cat.id] ? (
                  <span className="text-[9px] font-bold text-primary-accent">ON</span>
                ) : (
                  <span className="text-[9px] font-bold text-muted-text">OFF</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* View resetting button */}
        <button
          onClick={handleReset}
          className="w-full mt-1.5 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-accent hover:bg-primary-accent/90 text-white rounded-xl text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer select-none"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Viewport</span>
        </button>
        </Card>
      )}
    </div>
  );
}
