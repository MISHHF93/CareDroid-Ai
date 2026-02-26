# Heart 3D Blueprint — Clinical Atlas Reconstruction

> **Purpose:** Definitive anatomical specification for the `HeartMesh` component in the CareDroid Clinical Library 3D Atlas.  
> All geometry, proportions, colours, and animations are derived from real cardiac anatomy and standard medical imaging conventions (AP view, slight left-anterior-oblique tilt).

---

## 1. Overall Shape & Orientation

| Property | Value |
|---|---|
| Shape | Blunted cone — base superior, apex inferior-left |
| Dimensions (adult) | ~12 cm long × 9 cm wide × 6 cm AP |
| Position in thorax | Mediastinum — 2/3 left of midline |
| Tilt | Long axis ~45° from horizontal (base↑right → apex↓left) |
| Rotation in scene | `rotation={[0.06, 0, 0.22]}` (slight rightward lean) |

### Bounding ellipsoid (scene units, 1 unit ≈ 8 cm)
```
LV body:  x=[-0.62, 0.62]  y=[-0.90, 0.72]  z=[-0.56, 0.56]
```

---

## 2. Chambers

### 2.1 Left Ventricle (LV)
- **Dominant chamber** — thick-walled (8–12 mm), elongated
- Occupies the inferior-left bulk of the heart
- Narrows to a pointed **apex** — the most inferior and leftmost point
- Geometry: elongated oblate sphere + conical apex extension
- Wall: dark carmine (`#b83232`) — thick, glossy surface
- **Scene position:** `[-0.12, -0.04, -0.02]`, scale `[1.0, 1.52, 0.96]`
- Apex cone: `[-0.28, -0.76, 0.02]`, rotation `[0.16, 0, -0.30]`

#### LV Internal Structures
| Structure | Description | Geometry Approach |
|---|---|---|
| Papillary muscle (anterior) | Thick column rising from LV floor toward mitral valve | Cylinder, angled anteriorly |
| Papillary muscle (posterior) | Thinner, posterior | Cylinder, angled posteriorly |
| Trabeculae carnae | Irregular muscular ridges on inner LV wall | 3–4 partial torus arcs |
| Chordae tendineae | Thin cords from papillary to leaflets | Not rendered (too fine) |

### 2.2 Right Ventricle (RV)
- **Crescent-shaped** when viewed in cross-section — wraps around the LV anteriorly
- Thinner wall (2–4 mm) — lower pressure
- Has a distinct **infundibulum (outflow tract)** — smooth funnel leading to pulmonary valve
- Geometry: scaled sphere (wide, shallow depth), plus separate infundibulum cylinder
- Color: lighter red (`#cc5050`) to distinguish from LV
- **Scene position:** `[0.30, 0.04, 0.18]`, scale `[0.72, 1.06, 0.56]`

### 2.3 Left Atrium (LA)
- **Most posterior** chamber — lies directly anterior to the oesophagus
- Receives 4 pulmonary veins (2 left, 2 right)
- Small auricular appendage (LAA) projects inferiorly-left — major site of thrombus in AF
- Geometry: compressed sphere, posterior-superior to LV
- **Scene position:** `[-0.18, 0.56, -0.20]`, scale `[0.88, 0.70, 1.04]`

### 2.4 Right Atrium (RA)
- Right-superior chamber
- Receives SVC (superiorly) and IVC (inferiorly)
- **Crista terminalis** — posterior muscular ridge (internal, not rendered)
- **RAA (right atrial appendage)** — triangular, right-superior
- Contains **SA node** at SVC–RA junction (not rendered)
- **Scene position:** `[0.44, 0.42, 0.00]`, scale `[0.82, 0.68, 0.76]`

### 2.5 Interventricular Septum
- Muscular wall separating LV and RV
- Bulges into RV side
- Rendered implicitly by the overlap between LV and RV spheres + a subtle dark separator plane

---

## 3. Cardiac Valves

