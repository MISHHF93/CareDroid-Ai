# Dashboard Design Plan
**CareDroid Clinical AI Platform**

## 🎯 Overview
This document outlines the design and implementation plan for the main Dashboard page accessible from the sidebar navigation. The dashboard will serve as the central hub for clinicians, providing at-a-glance insights, quick access to tools, and actionable clinical information.

---

## 📋 Current State Analysis

### Existing Components
- **Dashboard.jsx** - Currently a chat interface (AI conversation)
- **ClinicalDashboard.jsx** - Patient cards demonstration page
- **Sidebar** - Navigation with 6 clinical tools + dashboard link
- **Tool Registry** - 6 clinical tools (Drug Checker, Lab Interpreter, Calculators, Protocols, Diagnosis, Procedures)
- **Design System** - Enhanced clinical design tokens, atomic components (Button, Input, Badge, Card, PatientCard)

### Navigation Structure
```
Sidebar Nav Items:
- 💬 Dashboard → /dashboard (currently chat interface)
- 👤 Profile → /profile
- 👥 Team → /team
- 📜 Audit Logs → /audit-logs
- 📊 Analytics → /analytics
- ⚙️ Settings → /settings
```

---

## 🎨 Dashboard Design Vision

### Purpose
The Dashboard should be a **clinical command center** that provides:
1. **Real-time patient status overview**
2. **Quick access to clinical tools**
3. **Recent activity and notifications**
4. **Actionable insights and alerts**
5. **Personalized clinical workflow**

### Design Principles
- **Clinical-First**: Prioritize clinical decision-making and patient safety
- **Information Density**: Balance data density with readability
- **Actionable**: Every element should lead to an action
- **Responsive**: Adapt to different viewport sizes
- **Performance**: Fast loading with progressive enhancement

---

## 🏗️ Dashboard Layout Architecture

### Grid Structure
```
┌─────────────────────────────────────────────────────────┐
│ Header: Welcome + Quick Actions + Notifications        │
├─────────────────┬───────────────────────────────────────┤
│                 │                                       │
│  Sidebar        │  Main Content Area                   │
│  (Existing)     │                                       │
│                 │  ┌─────────────────────────────┐     │
│  - Dashboard    │  │ Stats Cards Row             │     │
│  - Profile      │  │ (Critical, Active, Stable)  │     │
│  - Team         │  └─────────────────────────────┘     │
│  - Tools        │                                       │
│                 │  ┌─────────────────────────────┐     │
│                 │  │ Quick Access Tools Grid     │     │
│                 │  │ (6 Clinical Tools)          │     │
│                 │  └─────────────────────────────┘     │
│                 │                                       │
│                 │  ┌──────────┬──────────────────┐     │
│                 │  │ Recent   │ Active Alerts    │     │
│                 │  │ Activity │                  │     │
│                 │  └──────────┴──────────────────┘     │
│                 │                                       │
│                 │  ┌─────────────────────────────┐     │
│                 │  │ Patient List / Critical     │     │
│                 │  │ Patients (PatientCard)      │     │
│                 │  └─────────────────────────────┘     │
└─────────────────┴───────────────────────────────────────┘
```

---

## 📦 Dashboard Components Breakdown

### 1. Header Section
**Purpose**: Welcome message, quick actions, system status

**Elements**:
- Greeting with clinician name and time-based message
- Quick action buttons (New Patient, Emergency Protocol, Search)
- Notification bell with unread count
- System health indicator
- Current date/time display

**Design**:
```jsx
<DashboardHeader>
  <Greeting>Good morning, Dr. Smith</Greeting>
  <QuickActions>
    <Button icon="+" variant="primary">New Patient</Button>
    <Button icon="🚨" variant="danger">Emergency</Button>
    <Button icon="🔍" variant="ghost">Search</Button>
  </QuickActions>
  <NotificationBell count={3} />
  <SystemStatus status="online" />
</DashboardHeader>
```

### 2. Stats Cards Row
**Purpose**: High-level overview of patient census and status

**Metrics**:
- Total Active Patients
- Critical Patients (with trend indicator)
- Stable Patients
- Pending Actions (labs, orders, consults)

**Design Pattern**:
```jsx
<StatsRow>
  <StatCard
    label="Critical Patients"
    value={5}
    trend="+2"
    trendDirection="up"
    color="critical"
    icon="🚨"
  />
  <StatCard
    label="Active Patients"
    value={24}
    trend="-1"
    trendDirection="down"
    color="info"
    icon="👥"
  />
  <StatCard
    label="Pending Labs"
    value={12}
    color="warning"
    icon="🧪"
  />
</StatsRow>
```

### 3. Quick Access Tools Grid
**Purpose**: Fast navigation to all 6 clinical tools

**Features**:
- 6 tool cards (from toolRegistry)
- Each card shows: icon, name, description, shortcut key
- Visual indicator for recently used
- Favorites system integration
- Hover effects with tool preview

