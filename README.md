# CivicPulse AI

CivicPulse AI is a next-generation, AI-prioritized smart city operations platform that bridges the gap between citizens and municipal authorities. By leveraging state-of-the-art vision models, Firestore databases, and specialized AI agents, CivicPulse streamlines how civic hazards are reported, verified, categorized, and resolved.

---

## 🌟 Key Platform Features

### 1. Zero-Friction AI Incident Analyzer (For Citizens)
- **Gemini 2.5 Flash Vision Integration**: Analyzes user-uploaded photos of civic hazards (e.g. potholes, water leaks, broken lights) in real-time.
- **Automated Metadata Extraction**: Extracts issue classification, severity levels, risk assessments, structural coordinates, and specific location landmarks (e.g. nearby buildings, addresses).
- **Interactive Sample Sandbox**: Allows quick demo analysis of common issues (Road Potholes, Water Burst, Sinkhole Subsidence) with pre-loaded mock assets.
- **Operations Dispatch Tickets**: Instantly converts analyzed images into readable operational reports showing tactical steps and predictions.

### 2. Live Community Feed
- **Firestore Realtime Synchronization**: Provides an instantly updating live stream of community reports.
- **Upvote Verification System**: Enables citizens to verify existing issues, dynamically increasing an incident's priority score.
- **Status Badging**: Visual state tracking for issues (Open, In Progress, Resolved).

### 3. City-Aware Operations Center (For Municipal Officers)
- **Municipal Scope Filters**: Allows sorting queue lists, metrics, and intelligence summaries by selecting specific cities (e.g., Delhi, Mumbai) or nationwide view.
- **Live Dispatch Queue**: Priority-ordered logs based on AI risk assessment scores and citizen upvotes.
- **Predictive Department Routing**: Machine-learning heuristics classify incoming reports to the correct municipal department (DPW, Electrical, Water, Sanitation, Public Safety).
- **Status Transition Controls**: Toggles status values (Open -> In Progress -> Resolved) directly updating live Firestore documents.

### 4. Smart AI City Intelligence Desk
- **Executive Operations Brief**: Dynamic, plain-text municipal updates summarizing risk trends and critical bottlenecks.
- **Identified Hazard Hotspots**: Geographically lists severe risk coordinates to help target municipal maintenance teams.
- **Strategic Workloads**: Interactive load indicators displaying the resource utilization percentage of each department.
- **Multi-Level Intelligence Caching**:
  - **In-Memory Cache**: Sync-retrieves data instantly during active navigation.
  - **Firestore Intelligence Cache**: Persists pre-generated city analysis under deterministic dataset fingerprints (derived from sorting, status updates, priority shifts). Bypasses Gemini API call quotas entirely if the dataset signature has not changed.

### 5. AI Operations Copilot Drawer
- **Advisory Conversational Agent**: Side drawer panel powered by `gemini-2.5-flash` contextualized on active incidents and pre-generated AI City Intelligence briefs.
- **Privacy-Safe Referencing**: Employs deterministic Case Numbers (e.g., `CP-082341`) to mask raw Firestore document IDs. References incidents primarily by location/type, reserving case numbers for clarifications.
- **Suggested Action Chips**: Immediate clicks to fetch workload summaries, safety hotspots, and key prioritization guidelines.

### 6. Interactive GIS Telemetry Map & Command Deck
- **Leaflet & OSM Tile Rendering**: Integrates a real interactive Leaflet GIS map with OpenStreetMap tiles.
- **Marker Clustering**: Automatically groups nearby incidents into clusters. Clusters are color-coded based on the highest severity inside the group (Critical -> Red, High -> Orange, Medium -> Yellow, Low -> Green). Clicking on a cluster zooms into the affected area.
- **Density Heatmap Overlay**: Generates point intensities using incident density, priority score, and severity, creating a visual hot-spot heatmap that can be toggled on/off.
- **Interactive Layer Toggles**: Floating glassmorphic command panel enables toggling clustering, density heatmaps, and individual categories (Roads, Utilities, Lighting, Sanitation, Safety) on/off, filtering visible map points instantly.
- **Dynamic India Bound Restriction**: Confines map viewport limits (zoom range `minZoom={4}` and boundaries bounding box) to lock the default view on India's borders, preventing panning outside the country.
- **Detailed Popup Overlays**: Clicking on any incident marker shows details: thumbnail image, category status, reported time, department assignment, verification count, priority score, severity badge, and an "Open Incident" action routing directly to the details page.

---

## 🛠️ Technical Stack & Architecture

- **Frontend Core**: React 18, Vite, React Router DOM (v6), Framer Motion (for premium transitions).
- **Styling**: Tailwind CSS (custom HSL theme tokens with glassmorphism, responsive grid systems).
- **Database & Live Sync**: Cloud Firestore (realtime snapshot streams, compound filters).
- **AI Core Engine**: Official `@google/genai` SDK querying `gemini-2.5-flash` for multi-modal vision prompts and structured JSON city intelligence updates.
- **Linter & Compilers**: Oxc, Vite client compilers.