All valves rendered as **torus rings** (annulus representation) with gold/ivory material (`#ffd580`, high emissive).

| Valve | Location | Ring radius | Position |
|---|---|---|---|
| **Mitral** (bicuspid) | LV inflow, LA→LV | r=0.18 | `[-0.12, 0.38, 0.04]` |
| **Aortic** | LV outflow, top of LV | r=0.105 | `[0.04, 0.58, -0.02]` |
| **Tricuspid** | RV inflow, RA→RV | r=0.20 | `[0.36, 0.36, 0.10]` |
| **Pulmonary** | RV outflow, infundibulum | r=0.095 | `[0.24, 0.60, 0.14]` |

### Fibrous Skeleton
The 4 valves are interconnected by the fibrous skeleton (central fibrous body).  
Approximate: a small dark-coloured ellipsoid at `[0.14, 0.46, 0.04]` scale `[0.32, 0.16, 0.24]`.

---

## 4. Great Vessels

### 4.1 Aorta

#### Aortic Root & Sinus of Valsalva
- Widest part (~3.2 cm diameter) — just above aortic valve
- 3 sinuses (Valsalva) give rise to coronary arteries
- Render as a short, slightly wider cylinder at the valve junction

#### Ascending Aorta
- Rises superiorly and to the right
- Diameter ~2.8–3.2 cm
- Height ~5 cm

#### Aortic Arch (key feature)
- Curves from right → left, arching over pulmonary bifurcation
- Gives rise to **3 branches** (left to right as you go from ascending):
  1. **Brachiocephalic trunk** (right): bifurcates → right common carotid + right subclavian
  2. **Left common carotid**
  3. **Left subclavian**
- Rendered as `TubeGeometry` following a `CatmullRomCurve3`
- Colour: deep arterial red (`#ef4444`), metallic surface

#### Descending Aorta (thoracic segment, stub only)
- Passes behind heart, descends posterior-left
- Short stub visible

**Full aortic curve control points:**
```js
[
  { x:  0.04, y:  0.56, z: -0.02 },  // aortic root (above valve)
  { x:  0.06, y:  0.80, z:  0.00 },  // ascending mid
  { x:  0.08, y:  1.02, z:  0.02 },  // ascending top
  { x:  0.20, y:  1.16, z:  0.02 },  // arch begins right
  { x:  0.36, y:  1.22, z:  0.01 },  // arch apex (highest point)
  { x:  0.52, y:  1.16, z: -0.02 },  // arch descends right
  { x:  0.58, y:  0.98, z: -0.06 },  // descending aorta start
  { x:  0.54, y:  0.74, z: -0.10 },  // descending stub
]
```
Tube radius: `0.092` | Segments: 28

#### Arch Branch Vessels
```
Brachiocephalic:  pos=[0.22, 1.14, 0.00]  rot=[0.12, 0, -0.54]  len=0.26
L carotid:        pos=[0.34, 1.20, 0.00]  rot=[0.06, 0, -0.18]  len=0.20
L subclavian:     pos=[0.44, 1.16, 0.00]  rot=[0.10, 0,  0.52]  len=0.18
```
All cylinders: `r=0.028–0.052`, colour slightly lighter than aorta.

### 4.2 Pulmonary Trunk
- Rises from RV infundibulum — anterior and slightly left
- Short (~5 cm) before bifurcating at the **carina level** into L + R pulmonary arteries  
- Colour: **blue (`#7bb8ff`)** — deoxygenated blood
- Tube radius: `0.075`

**Control points:**
```js
[
  { x:  0.26, y:  0.62, z:  0.14 },  // pulmonary valve
  { x:  0.22, y:  0.82, z:  0.16 },  // trunk mid
  { x:  0.12, y:  0.97, z:  0.18 },  // bifurcation point
]
```