**Design Pattern**:
```jsx
<ToolsGrid>
  {toolRegistry.map(tool => (
    <ToolCard
      key={tool.id}
      icon={tool.icon}
      name={tool.name}
      description={tool.description}
      color={tool.color}
      shortcut={tool.shortcut}
      onClick={() => navigate(tool.path)}
      isFavorite={favorites.includes(tool.id)}
      recentlyUsed={recentTools.includes(tool.id)}
    />
  ))}
</ToolsGrid>
```

### 4. Activity Feed + Alerts Panel
**Purpose**: Real-time updates and actionable alerts

**Activity Feed**:
- Recent patient admissions
- Lab results ready for review
- Procedure completions
- Medication orders placed
- Timestamps with relative time (e.g., "2 min ago")

**Alerts Panel**:
- Critical alerts (red)
- High priority (orange)
- Medium priority (yellow)
- Each alert is clickable and leads to action

**Design Pattern**:
```jsx
<TwoColumnSection>
  <ActivityFeed>
    <ActivityItem
      icon="🧪"
      title="Lab results ready"
      patient="Sarah Johnson"
      time="2 min ago"
      onClick={handleNavigateToLab}
    />
  </ActivityFeed>
  
  <AlertsPanel>
    <Alert
      severity="critical"
      message="BP dropping - Room 312A"
      patient="Sarah Johnson"
      time="Just now"
      onAcknowledge={handleAcknowledge}
    />
  </AlertsPanel>
</TwoColumnSection>
```

### 5. Critical Patients Section
**Purpose**: Detailed view of patients requiring immediate attention

**Features**:
- Uses existing PatientCard component
- Filters for critical and moderate status
- Expandable for full vitals
- Quick action buttons (View Details, Update Vitals, Add Note)
- Real-time vital signs

**Design Pattern**:
```jsx
<CriticalPatientsSection>
  <SectionHeader>
    <Title>Critical Patients</Title>
    <Badge variant="critical" count={criticalCount} />
  </SectionHeader>
  
  {criticalPatients.map(patient => (
    <PatientCard
      key={patient.id}
      patient={patient}
      onViewDetails={handleViewDetails}
      onUpdateVitals={handleUpdateVitals}
      onAddNote={handleAddNote}
      compact={false}
    />
  ))}
</CriticalPatientsSection>
```

---

## 🎨 Visual Design Specifications

### Color Coding
- **Critical**: `var(--critical)` #EF4444
- **High Priority**: `var(--warning)` #F59E0B
- **Medium**: `var(--info)` #10B981
- **Stable**: `var(--success)` #00FF88
- **Info**: `var(--accent)` #63B3ED

### Typography
- **Page Title**: 32px, Bold, `var(--text-primary)`
- **Section Headers**: 20px, Semibold, `var(--text-primary)`
- **Card Titles**: 16px, Semibold, `var(--text-primary)`
- **Body Text**: 14px, Regular, `var(--text-secondary)`
- **Metadata**: 12px, Medium, `var(--text-tertiary)`

### Spacing
- **Page Padding**: `var(--space-6)` (24px)
- **Section Gap**: `var(--space-6)` (24px)
- **Card Gap**: `var(--space-4)` (16px)
- **Inner Padding**: `var(--space-4)` (16px)

### Shadows & Elevation
- **Cards**: `var(--shadow-sm)` for base state
- **Hover**: `var(--shadow-md)` with transition
- **Modals**: `var(--shadow-lg)`

---

## 🔧 Technical Implementation Plan

### Phase 1: Core Structure (High Priority)
1. **Create Dashboard Layout Component**
   - Set up grid structure
   - Implement responsive breakpoints
   - Add loading states

2. **Stats Cards Implementation**
   - Create StatCard component
   - Implement data aggregation logic
   - Add trend indicators with animations

3. **Quick Access Tools Grid**
   - Map toolRegistry to tool cards
   - Integrate keyboard shortcuts
   - Add favorites toggle
   - Implement tool access tracking

### Phase 2: Data Integration (Medium Priority)
4. **Activity Feed**
   - Create ActivityItem component
   - Set up real-time data feed (WebSocket/polling)
   - Implement timestamp formatting
   - Add filtering and search

5. **Alerts Panel**
   - Create Alert component with severity levels
   - Implement alert acknowledgment system
   - Add audio/visual notifications
   - Integrate with notification context

### Phase 3: Patient Data (Medium Priority)
6. **Critical Patients Section**
   - Integrate existing PatientCard component
   - Implement patient filtering logic
   - Add expand/collapse functionality
   - Connect to patient data API

### Phase 4: Polish & Enhancement (Low Priority)
7. **Header Enhancements**
   - Add search functionality
   - Implement notification dropdown
   - Add quick actions modal

