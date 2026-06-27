import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import Badge from '../components/ui/Badge';
import ProgressStepper from '../components/ui/ProgressStepper';
import { Upload, MapPin, Sparkles, RefreshCw, CheckCircle, ShieldAlert, FileText, Loader2 } from 'lucide-react';
import { analyzeIncident } from '../services/gemini/visionService';
import { createIncident } from '../services/firebase/firestoreService';
// Samples that users can click to pre-fill and run analysis
const MOCK_SAMPLES = [
  {
    id: 's-1',
    title: 'Exposed Electrical Hazard',
    description: 'A metal electrical cabinet near the school bus stop is open, exposing red and yellow wires to the weather.',
    address: 'Summit Street & 4th Ave, Heights District',
    imageUrl: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=800&q=80',
    severity: 'critical',
    priorityScore: 9.6,
    aiAnalysis: {
      category: 'Public Safety & Utilities',
      severityDetail: 'CRITICAL. Weatherproof seals breached. Main grid distribution lines (120V/240V) fully exposed to public touch.',
      riskDetail: 'EXTREME. Direct risk of contact electrocution. Wet forecast increases immediate failure and grounding hazards.',
      authority: 'Municipal Power Grid - Emergency Maintenance Unit',
      dispatchTemplate: 'ALERT: Urgent priority hazard identified at Summit St & 4th Ave. Utility Junction #CP-E94 has compromised locks and active exposure. Immediate lock-out crew required.'
    }
  },
  {
    id: 's-2',
    title: 'Water Main Line Rupture',
    description: 'Significant water pooling and gushing onto the sidewalk near the market. Water pressure in our store is very low.',
    address: '1105 Pine Boulevard, Westside',
    imageUrl: '/images/street_flooding.png',
    severity: 'high',
    priorityScore: 8.5,
    aiAnalysis: {
      category: 'Utilities & Sanitation',
      severityDetail: 'HIGH. Potable water line breach. Flow rate estimated at 120-150 L/min. Active erosion of brick sidewalk substrate.',
      riskDetail: 'MODERATE-HIGH. Safety hazards from standing water on active roadway and undermining of sidewalk structural integrity.',
      authority: 'Municipal Water Authority - Main Line Repairs',
      dispatchTemplate: 'DISPATCH WORK ORDER: Pine Boulevard Main Line Leak. Sidewalk structural washouts suspected. Shutoff valves must be located and closed immediately to prevent sidewalk collapse.'
    }
  },
  {
    id: 's-3',
    title: 'Deep Road Subsidence / Sinkhole',
    description: 'A deep pothole has opened up in the lane, exposing steel rebar underneath. Cars are dodging it.',
    address: '742 Oak Avenue, Midtown',
    imageUrl: '/images/road_pothole.png',
    severity: 'critical',
    priorityScore: 9.2,
    aiAnalysis: {
      category: 'Roads & Potholes',
      severityDetail: 'CRITICAL. Depth exceeding 25cm. Severe sub-base roadway erosion. Exposed rebar indicates structural integrity loss.',
      riskDetail: 'HIGH. Vehicle axle/wheel damage. High speed swerving maneuvers in a two-lane arterial road causing collision risk.',
      authority: 'Department of Public Works - Road Operations',
      dispatchTemplate: 'URGENT DISPATCH: Roadway subsidence and rebar exposure on Oak Avenue. Place warning cones and barriers immediately to close lane. Emergency repaving scheduled for tonight.'
    }
  }
];