#### Left Pulmonary Artery
- Shorter, passes left over left mainstem bronchus  
- Control: `[0.12, 0.97, 0.18] → [-0.04, 0.96, 0.18] → [-0.26, 0.93, 0.15]`  
- Tube radius: `0.052`

#### Right Pulmonary Artery
- Longer, passes right behind ascending aorta  
- Control: `[0.12, 0.97, 0.18] → [0.30, 0.94, 0.15] → [0.52, 0.91, 0.12]`  
- Tube radius: `0.054`

### 4.3 Superior Vena Cava (SVC)
- Vertical vessel entering RA from above
- Rendered as `TubeGeometry`
- Control: `[0.52, 0.62, 0.02] → [0.54, 0.90, 0.00] → [0.52, 1.16, -0.02]`
- Tube radius: `0.062`, colour: blue

### 4.4 Inferior Vena Cava (IVC)
- Enters RA from below — short stub visible
- Cylinder: position `[0.48, -0.44, 0.00]`, rotation `[0.06, 0, 0.06]`, r=`0.060`

### 4.5 Pulmonary Veins (4 total)
- Enter LA posteriorly — 2 left, 2 right
- All rendered as short cylinders entering the posterior LA wall
```
RSPV: [-0.34, 0.54, -0.34]
RIPV: [-0.10, 0.56, -0.38]
LSPV: [-0.30, 0.70, -0.34]
LIPV: [-0.08, 0.72, -0.40]
```
Cylinder: `r=0.032–0.040`, length `0.20`, angled toward LA

---

## 5. Coronary Arteries

> All rendered as `TubeGeometry` following `CatmullRomCurve3` paths.  
> Colour: **bright orange-gold (`#ffaa44`)** — clearly visible against dark red myocardium.

### 5.1 Left Main Coronary Artery (LMCA)
- Very short (< 1 cm), arises from left coronary sinus
- Immediately bifurcates into LAD + Circumflex
- Position: `[0.00, 0.50, 0.26]` — stub cylinder, length 0.10

### 5.2 Left Anterior Descending (LAD)
- **Longest, most important** — supplies anterior LV, septum, apex
- Descends in the **anterior interventricular groove**
- Gives off **diagonal branches** (D1, D2) and **septal perforators**

**Control points (LAD main):**
```js
[-0.04, 0.52, 0.28]   // LMCA bifurcation
[-0.06, 0.30, 0.32]   // proximal LAD
[-0.08, 0.04, 0.30]   // mid LAD
[-0.10, -0.22, 0.26]  // distal LAD
[-0.14, -0.50, 0.18]  // LAD wraps apex
[-0.20, -0.72, 0.08]  // apical LAD
[-0.28, -0.84,-0.04]  // apex (may wrap posteriorly)
```
Tube radius: `0.028` | Segments: 22

**Diagonal 1 (D1):**
```js
[-0.06, 0.18, 0.30] → [-0.20, 0.06, 0.26] → [-0.34, -0.06, 0.20]
```
Tube radius: `0.018`

**Diagonal 2 (D2):**
```js
[-0.08,-0.04, 0.28] → [-0.22,-0.16, 0.24] → [-0.36,-0.24, 0.18]
```
Tube radius: `0.014`

**Septal perforators (3, very thin):**
- Short stubs perpendicular to LAD, diving into septum
- Rendered as tiny cylinders radius `0.010`, length `0.08`

### 5.3 Left Circumflex (LCx)
- Passes in the **left atrioventricular groove** (between LA and LV)
- Supplies lateral and posterior LV wall
- Gives off **obtuse marginal (OM)** branches

**Control points (LCx):**
```js
[-0.04, 0.52, 0.20]   // LMCA bifurcation
[-0.16, 0.48, 0.10]   // passes into AV groove
[-0.30, 0.38,-0.04]   // lateral
[-0.42, 0.22,-0.16]   // posterior-lateral
[-0.44, 0.02,-0.22]   // posterior (distal LCx)
```
Tube radius: `0.024`