8. **Animations & Transitions**
   - Card hover effects
   - Loading skeletons
   - Alert fade-in/out
   - Smooth transitions

9. **Performance Optimization**
   - Implement virtualization for long lists
   - Add lazy loading for patient cards
   - Optimize re-renders with useMemo/useCallback

---

## 📊 Data Requirements

### API Endpoints Needed
```javascript
// Patient data
GET /api/patients/critical
GET /api/patients/active
GET /api/patients/stats

// Activity feed
GET /api/activity/recent?limit=10
WS  /api/activity/stream (WebSocket)

// Alerts
GET /api/alerts/active
POST /api/alerts/:id/acknowledge

// Tool access tracking
POST /api/tools/:id/access
GET /api/tools/recent

// Notifications
GET /api/notifications/unread
POST /api/notifications/:id/read
```

### State Management
```javascript
// Dashboard state context or hook
const useDashboard = () => {
  const [stats, setStats] = useState(null);
  const [criticalPatients, setCriticalPatients] = useState([]);
  const [activities, setActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Data fetching logic
  // Real-time updates
  // Error handling
  
  return { stats, criticalPatients, activities, alerts, loading };
};
```

---

## 🚀 Implementation Checklist

### Phase 1: Foundation
- [ ] Create `/src/pages/Dashboard.jsx` (replace current chat interface)
- [ ] Create `/src/components/dashboard/` directory
- [ ] Build `DashboardHeader.jsx` component
- [ ] Build `StatCard.jsx` component
- [ ] Build `ToolCard.jsx` component for quick access grid
- [ ] Implement responsive grid layout
- [ ] Add loading states and skeletons

### Phase 2: Components
- [ ] Create `ActivityFeed.jsx` component
- [ ] Create `ActivityItem.jsx` component
- [ ] Create `AlertsPanel.jsx` component
- [ ] Create `Alert.jsx` component
- [ ] Integrate PatientCard for critical patients section
- [ ] Add empty states for all sections

### Phase 3: Data & Logic
- [ ] Create `useDashboard` custom hook
- [ ] Implement data fetching logic
- [ ] Set up real-time updates (WebSocket or polling)
- [ ] Add error handling and retry logic
- [ ] Integrate with existing contexts (User, Notifications, ToolPreferences)
- [ ] Add keyboard shortcuts for tool access

### Phase 4: Polish
- [ ] Add animations and transitions
- [ ] Implement search functionality in header
- [ ] Add notification dropdown
- [ ] Performance optimization
- [ ] Accessibility audit (ARIA labels, keyboard navigation)
- [ ] Mobile responsiveness testing
- [ ] Dark mode compatibility check

### Phase 5: Testing
- [ ] Unit tests for components
- [ ] Integration tests for data flow
- [ ] E2E tests for critical paths
- [ ] Performance testing
- [ ] Cross-browser testing

---

## 🎯 Success Metrics

### User Experience
- Dashboard loads in < 1 second
- All interactions respond in < 100ms
- No layout shift during loading
- Smooth 60fps animations

### Clinical Utility
- Quick access to all 6 tools with 1-2 clicks
- Critical patient information visible without scrolling
- Alerts are immediately visible and actionable
- Recent activity provides context for decision-making

### Technical Performance
- Lighthouse score > 90
- No console errors or warnings
- Accessible (WCAG 2.1 AA compliance)
- Works on Chrome, Firefox, Safari, Edge

---

## 📝 Future Enhancements (Post-MVP)

1. **Customizable Dashboard**
   - Drag-and-drop widget arrangement
   - Show/hide sections
   - Personalized tool shortcuts

2. **Advanced Filtering**
   - Filter patients by specialty
   - Filter alerts by severity
   - Time-based activity filtering

3. **Data Visualization**
   - Census trends chart
   - Vital signs sparklines
   - Alert frequency heatmap

4. **Collaboration Features**
   - Team member status (online/offline)
   - Shared patient lists
   - Handoff checklist

5. **Mobile App**
   - Native iOS/Android apps
   - Push notifications
   - Offline mode

---

## 🤝 Team Collaboration

### Design Review
- [ ] Review with UX designer
- [ ] Get clinician feedback on layout
- [ ] Validate color coding with accessibility team

### Development
- [ ] Create feature branch: `feature/dashboard-redesign`
- [ ] Set up PR template with checklist
- [ ] Schedule code review sessions

### Deployment
- [ ] Deploy to staging environment
- [ ] Run E2E tests
- [ ] Conduct UAT with clinical staff
- [ ] Gradual rollout with feature flag

---

## Notes
- This dashboard will replace the current chat interface at `/dashboard`
- The existing ClinicalDashboard.jsx can be renamed or repurposed as a patient list page
- The chat functionality can be moved to a dedicated `/chat` or `/assistant` route
- All existing design tokens and components should be reused for consistency