export default function Analyzer() {
  const [selectedSample, setSelectedSample] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [locationText, setLocationText] = useState('');
  const [description, setDescription] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // AI Pipeline Stepper State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);

  // API Call state
  const [apiData, setApiData] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [firestoreDocId, setFirestoreDocId] = useState(null);

  const steps = [
    { title: 'Vision Scan', description: 'Detecting structures and objects' },
    { title: 'Severity Check', description: 'Estimating damage scale & impact' },
    { title: 'Risk Engine', description: 'Modeling security and safety hazards' },
    { title: 'Priority Dispatch', description: 'Routing to authority & writing briefs' }
  ];

  // Auto-fill from sample
  const handleSelectSample = (sample) => {
    setSelectedSample(sample);
    setImageUrl(sample.imageUrl);
    setImageFile({ name: `${sample.title.toLowerCase().replace(/\s+/g, '_')}.jpg` });
    setLocationText(sample.address);
    setDescription(sample.description);
    setApiError(null);
    setFirestoreDocId(null);
  };

  // Detect location mock
  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setTimeout(() => {
      setIsDetectingLocation(false);
      setLocationText('742 Oak Avenue, Midtown (37.7749° N, 122.4194° W)');
    }, 1200);
  };

  // Drag and drop / file upload mock
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create a local blob URL for mock display
      setImageUrl(URL.createObjectURL(file));
      setSelectedSample(null);
      setApiError(null);
      setFirestoreDocId(null);
    }
  };

  // Run AI simulation pipeline
  const handleAnalyze = async () => {
    if (!imageUrl || !locationText) return;

    setIsAnalyzing(true);
    setCurrentStepIndex(0);
    setAnalysisResult(null);
    setApiData(null);
    setApiError(null);
    setFirestoreDocId(null);

    try {
      // If we used a prefilled sample, the imageFile is a mock object (doesn't inherit File). 
      // We pass the raw Unsplash image URL. Otherwise, we pass the local File object.
      const imageToAnalyze = selectedSample ? selectedSample.imageUrl : (imageFile instanceof File ? imageFile : imageUrl);
      
      const result = await analyzeIncident(imageToAnalyze, locationText, description);
      
      // Persist to operations queue in Cloud Firestore
      const docId = await createIncident({
        analysis: result.analysis,
        authority: result.authority,
        resolution: result.resolution,
        impactPrediction: result.impactPrediction,
        summary: result.summary,
        location: locationText,
        description: description,
        city: result.locationAnalysis?.city || 'Unknown',
        state: result.locationAnalysis?.state || 'Unknown',
        country: result.locationAnalysis?.country || 'Unknown',
        landmark: result.locationAnalysis?.landmark || ''
      });

      setFirestoreDocId(docId);
      setApiData(result);
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'An unexpected error occurred during analysis.');
      setIsAnalyzing(false);
    }
  };

  // Control stepper animation sequence and wait for API data
  useEffect(() => {
    let timer;
    if (isAnalyzing) {
      if (apiData) {
        setIsAnalyzing(false);
        setAnalysisResult(apiData);
      } else if (currentStepIndex < steps.length - 1) {
        timer = setTimeout(() => {
          setCurrentStepIndex((prev) => prev + 1);
        }, 1500); // 1.5 seconds per step
      }
    }
    return () => clearTimeout(timer);
  }, [isAnalyzing, currentStepIndex, apiData, steps.length]);

  // Fallback trigger if API finishes exactly at the last step
  useEffect(() => {
    if (isAnalyzing && apiData && currentStepIndex === steps.length - 1) {
      setIsAnalyzing(false);
      setAnalysisResult(apiData);
    }
  }, [isAnalyzing, apiData, currentStepIndex, steps.length]);

  const handleReset = () => {
    setSelectedSample(null);
    setImageFile(null);
    setImageUrl('');
    setLocationText('');
    setDescription('');
    setAnalysisResult(null);
    setCurrentStepIndex(0);
    setIsAnalyzing(false);
    setApiData(null);
    setApiError(null);
    setFirestoreDocId(null);
  };

  const category = analysisResult?.authority?.department || 'General Operations';
  const severity = analysisResult?.analysis?.severity?.toLowerCase() || 'medium';
  const severityBadgeVariant = severity === 'critical' ? 'danger' : (severity === 'high' ? 'danger' : (severity === 'medium' ? 'warning' : 'neutral'));
  const title = analysisResult?.analysis?.issueType || 'Incident Report';
  const address = analysisResult?.telemetry?.address || locationText;
  const priorityScore = typeof analysisResult?.analysis?.riskScore === 'number' 
    ? analysisResult.analysis.riskScore 
    : parseFloat(analysisResult?.analysis?.riskScore) || 5.0;
  const severityDetail = analysisResult?.analysis?.publicSafetyRisk || 'No severity details provided.';
  const riskDetail = analysisResult?.analysis?.environmentalRisk || 'No environmental risks assessed.';
  const authority = analysisResult?.authority?.department || 'Operations Team';
  
  const confidence = analysisResult?.analysis?.confidence || 1.0;
  const locationConfidence = analysisResult?.locationAnalysis?.locationConfidence || 1.0;
  const isLowConfidence = confidence < 0.75 || locationConfidence < 0.75;

  return (
    <div className="flex flex-col gap-8 md:gap-10 text-left">
      <PageHeader
        title="AI Incident Analyzer"
        description="Transform public infrastructure hazards into structured operations logs instantly using artificial intelligence."
      />

      <AnimatePresence mode="wait">
        {/* State 1: Form Input */}
        {!isAnalyzing && !analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
          >
            {/* Left/Middle Columns: Form Input */}
            <div className="lg:col-span-2 min-w-0 flex flex-col gap-6">
              <Card className="flex flex-col gap-6 min-w-0">
                <h2 className="text-xl font-bold text-primary-text border-b border-borders/60 pb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-accent" />
                  Incident Details
                </h2>

                {apiError && (
                  <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm flex flex-col gap-3 min-w-0">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1 break-words">
                        <p className="font-bold text-danger">Analysis Failed</p>
                        <p className="text-xs text-danger/90 mt-1 break-all whitespace-pre-wrap">{apiError}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="secondary" size="sm" onClick={() => setApiError(null)} className="px-3.5 py-1.5 h-auto text-xs font-semibold">
                        Dismiss
                      </Button>
                      <Button variant="danger" size="sm" onClick={handleAnalyze} className="px-3.5 py-1.5 h-auto text-xs font-semibold">
                        Retry Analysis
                      </Button>
                    </div>
                  </div>
                )}

                {/* File Upload Zone */}
                <div>
                  <label className="block text-sm font-medium text-secondary-text mb-2">
                    Evidence Image <span className="text-danger">*</span>
                  </label>
                  <div className="border-2 border-dashed border-borders hover:border-primary-accent/50 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer bg-secondary-surface/20 relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    {imageUrl ? (
                      <div className="relative w-full max-h-[300px] rounded-xl overflow-hidden">
                        <img src={imageUrl} alt="Incident preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Button variant="secondary" size="sm" icon={RefreshCw}>Change Photo</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 rounded-full bg-secondary-surface text-primary-accent mb-4">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold text-primary-text mb-1">
                          Click to upload, or drag and drop
                        </span>
                        <span className="text-xs text-muted-text">
                          PNG, JPG, or WEBP (Max 5MB)
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Geolocation Input */}
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <Input
                    label="Incident Location *"
                    placeholder="Enter street address or coordinates"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    icon={MapPin}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="shrink-0 w-full md:w-auto h-[46px]"
                    icon={isDetectingLocation ? Loader2 : MapPin}
                    iconPosition="left"
                    isLoading={isDetectingLocation}
                  >
                    {isDetectingLocation ? 'Locating...' : 'Detect GPS'}
                  </Button>
                </div>

                {/* Optional short description */}
                <Textarea
                  label="Description (Optional)"
                  placeholder="Provide any additional details or background information..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />

                {/* Analyze Trigger */}
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!imageUrl || !locationText}
                  onClick={handleAnalyze}
                  className="w-full mt-2"
                  icon={Sparkles}
                >
                  Analyze Incident with AI
                </Button>
              </Card>
            </div>

            {/* Right Column: Pre-filled Testing Samples */}
            <div className="flex flex-col gap-6">
              <Card className="bg-secondary-surface/30">
                <h3 className="text-base font-bold text-primary-text mb-2">
                  Interactive Demo Samples
                </h3>
                <p className="text-xs text-secondary-text mb-6">
                  Select a pre-configured incident mockup to test our multi-stage AI analysis and dispatch pipeline instantly:
                </p>

                <div className="flex flex-col gap-4">
                  {MOCK_SAMPLES.map((sample) => {
                    const isSelected = selectedSample?.id === sample.id;
                    return (
                      <div
                        key={sample.id}
                        onClick={() => handleSelectSample(sample)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex gap-3 items-center bg-surface hover:shadow-xs
                          ${isSelected
                            ? 'border-primary-accent ring-2 ring-primary-accent/10'
                            : 'border-borders/85'
                          }
                        `}
                      >
                        <div className="w-12 h-12 rounded-lg bg-secondary-surface overflow-hidden shrink-0">
                          <img src={sample.imageUrl} alt={sample.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-primary-text truncate">{sample.title}</h4>
                          <span className="text-[10px] text-muted-text font-medium truncate block">{sample.address}</span>
                          <span className={`text-[9px] uppercase font-bold tracking-wider mt-1 inline-block px-1.5 py-0.5 rounded-sm border
                            ${sample.severity === 'critical' ? 'bg-danger/5 border-danger/10 text-danger' : 'bg-warning/5 border-warning/10 text-amber-600'}
                          `}>
                            {sample.severity}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {/* State 2: Analyzing Loading Pipeline */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-3xl mx-auto py-12 md:py-20"
          >
            <Card className="flex flex-col items-center justify-center p-8 md:p-12 text-center shadow-lg">
              {/* Spinning Logo Symbol */}
              <div className="w-20 h-20 rounded-full bg-primary-accent/5 flex items-center justify-center text-primary-accent mb-8 relative border border-primary-accent/10">
                <Loader2 className="w-10 h-10 animate-spin opacity-80" />
                <Sparkles className="w-5 h-5 text-secondary-accent absolute top-2 right-2 animate-bounce" />
              </div>

              <h2 className="text-2xl font-extrabold text-primary-text mb-2">
                Analyzing Incident Assets
              </h2>
              <p className="text-sm text-secondary-text mb-12 max-w-md">
                Gemini LLM and Computer Vision models are processing the image, assessing local environment risks, and generating operations logs...
              </p>

              {/* Progress Stepper Component */}
              <ProgressStepper
                steps={steps}
                currentStepIndex={currentStepIndex}
                className="w-full"
              />
            </Card>
          </motion.div>
        )}

        {/* State 3: Analysis Results */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start"
          >
            {/* Left 2 Columns: Structured Analysis details */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <Card className="p-8 flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b border-borders pb-6 gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <Badge variant="primary">{category}</Badge>
                      <Badge variant={severityBadgeVariant}>
                        {severity.toUpperCase()} SEVERITY
                      </Badge>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-primary-text tracking-tight mb-2">
                      {title}
                    </h2>
                    <p className="text-xs text-muted-text flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary-accent" />
                      {address}
                    </p>
                  </div>
                  
                  {/* Priority Gauge */}
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

                {firestoreDocId && (
                  <div className="p-4 rounded-xl bg-success/8 text-emerald-800 border border-success/20 text-xs flex items-start gap-3 select-none -mt-4 mb-2 animate-pulse min-w-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1 break-words">
                      <p className="font-bold text-emerald-700">Incident Persisted to Operations Queue</p>
                      <p className="text-emerald-600/90 mt-1 break-all whitespace-pre-wrap">
                        The hazard report has been successfully recorded in Cloud Firestore. Reference Document ID: <code className="bg-emerald-500/10 px-1 py-0.5 rounded font-mono text-[10px] select-all cursor-pointer font-bold" title="Click to select">{firestoreDocId}</code>.
                      </p>
                    </div>
                  </div>
                )}

                {isLowConfidence && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 text-xs flex items-start gap-3 select-none -mt-4 mb-2 min-w-0">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1 break-words">
                      <p className="font-bold text-amber-700">Verification Recommended (Low Confidence Analysis)</p>
                      <p className="text-amber-600/90 mt-1 break-all whitespace-pre-wrap">
                        The AI models returned a confidence level of {(confidence * 100).toFixed(0)}% (location match: {(locationConfidence * 100).toFixed(0)}%). 
                        Please review and confirm routing details manually before submitting to the Operations Queue.
                      </p>
                    </div>
                  </div>
                )}

                {/* Analysis Points */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Severity Assessment */}
                  <div className="flex gap-4 items-start text-left">
                    <div className="p-2.5 rounded-xl bg-danger/8 text-danger shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-primary-text mb-1">Severity Assessment</h3>
                      <p className="text-sm text-secondary-text leading-relaxed">{severityDetail}</p>
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  <div className="flex gap-4 items-start text-left">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-primary-text mb-1">Safety Risk Modeling</h3>
                      <p className="text-sm text-secondary-text leading-relaxed">{riskDetail}</p>
                    </div>
                  </div>

                  {/* Recommended Routing */}
                  <div className="flex gap-4 items-start text-left">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-primary-accent border border-teal-100 shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-primary-text mb-1">Dispatch Destination</h3>
                      <p className="text-sm text-secondary-text leading-relaxed font-semibold">{authority}</p>
                    </div>
                  </div>
                </div>

                {/* Operations Dispatch Ticket */}
                <div className="flex flex-col gap-4 text-left">
                  <span className="text-xs font-bold text-secondary-text flex items-center gap-1.5 select-none">
                    <FileText className="w-4 h-4 text-primary-accent" />
                    AI-Generated Operations Dispatch Ticket
                  </span>
                  
                  <div className="border border-borders rounded-2xl bg-surface overflow-hidden shadow-xs">
                    {/* Ticket Header Banner */}
                    <div className="px-6 py-4 bg-primary-accent/5 border-b border-borders flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-primary-accent text-white">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-primary-text uppercase tracking-wider leading-none">
                            Official Dispatch Directive
                          </h4>
                          <span className="text-[10px] text-muted-text font-mono font-bold mt-1 inline-block">
                            TICKET ID: {firestoreDocId || 'PENDING'}
                          </span>
                        </div>
                      </div>
                      <Badge variant="success" size="xs">ACTIVE DISPATCH</Badge>
                    </div>

                    <div className="p-6 flex flex-col gap-6">
                      {/* Grid: Incident Context */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-borders/60">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-bold text-muted-text uppercase tracking-wider select-none">Incident Type</span>
                          <span className="text-xs font-bold text-primary-text leading-tight">{analysisResult?.analysis?.issueType || 'Unknown Incident'}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-bold text-muted-text uppercase tracking-wider select-none">Assigned Department</span>
                          <span className="text-xs font-bold text-primary-accent leading-tight">{analysisResult?.authority?.department || 'Operations Team'}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-bold text-muted-text uppercase tracking-wider select-none">Target Telemetry Location</span>
                          <span className="text-xs text-secondary-text leading-tight">{address}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-bold text-muted-text uppercase tracking-wider select-none">Dispatch Urgency & Priority</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={severityBadgeVariant} size="xs">{(analysisResult?.authority?.urgency || 'Standard').toUpperCase()}</Badge>
                            <span className="text-[11px] font-semibold text-secondary-text">Priority Score: {priorityScore.toFixed(1)}/10.0</span>
                          </div>
                        </div>
                      </div>

                      {/* Resolution Plan Timeline */}
                      <div className="flex flex-col gap-4 pb-6 border-b border-borders/60 text-xs">
                        <span className="text-[9px] font-bold text-muted-text uppercase tracking-wider select-none">Tactical Action Plan</span>
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-3">
                            <span className="shrink-0 w-24 text-[10px] font-bold uppercase tracking-wider text-danger mt-0.5">Immediate:</span>
                            <p className="text-secondary-text leading-relaxed font-medium">{analysisResult?.resolution?.immediateAction || 'Standard evaluation dispatch.'}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-3">
                            <span className="shrink-0 w-24 text-[10px] font-bold uppercase tracking-wider text-amber-600 mt-0.5">Short-Term:</span>
                            <p className="text-secondary-text leading-relaxed font-medium">{analysisResult?.resolution?.shortTerm || 'Establish safety boundaries.'}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-3">
                            <span className="shrink-0 w-24 text-[10px] font-bold uppercase tracking-wider text-primary-accent mt-0.5">Long-Term:</span>
                            <p className="text-secondary-text leading-relaxed font-medium">{analysisResult?.resolution?.longTerm || 'Permanent engineering restoration.'}</p>
                          </div>
                        </div>
                      </div>

                      {/* AI Executive Summary */}
                      <div className="flex flex-col gap-2 bg-secondary-surface/20 border border-borders/40 rounded-xl p-4 text-xs">
                        <span className="text-[9px] font-bold text-muted-text uppercase tracking-wider select-none flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-primary-accent" />
                          AI Brief & Outlook
                        </span>
                        <p className="leading-relaxed text-secondary-text italic font-semibold">
                          "{analysisResult?.summary || 'No summary report generated.'}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action panel */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-borders/60">
                  <Button
                    variant="primary"
                    onClick={handleReset}
                    className="flex-1"
                    icon={CheckCircle}
                  >
                    Submit to Operations Queue
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleReset}
                    icon={RefreshCw}
                  >
                    Analyze New Incident
                  </Button>
                </div>
              </Card>
            </div>

            {/* Right Column: Visual Evidence */}
            <div className="flex flex-col gap-6">
              <Card className="p-0! overflow-hidden">
                <div className="px-6 py-4 border-b border-borders bg-secondary-surface/40">
                  <h3 className="text-sm font-bold text-primary-text">
                    Uploaded Evidence
                  </h3>
                </div>
                <div className="w-full aspect-square bg-slate-900 relative">
                  <img
                    src={imageUrl || analysisResult.imageUrl}
                    alt="Analyzed incident"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <span className="text-[10px] text-muted-text uppercase font-bold tracking-wide block mb-1">
                    Telemetry Metadata
                  </span>
                  <div className="flex flex-col gap-1.5 text-xs text-secondary-text text-left">
                    <div className="flex justify-between">
                      <span className="text-muted-text">File Type</span>
                      <span>{imageFile?.type || 'image/jpeg'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-text">Analyzed At</span>
                      <span>{analysisResult?.telemetry?.analyzedAt ? new Date(analysisResult.telemetry.analyzedAt).toLocaleString() : new Date().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-text">Vision Model</span>
                      <span>{analysisResult?.telemetry?.modelUsed || 'Gemini-Pro-Vision'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