---

## 🚶‍♂️ Citizen Walkthrough (How to Report & Verify Issues)

If you are a citizen seeking to report a local civic hazard or verify an active incident:

### Step 1: Access the Landing Dashboard
- Navigate to the home page to view the three-step zero-friction intelligent pipeline.
- Click **"Go to AI Analyzer"** to report an issue.

### Step 2: Upload or Select an Incident Image
- **Option A (Custom Upload)**: Click on the image upload box, select a photo of a civic issue from your device, and wait for the preview card to load.
- **Option B (Interactive Demo)**: Click on one of the sample chips at the bottom of the card (e.g., *Road Pothole*, *Water Main Burst*, or *Sinkhole*). The pre-loaded static image is instantly fed to the sandbox.

### Step 3: Trigger AI Vision Analysis
- Click **"Run Intelligent Analysis"**.
- The spinner indicates Gemini Vision is extracting structural damage details.
- Once completed, look at the generated **AI Operations Dispatch Ticket**:
  - Review the extracted location, landmark description, severity badge, and risk scores.
  - Check the tactical short-term action plan compiled by the AI.

### Step 4: Publish to Community Feed
- Click **"Commit Report to Firestore Database"**.
- You will be redirected to the **Community Feed** page.

### Step 5: Verify Incidents in the Feed
- Browse the live community feed to inspect reports from other users.
- To verify a report, click the **"Upvote / Verify"** button on the card. This updates the report counter in real-time, incrementing the verification count and priority score in the Operations queue.
- Click **"View Details"** to navigate to the standalone routing page showing predictive forecasts, emergency responder briefs, and live action checklists.

### Step 6: Use the Interactive GIS Telemetry Map
- Click the **"Telemetry Map"** tab at the top of the Community Feed to switch from list view to full GIS mode.
- Click the floating **"Open Control Deck"** button on the top-right of the map to slide open controls.
- Check off category toggles (Roads, Utilities, Lighting, Sanitation, Safety) to filter pins shown on-screen.
- Enable **"Density Heatmap"** or **"Incident Clustering"** to visualize geographical incident hotspots and aggregations.
- Click on any marker node to inspect details inside the custom glassmorphic popup, and click **"Open Incident"** to view its details.
- To reset zoom bounds back to viewing all India incidents, click the **"Reset Viewport"** button.

---

## 🏢 Municipal Officer / Department Walkthrough

If you are a city administrator, dispatcher, or department lead:

### Step 1: Access the Operations Center
- Click **"Operations"** on the navigation bar to enter the Command Center.

### Step 2: Filter by Municipal Scope
- Locate the **"Operational Scope Area"** select dropdown in the sub-header.
- Choose a specific city (e.g., *New Delhi*, *Mumbai*) or keep it at *All Cities*. All graphs, live queues, metrics, and AI intelligence dashboards adapt instantly to display data only for the selected scope.

### Step 3: Review the AI City Intelligence Desk
- Look at the left column to read the **Executive Operations Brief** for the current city context.
- Check the **Identified Hazard Hotspots** showing exact locations where severe incidents are currently open.
- Inspect the **Department Workload Indicators** to see if any department (e.g., DPW, Sanitation) is currently overloaded.
- *Note the cache age badge*: It indicates whether the intelligence is cached (memory or Firestore) or if it was freshly generated.

### Step 4: Manage the Live Queue & Dispatch Teams
- Scroll down the **Live Incident Dispatch Queue** in the right column.
- Issues are ranked by priority score (upvotes + severity).
- Click on an incident card in the queue list. Its details open in the active panel below.
- Read the **Tactical Resolution Plans** (Immediate Action, Short-Term, Long-Term recommendations).
- To assign crew updates, click **"In Progress"** or **"Resolved"** under the *Update Operational Status* action buttons. The community feed and database update in real-time.

### Step 5: Consult the AI Operations Copilot
- Click the teal circular **"AI Copilot"** action button floating in the bottom-right corner of the viewport.
- The slide-over chat workspace expands smoothly from the right side of the screen.
- **Quick Queries**: Click any suggestion chip (e.g., *"Which department is overloaded?"* or *"What should I prioritize today?"*) to immediately query the AI.
- **Custom Input**: Type any civic-related query in the chat input (e.g., *"Show me all open critical issues in Mumbai"*).
- The Copilot answers based on the pre-generated briefs and active incident parameters, referencing locations (e.g., *"the pothole on Connaught Place"*) and utilizing case numbers (e.g., \`CP-098231\`) for clarity.
- To wipe history, click the **Trash** icon in the Copilot header.