# 3D Holographic Visualization System

CareDroid AI's **3D Holographic Clinical Interface** transforms the existing 2D clinical dashboard into an immersive medical visualization experience using Three.js via `@react-three/fiber` and `@react-three/drei`.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [File Structure](#2-file-structure)
3. [Getting Started](#3-getting-started)
4. [Components](#4-components)
   - [HolographicCanvas](#holographiccanvas)
   - [HolographicLoader](#holographicloader)
   - [FloatingCard](#floatingcard)
   - [GestureControls](#gesturecontrols)
   - [ARStyleMarkers](#arStylemarkers)
   - [HolographicText](#holographictext)
5. [Medical Models](#5-medical-models)
   - [HeartModel](#heartmodel)
   - [BrainModel](#brainmodel)
   - [LungsModel](#lungsmodel)
   - [OrganSystem](#organsystem)
   - [MolecularStructure](#molecularstructure)
6. [Chart Components](#6-chart-components)
   - [VolumetricBarChart](#volumetricbarchart)
   - [Timeline3D](#timeline3d)
   - [NetworkGraph3D](#networkgraph3d)
7. [Hooks](#7-hooks)
   - [useWebGLSupport](#usewebglsupport)
   - [use3DModel](#use3dmodel)
8. [Page Integrations](#8-page-integrations)
9. [Shaders](#9-shaders)
10. [Backend Integration](#10-backend-integration)
11. [Performance](#11-performance)
12. [Accessibility](#12-accessibility)
13. [Mobile / Android](#13-mobile--android)

---

## 1. Architecture Overview

```
Browser
  └── React page (e.g. Chat.jsx)
        └── HolographicCanvas   ← Three.js canvas wrapper
              ├── Lighting rig (ambient + directional + point)
              ├── OrbitControls (keyboard + touch)
              └── <Suspense> ← lazy-loaded 3D scene content
                    ├── Medical models (Heart, Brain, Lungs, …)
                    ├── Charts (VolumetricBarChart, Timeline3D, …)
                    └── UI elements (ARStyleMarkers, HolographicText, …)
```

All heavy 3D components are **lazy-loaded** via `React.lazy` + `Suspense` so they are code-split and do not increase the initial bundle size.

WebGL support is detected at runtime; if WebGL is unavailable the canvas is replaced by an accessible fallback message.

---

## 2. File Structure

```
src/
├── components/
│   └── 3d/
│       ├── HolographicCanvas.jsx     ← Root canvas wrapper
│       ├── FloatingCard.jsx          ← Glassmorphism panel (no canvas)
│       ├── HolographicLoader.jsx     ← CSS/SVG loading spinner
│       ├── GestureControls.jsx       ← OrbitControls wrapper
│       ├── ARStyleMarkers.jsx        ← Pulsing 3D alert indicators
│       ├── HolographicText.jsx       ← 3D text labels
│       ├── medical/
│       │   ├── HeartModel.jsx
│       │   ├── BrainModel.jsx
│       │   ├── LungsModel.jsx
│       │   ├── OrganSystem.jsx       ← Full organ system (SOFA colours)
│       │   └── MolecularStructure.jsx
│       ├── charts/
│       │   ├── VolumetricBarChart.jsx
│       │   ├── Timeline3D.jsx
│       │   └── NetworkGraph3D.jsx
│       ├── shaders/
│       │   ├── holographic.vert      ← Vertex shader
│       │   ├── holographic.frag      ← Fragment shader
│       │   └── glassmorphism.frag    ← Panel shader
│       └── utils/
│           ├── webglDetect.js        ← WebGL feature detection
│           ├── performanceMonitor.js ← FPS / quality monitoring
│           └── modelLoader.js        ← GLTF cache helpers
├── hooks/
│   ├── useWebGLSupport.js            ← Reactive WebGL detection hook
│   └── use3DModel.js                 ← Model loading state hook
└── assets/
    └── models/
        └── .gitkeep                  ← Placeholder for .glb assets
```

---

## 3. Getting Started

### Install dependencies

```bash
npm install three @react-three/fiber @react-three/drei --legacy-peer-deps
```

### Basic usage

```jsx
import { Suspense, lazy } from 'react';
import HolographicLoader from '../components/3d/HolographicLoader';

const HolographicCanvas = lazy(() => import('../components/3d/HolographicCanvas'));
const HeartModel = lazy(() => import('../components/3d/medical/HeartModel'));

export function MyPage() {
  return (
    <div style={{ height: 300 }}>
      <Suspense fallback={<HolographicLoader />}>
        <HolographicCanvas cameraPosition={[0, 0, 3]}>
          <Suspense fallback={null}>
            <HeartModel interactive rotateOnHover />
          </Suspense>
        </HolographicCanvas>
      </Suspense>
    </div>
  );
}
```

---

## 4. Components

### HolographicCanvas

Root Three.js canvas. Handles camera, lighting, orbit controls, WebGL fallback, adaptive DPR, and reduced-motion support.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | — | 3D scene content |
| `fov` | number | 60 | Camera field of view |
| `cameraPosition` | [x,y,z] | [0,0,5] | Initial camera position |
| `controls` | boolean | true | Enable orbit controls |
| `shadows` | boolean | false | Enable shadow maps (high-tier only) |

### HolographicLoader

SVG/CSS spinner for Suspense fallback. Safe to use outside a Canvas.

| Prop | Type | Default |
|------|------|---------|
| `label` | string | 'Loading 3D visualization…' |
| `size` | number | 56 |

### FloatingCard

Glassmorphism depth panel (pure HTML/CSS, no canvas required).

| Prop | Type | Default |
|------|------|---------|
| `elevation` | 1–3 | 1 |
| `title` | string | — |

### GestureControls

Orbit, zoom, and pan controls for use **inside** a Canvas context.

### ARStyleMarkers

Renders pulsing 3D alert rings at specified world-space positions **inside** a Canvas.

```jsx
<ARStyleMarkers
  markers={[
    { id: 1, position: [0, 0, 0], severity: 'critical', label: '⚠ ALERT' },
  ]}
/>
```

### HolographicText

3D text labels rendered inside a Canvas using drei's `<Text>`.

---

## 5. Medical Models

All models render as **procedural geometry** when GLTF assets are unavailable. Place `.glb` files in `src/assets/models/` and update `modelLoader.js` to enable GLTF loading.

### HeartModel

Heartbeat-pulse animation. Props: `interactive`, `rotateOnHover`, `showLabel`, `color`, `position`.

### BrainModel

Two-hemisphere model with brain stem. Props: same as HeartModel.

### LungsModel

Breathing animation (lobes scale with sine wave). Props: same as HeartModel.

### OrganSystem

Stacks Brain → Lungs → Heart vertically, colour-coded by SOFA sub-scores:

```jsx
<OrganSystem scores={{ heart: 2, brain: 0, lungs: 3 }} interactive />
```

Colour scale: `0` = green, `1` = amber, `2` = orange, `≥3` = red.

### MolecularStructure

Atom (sphere) + bond (cylinder) graph. Accepts `atoms` and `bonds` arrays or renders a default caffeine-like molecule.

---

## 6. Chart Components

### VolumetricBarChart

Animated 3D bar chart with per-bar colour and value labels.

```jsx
<VolumetricBarChart
  data={[
    { label: 'WBC',  value: 11.2, color: '#f59e0b' },
    { label: 'HGB',  value: 13.5, color: '#10b981' },
    { label: 'PLT',  value: 150,  color: '#00e5ff' },
  ]}
  title="CBC Results"
/>
```

### Timeline3D

Horizontal event timeline with octahedral event nodes.

```jsx
<Timeline3D
  events={[
    { id: 1, label: 'Admission', date: '09:00', type: 'note' },
    { id: 2, label: 'WBC 11.2',  date: '10:30', type: 'lab' },
    { id: 3, label: 'Vanc 1g',   date: '11:00', type: 'medication' },
  ]}
  title="Patient Timeline"
/>
```

Event types: `lab`, `medication`, `vital`, `alert`, `note`.

### NetworkGraph3D

Force-directed 3D graph for drug interactions.

```jsx
<NetworkGraph3D
  nodes={[
    { id: 0, label: 'Warfarin' },
    { id: 1, label: 'Aspirin' },
  ]}
  edges={[[0, 1, { severity: 'major' }]]}
  title="Drug Interactions"
/>
```

---

## 7. Hooks

### useWebGLSupport

```js
const { supported, tier, mobile, reducedMotion } = useWebGLSupport();
```

| Field | Type | Description |
|-------|------|-------------|
| `supported` | boolean | WebGL is available |
| `tier` | `'high'|'medium'|'low'|'none'` | Rendering quality |
| `mobile` | boolean | Mobile device detected |
| `reducedMotion` | boolean | `prefers-reduced-motion` active |

### use3DModel

```js
const { loading, error, loaded, onModelLoaded, onModelError } = use3DModel(modelUrl);
```

Manages loading state and caches models by URL.

---

## 8. Page Integrations

| Page | 3D Feature |
|------|-----------|
| `Chat.jsx` | Anatomy viewer (Heart/Brain/Lungs) when keywords detected in AI response |
| `DrugChecker.jsx` | NetworkGraph3D drug interaction network |
| `Calculators.jsx` | OrganSystem SOFA score visualization |
| `Dashboard.jsx` | Timeline3D patient lab timeline |
| `LabInterpreter.jsx` | VolumetricBarChart lab values |
| `EmergencyModal.jsx` | ARStyleMarkers pulsing critical alert overlay |

All integrations include a **2D/3D toggle** button and gracefully degrade if WebGL is unavailable.

---

## 9. Shaders

Custom GLSL shaders in `src/components/3d/shaders/`:

| File | Purpose |
|------|---------|
| `holographic.vert` | Vertex displacement for scanline shimmer |
| `holographic.frag` | Fresnel rim glow + scanlines + colour gradient |
| `glassmorphism.frag` | Frosted-glass panel with border highlight |

Use with Three.js `ShaderMaterial`:

```js
import vertSrc from '../components/3d/shaders/holographic.vert?raw';
import fragSrc from '../components/3d/shaders/holographic.frag?raw';

const mat = new THREE.ShaderMaterial({
  vertexShader: vertSrc,
  fragmentShader: fragSrc,
  uniforms: {
    uTime:     { value: 0 },
    uColor:    { value: new THREE.Color('#00e5ff') },
    uColorAlt: { value: new THREE.Color('#a855f7') },
    uOpacity:  { value: 0.8 },
    uIntensity: { value: 1.0 },
  },
  transparent: true,
});
```

---

## 10. Backend Integration

The `/api/chat/message-3d` endpoint returns a `visualizations` array of type `Visualization3DMetadata[]`:

```ts
interface Visualization3DMetadata {
  type: 'organ-model' | 'molecular-structure' | 'drug-network' | 'lab-chart' | 'timeline' | 'protocol';
  modelUrl?: string;            // Optional GLTF/GLB URL
  cameraPosition?: { x, y, z }; // Suggested camera position
  animations?: { name, duration, loop }[];
  data?: Record<string, unknown>;
  label?: string;
}
```

The controller automatically injects organ-model hints when the message contains anatomical keywords (`heart`, `brain`, `lung`, etc.) and drug-network hints when medications are present in context.

The standard `/api/chat/message` endpoint also returns `visualizations: []` for forward compatibility.

---

## 11. Performance

| Technique | Implementation |
|-----------|---------------|
| Code splitting | `React.lazy` + `Suspense` for all 3D components |
| Adaptive DPR | `AdaptiveDpr` — reduces pixel ratio when FPS drops |
| Adaptive events | `AdaptiveEvents` — debounces pointer events |
| Frame loop | `frameloop='demand'` when `prefers-reduced-motion` |
| Tier-based quality | `getRenderingTier()` → `'high'|'medium'|'low'` |
| Mobile polygon budget | `getPolygonBudget(tier)` — 10k/30k/100k triangles |
| FPS monitor | `createPerformanceMonitor` — auto-downgrades quality |

---

## 12. Accessibility

- **WebGL fallback**: descriptive text shown when WebGL is unavailable
- **ARIA labels**: all canvases have `aria-label` describing the 3D content
- **Keyboard controls**: arrow keys (pan/rotate), +/- (zoom) via OrbitControls
- **2D/3D toggle**: all pages with 3D content include a toggle button (`aria-pressed`)
- **`prefers-reduced-motion`**: animations pause (`frameloop='demand'`); rotation disabled
- **Screen reader descriptions**: `role="img"` + `aria-label` on all 3D panels

---

## 13. Mobile / Android

- Touch gesture: one-finger rotate, two-finger pan/zoom (via OrbitControls `touches`)
- Pinch-to-zoom: enabled via `TOUCH.DOLLY_PAN`
- Simplified geometry: `getRenderingTier()` returns `'low'` on mobile devices
- DPR cap: `dpr={[1, 1.5]}` on mobile vs `[1, 2]` on desktop
- WebGL power preference: `powerPreference: 'high-performance'` for mobile GPU scheduling

Place optimised low-poly `.glb` models in `src/assets/models/` for production use. Recommended tools: Blender + `gltf-pipeline` for compression.