**Obtuse Marginal 1 (OM1):**
```js
[-0.22, 0.42, 0.06] → [-0.36, 0.30, 0.00] → [-0.46, 0.14,-0.08]
```
Tube radius: `0.016`

### 5.4 Right Coronary Artery (RCA)
- Arises from right coronary sinus
- Passes in **right atrioventricular groove**
- Supplies RV, inferior LV, SA node, AV node
- Terminates as **posterior descending artery (PDA)** in right-dominant hearts

**Control points (RCA):**
```js
[ 0.04, 0.52, 0.22]   // right coronary sinus
[ 0.28, 0.44, 0.16]   // proximal RCA (right AV groove)
[ 0.46, 0.28, 0.06]   // acute margin
[ 0.52, 0.04,-0.04]   // mid RCA (inferior)
[ 0.48,-0.22,-0.12]   // distal RCA
[ 0.36,-0.48,-0.14]   // crux / PDA origin
[ 0.18,-0.64,-0.08]   // posterior descending artery
```
Tube radius: `0.026` | Segments: 22

**RV marginal branch:**
```js
[0.46, 0.24, 0.08] → [0.52, 0.06, 0.14] → [0.50,-0.14, 0.18]
```
Tube radius: `0.016`

**SA nodal artery (from proximal RCA):**
```js
[0.22, 0.48, 0.14] → [0.30, 0.60, 0.06] → [0.38, 0.74,-0.02]
```
Tube radius: `0.010`

---

## 6. Pericardium

- Fibrous outer sac enclosing the heart + root of great vessels
- **Parietal pericardium** — outer stiff fibrous layer
- **Visceral pericardium (epicardium)** — inner layer fused to heart
- Pericardial space: ~50 mL fluid (not rendered, implied by translucent gap)

**Rendering:**
```
Outer sphere: scale=[1.22, 1.26, 1.16], r=0.74
Material: translucent (opacity=0.06), roughness=0.98, emissiveIntensity=0.04
```

---

## 7. Epicardial Fat & Surface Texture

- Epicardial adipose tissue collects in the AV and interventricular grooves
- Makes the grooves appear as pale yellow-white channels on the heart surface
- Render as subtle bright cylinders along groove paths (very low opacity)
- Colour: `#f5e6a3` (pale yellow), opacity `0.22`

The anterior interventricular groove (LAD territory) follows the LAD path.  
The AV grooves follow the RCA / LCx paths.

---

## 8. Animation

### 8.1 Heartbeat (Two-Phase)
```
bpHz = heartRate / 60
phase = (elapsed * bpHz) % 1

Systole (0%–35% of cycle):
  scale = 1 + sin((phase / 0.35) × π) × (0.07 + severity × 0.022)
Diastole (35%–100%):
  scale = 1 (relaxed)
```
- Group root rotation `[0.06, 0, 0.22]` maintained throughout

### 8.2 Severity Effect
| Severity | Heartbeat intensity | Colour shift |
|---|---|---|
| 0 (Normal) | ×1.0 — subtle | `#10b981` (green) |
| 1 (Mild) | ×1.2 | `#f59e0b` (amber) |
| 2 (Moderate) | ×1.4 | `#f97316` (orange) |
| 3 (Severe) | ×1.6 | `#ef4444` (red) |
| 4 (Critical) | ×1.8 — visible pulsing | `#dc2626` (dark red) |

The base myocardium colour shifts toward severity colour (blended).

---

## 9. Material Specifications

