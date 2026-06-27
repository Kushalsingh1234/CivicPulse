export const MOCK_CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'roads', label: 'Roads & Potholes', icon: 'Road' },
  { id: 'utilities', label: 'Utilities & Water', icon: 'Droplets' },
  { id: 'lighting', label: 'Street Lighting', icon: 'Lightbulb' },
  { id: 'sanitation', label: 'Sanitation & Waste', icon: 'Trash2' },
  { id: 'safety', label: 'Public Safety', icon: 'ShieldAlert' }
];

export const MOCK_INCIDENTS = [
  {
    id: 'inc-001',
    title: 'Severe Road Subsidence and Pothole',
    category: 'roads',
    categoryLabel: 'Roads & Potholes',
    description: 'Huge hole opened up in the middle of the active lane on Oak Avenue. Cars are swerving to avoid it. Extremely dangerous at night.',
    location: {
      address: '742 Oak Avenue, Midtown',
      lat: 37.7749,
      lng: -122.4194
    },
    severity: 'critical',
    status: 'dispatched',
    priorityScore: 9.2,
    createdAt: '2026-06-25T08:30:00Z',
    verificationCount: 28,
    imageUrl: '/images/road_pothole.png',
    aiAnalysis: {
      classification: 'Major Road Infrastructure Failure (Category: Roads & Potholes)',
      severityAssessment: 'CRITICAL. Width approx 1.2m, depth 25cm. Structural damage to road bed visible.',
      riskAssessment: 'HIGH RISK. Located in primary active lane of a medium-density street. High probability of vehicle suspension damage, tire blowouts, or head-on collisions due to sudden swerving.',
      priorityScoringReason: 'Severe infrastructure compromise on a high-traffic connector street with active safety risks.',
      recommendedAuthority: 'Department of Public Works (DPW) - Road Maintenance Division',
      draftReport: 'INSPECTION REPORT:\nStructure: Asphalt roadbed subsidence.\nLocation: 742 Oak Ave (Eastbound lane, 15m from intersection).\nUrgency: Urgent dispatch recommended. Road barriers required immediately.'
    }
  },
  {
    id: 'inc-002',
    title: 'Burst Main Water Pipe with Street Flooding',
    category: 'utilities',
    categoryLabel: 'Utilities & Water',
    description: 'Water is gushing out from under the pavement near the sidewalk. The street is starting to flood and water pressure in our building has dropped.',
    location: {
      address: '1105 Pine Boulevard, Westside',
      lat: 37.7833,
      lng: -122.4167
    },
    severity: 'high',
    status: 'dispatched',
    priorityScore: 8.5,
    createdAt: '2026-06-25T09:15:00Z',
    verificationCount: 19,
    imageUrl: '/images/street_flooding.png',
    aiAnalysis: {
      classification: 'Main Water Line Leak (Category: Utilities & Water)',
      severityAssessment: 'HIGH. Continuous high-volume potable water discharge, causing minor local erosion of road sub-base.',
      riskAssessment: 'MODERATE-HIGH. Basement flooding risk for adjacent commercial buildings. Slick road conditions and potential sinkhole formation if flow continues unchecked.',
      priorityScoringReason: 'Clean water waste and potential flooding threat to local properties and structural roadway integrity.',
      recommendedAuthority: 'Municipal Water and Sewer Utility Agency',
      draftReport: 'EMERGENCY UTILITY REPORT:\nType: Main line rupture.\nVolume Estimate: ~150 liters/min.\nImpact: Sub-surface washouts suspected under sidewalk flags.'
    }
  },
  {
    id: 'inc-003',
    title: 'Vandalized / Exposed Electrical Junction Box',
    category: 'safety',
    categoryLabel: 'Public Safety',
    description: 'The green metal box on the corner has been pried open. There are exposed wires right next to the school bus stop where kids wait.',
    location: {
      address: 'Summit Street & 4th Ave, Heights District',
      lat: 37.7599,
      lng: -122.4376
    },
    severity: 'critical',
    status: 'reported',
    priorityScore: 9.6,
    createdAt: '2026-06-25T11:45:00Z',
    verificationCount: 42,
    imageUrl: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=800&q=80',
    aiAnalysis: {
      classification: 'Exposed Electrical Hazard (Category: Public Safety)',
      severityAssessment: 'CRITICAL. Open 120V/240V circuits exposed to ambient weather and public touch.',
      riskAssessment: 'EXTREME RISK. High pedestrian traffic zone, immediately adjacent to an active school bus stop. High danger of electrocution, particularly under wet conditions.',
      priorityScoringReason: 'Severe electrical safety hazard in close proximity to children and general public.',
      recommendedAuthority: 'Power Grid Operations - Emergency Response Unit',
      draftReport: 'HAZARD REPORT:\nEquipment: Ground-mount utility cabinet (vandalized lock).\nStatus: Live components accessible. Immediate isolation and physical lock-out required.'
    }
  },
  {
    id: 'inc-004',
    title: 'Multiple Broken Streetlights on Pedestrian Path',
    category: 'lighting',
    categoryLabel: 'Street Lighting',
    description: 'Three consecutive streetlights along the park walkway are out. It is pitch black and feels very unsafe walking home from the transit station.',
    location: {
      address: 'Central Park East Walkway, near Metro Gate B',
      lat: 37.7699,
      lng: -122.4468
    },
    severity: 'medium',
    status: 'analyzing',
    priorityScore: 6.8,
    createdAt: '2026-06-25T13:02:00Z',
    verificationCount: 12,
    imageUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    aiAnalysis: {
      classification: 'Local Illumination Outage (Category: Street Lighting)',
      severityAssessment: 'MEDIUM. Series of 3 dark poles. Walkway illumination reduced to <5%.',
      riskAssessment: 'MODERATE. Increased vulnerability to trips/falls and criminal activity along a busy commuter pedestrian artery.',
      priorityScoringReason: 'Public security issue along a primary commuter walkway, though no active structural hazard exists.',
      recommendedAuthority: 'City Bureau of Street Lighting',
      draftReport: 'WORK ORDER DRAFT:\nAssets: Poles CP-E14, CP-E15, CP-E16.\nFault: Potential series circuit breaker trip or bulb failures. Replace with standard LED fixtures.'
    }
  },
  {
    id: 'inc-005',
    title: 'Illegal Dumping of Hazardous Materials',
    category: 'sanitation',
    categoryLabel: 'Sanitation & Waste',
    description: 'Someone left several car batteries and oil drums in the alleyway behind the grocery store. Some of the oil seems to be leaking towards the storm drain.',
    location: {
      address: 'Alleyway behind 1488 Market Street',
      lat: 37.7739,
      lng: -122.4180
    },
    severity: 'high',
    status: 'reported',
    priorityScore: 8.2,
    createdAt: '2026-06-25T14:10:00Z',
    verificationCount: 8,
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=800&q=80',
    aiAnalysis: {
      classification: 'Hazardous Waste Dump (Category: Sanitation & Waste)',
      severityAssessment: 'HIGH. Lead-acid battery leakage and motor oil pooling on pervious pavement.',
      riskAssessment: 'HIGH. Environmental contamination. Runoff is flowing towards a municipal storm drain connected directly to the local river system.',
      priorityScoringReason: 'Active chemical contamination threat to water drainage infrastructure.',
      recommendedAuthority: 'Environmental Protection Department / Hazmat Disposal Team',
      draftReport: 'HAZMAT DISPATCH RECOMMENDATION:\nSubstances: Automotive batteries (lead/acid), spent motor oil.\nActions: Deploy absorbent booms, retrieve batteries, pressure wash asphalt.'
    }
  },
  {
    id: 'inc-006',
    title: 'Traffic Signal Malfunction (Flash Mode)',
    category: 'roads',
    categoryLabel: 'Roads & Potholes',
    description: 'The traffic light at the intersection of Broadway and Elm is flashing red in all directions, causing massive traffic gridlock and near-misses.',
    location: {
      address: 'Intersection of Broadway & Elm Street',
      lat: 37.7950,
      lng: -122.4030
    },
    severity: 'high',
    status: 'resolved',
    priorityScore: 8.9,
    createdAt: '2026-06-24T17:00:00Z',
    verificationCount: 55,
    imageUrl: 'https://images.unsplash.com/photo-1494587351196-bcf5f29cbe4d?auto=format&fit=crop&w=800&q=80',
    aiAnalysis: {
      classification: 'Traffic Control System Failure (Category: Roads & Potholes)',
      severityAssessment: 'HIGH. Intersection controller crashed, falling back to all-way flashing emergency state.',
      riskAssessment: 'HIGH. Junction of two major arterials. Massive traffic delay and increased vehicle crash rates due to driver confusion.',
      priorityScoringReason: 'Major traffic disruption and safety threat at a key urban intersection.',
      recommendedAuthority: 'Department of Transportation (DOT) - Traffic Operations',
      draftReport: 'SIGNAL REPAIR BRIEF:\nLocation: Broadway/Elm (Junction ID #402).\nLog: Controller unit rebooted. Replaced telemetry module. Normal operation restored.'
    }
  }
];