| Structure | Color | Emissive Intensity | Roughness | Metalness | Alpha |
|---|---|---|---|---|---|
| LV wall | `#b83232` | 0.62 | 0.44 | 0.12 | 1.0 |
| RV wall | `#cc5050` | 0.46 | 0.46 | 0.10 | 1.0 |
| Atria | `#cc4444` | 0.42 | 0.48 | 0.10 | 1.0 |
| LV free wall | `#aa2828` | 0.50 | 0.50 | 0.12 | 1.0 |
| Aorta / arteries | `#ef4444` | 0.72 | 0.20 | 0.48 | 1.0 |
| Pulmonary vessels | `#7bb8ff` | 0.62 | 0.26 | 0.38 | 1.0 |
| Coronary arteries | `#ffaa44` | 0.80 | 0.26 | 0.32 | 1.0 |
| Valve annuli | `#ffd580` | 0.75 | 0.28 | 0.22 | 1.0 |
| Fibrous skeleton | `#c8a060` | 0.40 | 0.55 | 0.18 | 1.0 |
| Pericardium | `#ef4444` | 0.04 | 0.98 | 0.00 | 0.06 |
| Epicardial fat groove | `#f5e6a3` | 0.15 | 0.90 | 0.00 | 0.22 |
| Papillary muscles | `#aa2828` | 0.52 | 0.55 | 0.12 | 1.0 |

---

## 10. Lighting Recommendations

```js
<ambientLight intensity={0.50} />
<pointLight position={[4.5, 4, 5]}     intensity={1.8}  color="#ff4444" />  // main warm red
<pointLight position={[-4, 2.5, -3.5]} intensity={1.2}  color="#00d4ff" />  // cool side fill
<pointLight position={[0, -4.5, 3.5]}  intensity={0.80} color="#818cf8" />  // bottom rim
<pointLight position={[0, 0, 6]}       intensity={0.45} color="#ffffff" />  // front specular
```

---

## 11. Geometry Component List (Complete)

```
HeartMesh
├── Pericardium shell (sphere, translucent)
├── LV body (sphere)
├── LV apex (cone)
├── LV free wall thickening (sphere)
├── LV papillary muscle anterior (cylinder)
├── LV papillary muscle posterior (cylinder)
├── LV trabeculae carnae × 3 (torus arc)
├── RV body (sphere)
├── RV infundibulum (cylinder)
├── LA body (sphere)
├── LA appendage (sphere)
├── RA body (sphere)
├── RA appendage (sphere)
├── Mitral valve annulus (torus)
├── Aortic valve annulus (torus)
├── Tricuspid valve annulus (torus)
├── Pulmonary valve annulus (torus)
├── Fibrous skeleton (sphere)
├── Aortic root sinus (cylinder, wide)
├── Aorta full arch (TubeGeometry)
├── Brachiocephalic trunk (cylinder)
├── L common carotid (cylinder)
├── L subclavian (cylinder)
├── Pulmonary trunk (TubeGeometry)
├── L pulmonary artery (TubeGeometry)
├── R pulmonary artery (TubeGeometry)
├── SVC (TubeGeometry)
├── IVC stub (cylinder)
├── Pulmonary vein × 4 (cylinders)
├── LMCA stub (cylinder)
├── LAD main (TubeGeometry)
├── LAD diagonal 1 (TubeGeometry)
├── LAD diagonal 2 (TubeGeometry)
├── LAD septal perforators × 3 (cylinders)
├── LCx main (TubeGeometry)
├── LCx obtuse marginal 1 (TubeGeometry)
├── RCA main (TubeGeometry)
├── RCA RV marginal (TubeGeometry)
├── RCA SA nodal artery (TubeGeometry)
└── Epicardial fat grooves × 2 (path-following mesh, low opacity)
```

---

## 12. Camera & Scene Settings for Heart View

```js
camera={{ position: [0, 0, 5.2], fov: 46, near: 0.1, far: 65 }}
```

OrbitControls:
```js
minDistance={2.5}
maxDistance={11}
autoRotateSpeed={0.55}
```

---

## 13. Sources & References

- Gray's Anatomy, 41st edition — Cardiac anatomy
- ACC/AHA Coronary Artery Anatomy Nomenclature (2014)
- McMinn's Color Atlas of Human Anatomy
- CCTA segmentation conventions (Leipsic et al., JACC 2014)
- Standard echocardiographic views (ASE guidelines)
