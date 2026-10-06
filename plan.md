# 🌌 Solar System Portfolio - Comprehensive Development Plan

## Project Overview

An interactive 3D/2D solar system portfolio built with Next.js, Three.js (via React Three Fiber), and Framer Motion. The central star represents your personal profile, planets represent projects, and moons/satellites represent technologies used in each project.

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **3D Engine:** React Three Fiber + Three.js + @react-three/drei
- **Animation:** Framer Motion + GSAP
- **Styling:** Tailwind CSS + CSS Modules for complex animations
- **State Management:** Zustand
- **UI Components:** Radix UI (for accessible modals, tooltips, popovers)
- **Particles/Stars:** @react-three/postprocessing + custom shaders
- **Sound (optional):** Howler.js for ambient space sounds
- **Deployment:** Vercel
- **Testing:** Playwright (E2E) + Jest (Unit)
- **Screenshot Testing:** Playwright screenshots for visual regression

### Reference Inspirations
- 2D orbital mechanics from [twinji/explorer](https://github.com/twinji/explorer) - clean orbital path rendering
- 3D orrery from [chipi/orrery](https://github.com/chipi/orrery) - realistic 3D planet positioning
- [Neal.fun's solar system](https://neal.fun/) - playful interaction patterns
- [Stripe's website](https://stripe.com) - polished glassmorphism and glow effects
- [Bruno Simon's portfolio](https://bruno-simon.com/) - 3D portfolio interaction paradigm

---

## Phase 0: Project Scaffolding & Configuration

### Objective
Set up the Next.js project with all dependencies, folder structure, configuration files, linting, and base styling. This phase produces a running blank app with the complete development environment ready.

### Steps

1. **Initialize Next.js project**
   ```bash
   npx create-next-app@latest solar-portfolio --typescript --tailwind --eslint --app --src-dir
   ```

2. **Install core dependencies**
   ```bash
   # 3D Engine
   npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
   npm install @types/three --save-dev

   # Animation
   npm install framer-motion gsap

   # State Management
   npm install zustand

   # UI & Accessibility
   npm install @radix-ui/react-dialog @radix-ui/react-tooltip @radix-ui/react-popover
   npm install @radix-ui/react-navigation-menu @radix-ui/react-switch

   # Utilities
   npm install clsx tailwind-merge class-variance-authority
   npm install leva # for debug controls during development

   # Sound (optional)
   npm install howler @types/howler

   # Testing
   npm install -D playwright @playwright/test jest @testing-library/react @testing-library/jest-dom
   ```

3. **Create folder structure**
   ```
   src/
   ├── app/
   │   ├── layout.tsx
   │   ├── page.tsx
   │   ├── globals.css
   │   └── fonts/
   │       └── (Space Grotesk / Inter font files)
   ├── components/
   │   ├── canvas/            # All Three.js/R3F components
   │   │   ├── Scene.tsx
   │   │   ├── Star.tsx
   │   │   ├── Planet.tsx
   │   │   ├── Satellite.tsx
   │   │   ├── OrbitRing.tsx
   │   │   ├── Starfield.tsx
   │   │   ├── CameraController.tsx
   │   │   └── PostProcessing.tsx
   │   ├── ui/                # 2D overlay UI components
   │   │   ├── HUD.tsx
   │   │   ├── ProjectPanel.tsx
   │   │   ├── ProfileCard.tsx
   │   │   ├── Navigation.tsx
   │   │   ├── MobileView.tsx
   │   │   ├── LoadingScreen.tsx
   │   │   ├── SettingsToggle.tsx
   │   │   └── AccessibilityBar.tsx
   │   └── shared/            # Shared/reusable components
   │       ├── Button.tsx
   │       ├── Badge.tsx
   │       ├── GlowText.tsx
   │       └── AnimatedContainer.tsx
   ├── data/
   │   ├── profile.ts          # Personal profile data
   │   ├── projects.ts         # Projects array (planets)
   │   ├── technologies.ts     # Technology definitions (satellites)
   │   └── navigation.ts       # Navigation links
   ├── stores/
   │   ├── usePortfolioStore.ts # Main Zustand store
   │   └── useSettingsStore.ts  # Settings (reduced motion, sound, etc.)
   ├── hooks/
   │   ├── useOrbitalMotion.ts
   │   ├── useResponsive.ts
   │   ├── useReducedMotion.ts
   │   └── useKeyboardNav.ts
   ├── lib/
   │   ├── utils.ts
   │   ├── constants.ts        # Orbital math constants, colors, sizes
   │   └── shaders/            # Custom GLSL shaders
   │       ├── starGlow.frag
   │       ├── starGlow.vert
   │       ├── atmosphere.frag
   │       └── atmosphere.vert
   ├── styles/
   │   └── animations.css      # Complex keyframe animations
   └── types/
       └── index.ts            # TypeScript interfaces & types
   ```

4. **Configure Tailwind CSS** with custom theme extending space-themed colors:
   ```js
   // tailwind.config.ts - extend with:
   // colors: cosmic-black, nebula-purple, star-gold, planet-blue, orbit-gray
   // fontFamily: 'Space Grotesk', 'Inter'
   // animation: float, pulse-glow, orbit-spin
   ```

5. **Configure TypeScript types** in `src/types/index.ts`:
   ```typescript
   export interface Project {
     id: string;
     title: string;
     description: string;
     longDescription: string;
     role: string;
     features: string[];
     technologies: string[];
     liveUrl?: string;
     sourceUrl?: string;
     image?: string;
     color: string;          // Planet color theme
     size: number;           // Planet relative size
     orbitRadius: number;    // Distance from star
     orbitSpeed: number;     // Orbital period multiplier
     orbitInclination?: number; // 3D tilt of orbit
   }

   export interface Technology {
     id: string;
     name: string;
     icon: string;
     category: 'frontend' | 'backend' | 'database' | 'devops' | 'design' | 'other';
     color: string;
   }

   export interface Profile {
     name: string;
     title: string;
     tagline: string;
     bio: string;
     avatar: string;
     email: string;
     location: string;
     social: SocialLink[];
     resumeUrl: string;
   }

   export interface SocialLink {
     platform: string;
     url: string;
     icon: string;
   }

   export interface CelestialObject {
     type: 'star' | 'planet' | 'satellite' | 'asteroid' | 'comet';
     // Extensible for future section types
   }
   ```

6. **Set up base layout with dark theme** in `globals.css` and `layout.tsx`

7. **Create a simple test page** that renders "Solar Portfolio - Loading..." to verify the setup works

### Testing Criteria
- [ ] `npm run dev` starts without errors
- [ ] Navigate to `localhost:3000` and see the test page
- [ ] TypeScript compilation passes with `npm run build`
- [ ] All dependencies are correctly installed (no peer dependency warnings that break the build)
- [ ] Folder structure exists as specified
- [ ] Tailwind classes render correctly (test with a colored div)

---

## Phase 1: Data Layer & State Management

### Objective
Create the complete data architecture with sample portfolio data, Zustand stores for application state, and all TypeScript types. This is the foundation everything else reads from.

### Steps

1. **Populate `src/data/profile.ts`** with placeholder profile data:
   - Name, title ("Full Stack Developer"), tagline
   - Bio paragraph (2-3 sentences)
   - Avatar placeholder URL
   - Social links (GitHub, LinkedIn, Twitter, Email)
   - Resume URL placeholder

2. **Populate `src/data/technologies.ts`** with at least 15-20 technologies:
   ```typescript
   export const technologies: Technology[] = [
     { id: 'react', name: 'React', icon: '⚛️', category: 'frontend', color: '#61DAFB' },
     { id: 'nextjs', name: 'Next.js', icon: '▲', category: 'frontend', color: '#FFFFFF' },
     { id: 'typescript', name: 'TypeScript', icon: '🔷', category: 'frontend', color: '#3178C6' },
     { id: 'nodejs', name: 'Node.js', icon: '🟢', category: 'backend', color: '#339933' },
     { id: 'python', name: 'Python', icon: '🐍', category: 'backend', color: '#3776AB' },
     { id: 'threejs', name: 'Three.js', icon: '🔺', category: 'frontend', color: '#000000' },
     // ... at least 15 more
   ];
   ```

3. **Populate `src/data/projects.ts`** with 5-6 sample projects:
   - Each project has unique color, size, orbit radius, orbit speed
   - Technologies array references technology IDs
   - Varying complexity (2-6 technologies per project)
   - Include all fields from the Project interface
   - Orbit radii should be spaced to avoid overlap (e.g., 4, 6.5, 9, 12, 15, 18.5)

4. **Create `src/data/navigation.ts`** with navigation items:
   ```typescript
   export const navigationItems = [
     { id: 'home', label: 'Home', icon: '🏠', shortcut: 'H' },
     { id: 'about', label: 'About Me', icon: '👤', shortcut: 'A' },
     { id: 'projects', label: 'Projects', icon: '🪐', shortcut: 'P' },
     { id: 'contact', label: 'Contact', icon: '📡', shortcut: 'C' },
     { id: 'resume', label: 'Resume', icon: '📄', shortcut: 'R' },
   ];
   ```

5. **Create Zustand store `src/stores/usePortfolioStore.ts`**:
   ```typescript
   interface PortfolioState {
     // Selection state
     selectedPlanet: string | null;
     hoveredPlanet: string | null;
     activeSection: string;

     // Camera state
     cameraTarget: [number, number, number];
     cameraZoom: number;
     isTransitioning: boolean;

     // UI state
     isPanelOpen: boolean;
     isProfileOpen: boolean;
     isLoaded: boolean;
     loadingProgress: number;

     // Actions
     selectPlanet: (id: string | null) => void;
     hoverPlanet: (id: string | null) => void;
     setActiveSection: (section: string) => void;
     setCameraTarget: (target: [number, number, number]) => void;
     setCameraZoom: (zoom: number) => void;
     setIsTransitioning: (transitioning: boolean) => void;
     openPanel: () => void;
     closePanel: () => void;
     toggleProfile: () => void;
     setLoaded: () => void;
     setLoadingProgress: (progress: number) => void;
     resetView: () => void;
   }
   ```

6. **Create Zustand store `src/stores/useSettingsStore.ts`**:
   ```typescript
   interface SettingsState {
     reducedMotion: boolean;
     soundEnabled: boolean;
     showOrbits: boolean;
     showLabels: boolean;
     quality: 'low' | 'medium' | 'high';
     viewMode: '3d' | '2d';  // Fallback for performance

     // Actions
     toggleReducedMotion: () => void;
     toggleSound: () => void;
     toggleOrbits: () => void;
     toggleLabels: () => void;
     setQuality: (q: 'low' | 'medium' | 'high') => void;
     setViewMode: (mode: '3d' | '2d') => void;
   }
   ```

7. **Create `src/lib/constants.ts`** with orbital mechanics constants:
   ```typescript
   export const ORBIT_SPEED_BASE = 0.001;
   export const SATELLITE_ORBIT_RADIUS = 0.8;
   export const SATELLITE_SIZE = 0.15;
   export const STAR_SIZE = 2.5;
   export const CAMERA_DEFAULT_POSITION: [number, number, number] = [0, 25, 35];
   export const CAMERA_PLANET_ZOOM: [number, number, number] = [0, 5, 8];
   export const COLORS = {
     starGlow: '#FDB813',
     starCore: '#FFF5E0',
     orbitPath: 'rgba(255, 255, 255, 0.08)',
     background: '#050510',
     nebulaPurple: '#1a0533',
     nebulaBlue: '#0a1628',
   };
   ```

8. **Create utility hooks**:
   - `src/hooks/useReducedMotion.ts` - detects `prefers-reduced-motion`
   - `src/hooks/useResponsive.ts` - breakpoint detection with `window.matchMedia`
   - `src/hooks/useKeyboardNav.ts` - keyboard shortcuts for planet navigation (arrow keys, escape, enter)

### Testing Criteria
- [ ] Import all data files and verify they export correct shapes
- [ ] Create a temporary test page that renders all project names, technology names, and profile data as plain text
- [ ] Zustand stores initialize with correct default values
- [ ] Store actions update state correctly (write simple Jest tests)
- [ ] `useReducedMotion` hook returns boolean
- [ ] `useResponsive` hook returns current breakpoint
- [ ] Adding a new project to the array compiles without errors
- [ ] TypeScript shows no type errors anywhere

---

## Phase 2: 3D Scene Foundation & Starfield

### Objective
Create the base Three.js scene with React Three Fiber, including the starfield background, camera controls, basic lighting, and post-processing effects. This phase should result in a beautiful, immersive space background that the user can look around in.

### Steps

1. **Create `src/components/canvas/Scene.tsx`** - Main R3F Canvas wrapper:
   ```tsx
   // Uses <Canvas> from @react-three/fiber
   // Sets up:
   // - Camera with perspective projection at CAMERA_DEFAULT_POSITION
   // - Tone mapping (ACESFilmic)
   // - Anti-aliasing
   // - Pixel ratio capped at 2 for performance
   // - Color management (linear sRGB)
   // - Suspense boundary with loading fallback
   // - fog for depth (subtle exponential fog)
   ```

2. **Create `src/components/canvas/Starfield.tsx`** - Procedural star background:
   - Generate 5000-8000 stars as instanced points
   - Varying sizes (0.01 to 0.05)
   - Varying brightness/opacity
   - Subtle twinkle animation using shader or time-based opacity
   - Stars distributed in a large sphere around the scene (radius ~200)
   - Use `THREE.Points` with `THREE.BufferGeometry` for performance
   - Add 2-3 distant nebula planes with semi-transparent gradient textures (use `@react-three/drei`'s `<Plane>` with custom material)

3. **Create `src/components/canvas/CameraController.tsx`**:
   - Use `@react-three/drei`'s `<OrbitControls>` as base
   - Constrain zoom: min distance 10, max distance 60
   - Constrain vertical rotation: don't allow going fully upside down
   - Enable damping (inertia) with factor 0.05
   - Smooth animated transitions when camera target changes (using GSAP or lerping in useFrame)
   - Auto-rotate very slowly when idle (0.1 speed)
   - Disable auto-rotate when user interacts
   - Listen to Zustand store for `cameraTarget` and `cameraZoom` changes to animate camera

4. **Create `src/components/canvas/PostProcessing.tsx`**:
   - Bloom effect (threshold: 0.6, intensity: 0.8, radius: 0.6) for glowing elements
   - Very subtle vignette
   - Optional: chromatic aberration at extremely low levels (0.001)
   - Use `@react-three/postprocessing` with `<EffectComposer>`
   - Respect quality settings from `useSettingsStore`

5. **Set up lighting in Scene**:
   - Ambient light (very low intensity ~0.05, slight blue tint)
   - Point light at center (0,0,0) for the star - warm white, intensity ~2
   - Optional: very subtle directional light for fill

6. **Create the loading screen** `src/components/ui/LoadingScreen.tsx`:
   - Full screen overlay with space-themed design
   - Loading progress bar or animated indicator
   - Fades out once scene is loaded
   - Uses Framer Motion for fade-out animation
   - Listens to Zustand store `isLoaded` and `loadingProgress`

7. **Integrate Scene into `page.tsx`**:
   - Dynamic import Scene with `ssr: false` (Three.js must render client-side)
   - Show LoadingScreen while Scene loads
   - Full viewport canvas (100vw × 100vh)

8. **Add `<Suspense>` and `<Preload>` from drei** for asset management

### Testing Criteria
- [ ] Page loads and shows the loading screen, then fades to the 3D scene
- [ ] Stars are visible and distributed across the viewport
- [ ] Stars have subtle twinkling/variation
- [ ] Mouse drag rotates the camera view
- [ ] Scroll wheel zooms in/out within constraints
- [ ] Bloom post-processing creates visible glow
- [ ] No console errors related to WebGL or Three.js
- [ ] Performance: maintains 60fps with starfield on mid-range hardware
- [ ] **Take screenshot** - verify: dark background, visible stars, no visual artifacts
- [ ] **Take screenshot** at different zoom levels to verify fog/depth

---

## Phase 3: Central Star (Profile Hub)

### Objective
Create the central star that represents the user's profile. It should be visually striking with a realistic glowing sun effect, and clicking it reveals the profile information.

### Steps

1. **Create `src/components/canvas/Star.tsx`** - The central sun:
   - Use a `<Sphere>` geometry (segments: 64 for smoothness)
   - Size: `STAR_SIZE` from constants (radius ~2.5)
   - **Material layers** (inside to out):
     a. **Core sphere**: Bright emissive material (MeshStandardMaterial with emissive and emissiveIntensity ~2)
     b. **Inner glow layer**: Slightly larger transparent sphere with additive blending, animated opacity
     c. **Corona/Outer glow**: Even larger sphere or sprite with custom shader for atmospheric glow, using Fresnel effect
     d. **Solar flare particles**: Small particle system around the star surface with upward drift
   - **Animation**:
     - Slow rotation on Y axis
     - Pulsing glow (subtle scale oscillation: 1.0 to 1.03, sinusoidal)
     - Corona shimmer using noise in shader
   - **Interaction**:
     - `onPointerOver`: increase glow intensity, change cursor to pointer
     - `onPointerOut`: return to default
     - `onClick`: trigger `toggleProfile()` in Zustand store, animate camera to zoom toward star
   - **Custom shader for corona glow** (`src/lib/shaders/`):
     ```glsl
     // Vertex shader: pass view direction and normal to fragment
     // Fragment shader:
     //   - Fresnel effect (edge glow)
     //   - Time-based noise for corona variation
     //   - Color gradient from core (white) to edge (golden/orange)
     //   - Additive blending
     ```

2. **Create `src/components/canvas/StarLabel.tsx`**:
   - Use `@react-three/drei`'s `<Html>` component for DOM overlay in 3D space
   - Position just below the star
   - Show name and title with glow text effect
   - Fade based on camera distance (visible at medium zoom, hidden when too far or too close)
   - Conditional on `showLabels` setting

3. **Create `src/components/ui/ProfileCard.tsx`** - 2D overlay for profile details:
   - Triggered when star is clicked
   - Uses Framer Motion for slide-in from left or center modal
   - Glassmorphism design (backdrop-blur, semi-transparent background)
   - Contains:
     - Avatar image/placeholder with glowing border
     - Name (large, with subtle glow)
     - Title/Role
     - Tagline/Short bio
     - Social links row (GitHub, LinkedIn, Twitter, Email) with hover effects
     - "View Resume" button
     - Navigation links to sections (About, Projects, Contact)
     - Close button
   - Uses Radix UI Dialog for accessibility (focus trap, escape to close, aria-labels)
   - Styled with Tailwind + custom CSS for the glow effects

4. **Create `src/components/shared/GlowText.tsx`**:
   - Text component with CSS text-shadow glow effect
   - Configurable glow color and intensity
   - Subtle animation option

5. **Add point light to the Star** that illuminates nearby planets:
   - Warm white/yellow color
   - Intensity that creates visible light falloff on planets
   - Optional: `<ContactShadows>` from drei for grounding

6. **Connect star click to Zustand store and camera system**:
   - Clicking star: camera smoothly zooms in to a close-up position
   - Profile card appears after camera transition completes
   - Clicking away or pressing Escape: camera returns to default, profile card closes

### Testing Criteria
- [ ] Star renders at center of scene with visible glow
- [ ] Star has realistic multi-layer glow effect (core, inner glow, corona)
- [ ] Star slowly rotates and has pulsing animation
- [ ] Hovering over star changes cursor and intensifies glow
- [ ] Clicking star opens the ProfileCard overlay
- [ ] ProfileCard displays all profile data correctly
- [ ] ProfileCard can be closed with X button, Escape key, or clicking outside
- [ ] Social links in ProfileCard are clickable
- [ ] Camera animates toward star on click
- [ ] Camera returns to default position on close
- [ ] Star label shows name/title below the star
- [ ] **Take screenshot**: Star with glow effect, verify visual quality
- [ ] **Take screenshot**: ProfileCard open, verify layout, readability, glassmorphism
- [ ] **Take screenshot**: Mobile viewport, verify ProfileCard is responsive

---

## Phase 4: Planets (Projects) with Orbital Motion

### Objective
Render each project as a planet orbiting the central star, with proper orbital mechanics, distinct visual appearance per planet, and hover/click interactions.

### Steps

1. **Create `src/hooks/useOrbitalMotion.ts`**:
   ```typescript
   // Custom hook that calculates orbital position given:
   // - orbitRadius: distance from center
   // - orbitSpeed: speed multiplier
   // - orbitInclination: tilt of orbital plane (degrees)
   // - timeOffset: starting angle offset (so planets don't bunch up)
   // - reducedMotion: if true, planets are static at their offset positions
   //
   // Returns: { x, y, z } position updated via useFrame
   // Uses: x = radius * cos(angle), z = radius * sin(angle)
   // For inclination: y = sin(inclination) * sin(angle) * some factor
   ```

2. **Create `src/components/canvas/Planet.tsx`**:
   - Receives a `Project` object as props
   - Uses `useOrbitalMotion` hook for position
   - **Visual design per planet**:
     - `<Sphere>` geometry with segment count based on quality setting
     - MeshStandardMaterial with:
       - Base color from `project.color`
       - Roughness: 0.7, Metalness: 0.3
       - Subtle emissive matching project color (low intensity)
     - Atmospheric glow ring (using a torus or custom shader for Fresnel atmosphere)
     - Each planet has unique size from `project.size`
   - **Planet texturing** (procedural):
     - Use noise-based procedural texture OR solid color with subtle gradient
     - Optional: use drei's `<meshPhysicalMaterial>` with clearcoat for glass-like planets
   - **Hover state**:
     - Scale up slightly (1.0 → 1.15)
     - Increase emissive intensity
     - Show planet label (project title)
     - Show orbit ring highlight
     - Set `hoveredPlanet` in store
   - **Click state**:
     - Set `selectedPlanet` in store
     - Trigger camera zoom to planet
     - Open project detail panel
   - **Group structure**: `<group>` wrapping planet + satellites + label + atmosphere

3. **Create `src/components/canvas/OrbitRing.tsx`**:
   - Renders the orbital path as a thin ring/torus
   - Uses `THREE.RingGeometry` or `THREE.TorusGeometry` (very thin)
   - Semi-transparent white/gray material
   - Matches orbit radius and inclination of the planet
   - Highlight effect when corresponding planet is hovered
   - Dashed line style option using shader or `THREE.LineDashedMaterial`
   - Conditional on `showOrbits` setting

4. **Create `src/components/canvas/PlanetLabel.tsx`**:
   - Uses `@react-three/drei`'s `<Html>` or `<Text>` (drei's SDF text)
   - Positioned above the planet
   - Shows project title
   - Fades in on hover, always visible option based on settings
   - Billboard effect (always faces camera) using `<Billboard>` from drei
   - Styled to match space aesthetic (light text, subtle glow)

5. **Create `src/components/canvas/PlanetSystem.tsx`** - Orchestrator:
   - Maps over `projects` data array
   - Calculates time offsets so planets are evenly distributed initially
   - Renders a `<Planet>` + `<OrbitRing>` for each project
   - Handles the data-driven logic: adding a new project to the array automatically creates a new planet
   - Auto-calculates orbit radii if not specified (evenly spaced)

6. **Add planets to the Scene**:
   - Render `<PlanetSystem>` inside Scene alongside Star and Starfield
   - Ensure planets receive light from the central star's point light
   - Planets closer to star should appear slightly brighter
   - Planets cast and receive shadows (optional, based on quality setting)

7. **Implement camera transitions for planet selection**:
   - When planet clicked: camera smoothly moves to a position near the planet
   - Camera looks at the planet (not the star)
   - Show project details after camera arrives
   - "Back" action returns camera to overview

### Testing Criteria
- [ ] All projects from data array render as planets
- [ ] Each planet has a distinct color matching its project data
- [ ] Planets orbit the central star at different speeds and radii
- [ ] Orbit rings are visible and match planet paths
- [ ] Hovering a planet shows its label and visual hover effect
- [ ] Clicking a planet updates the Zustand store
- [ ] Camera smoothly transitions to clicked planet
- [ ] Pressing Escape or clicking "back" returns to overview
- [ ] No planet overlaps with another planet or the star
- [ ] Adding a 7th project to the data array renders a 7th planet automatically
- [ ] Performance: 60fps with 6 planets orbiting simultaneously
- [ ] `reducedMotion`: planets are visible but stationary
- [ ] **Take screenshot**: Full solar system view with all planets orbiting
- [ ] **Take screenshot**: Close-up of a single planet showing detail and atmosphere
- [ ] **Take screenshot**: Hover state on a planet

---

## Phase 5: Satellites (Technologies) Orbiting Planets

### Objective
Each planet (project) has smaller satellites orbiting it, representing the technologies used in that project. These should be clearly smaller and visually distinct from planets.

### Steps

1. **Create `src/components/canvas/Satellite.tsx`**:
   - Small sphere (radius ~`SATELLITE_SIZE` = 0.15)
   - Orbits around its parent planet (not the star)
   - Uses `useOrbitalMotion` but relative to parent planet's position
   - Orbit radius: `SATELLITE_ORBIT_RADIUS` (0.6-1.2 depending on planet size)
   - **Visual design**:
     - Color matches the technology's color from the technologies data
     - Slightly emissive
     - Subtle glow effect (smaller than planet glow)
     - Different geometry options by category:
       - Frontend: sphere
       - Backend: octahedron
       - Database: cube/box
       - DevOps: icosahedron
       - Design: dodecahedron
   - **Label on hover**:
     - Show technology name
     - Small tooltip-style label using `<Html>` from drei
   - Satellites should orbit faster than planets (they're moons)

2. **Create `src/components/canvas/SatelliteSystem.tsx`**:
   - Takes a planet's `technologies` array and parent planet position
   - Maps technology IDs to full technology objects from data
   - Evenly distributes satellites around the planet's orbit
   - Calculates orbit inclinations to avoid satellites overlapping
   - Groups all satellites for a given planet

3. **Integrate satellites into Planet component**:
   - Each `<Planet>` renders its `<SatelliteSystem>` as a child
   - Satellites move with the planet (they're in the planet's group)
   - Satellite orbits are visible as thin, very subtle rings around planets
   - When planet is selected (zoomed in), satellites become more prominent

4. **Visual distinction between planets and satellites**:
   - Size difference: planets are 5-15x larger than satellites
   - Satellites have different geometry shapes (not just spheres)
   - Satellite orbit rings are thinner and more subtle
   - Satellite labels are smaller font
   - Different glow characteristics (satellites: sharp small glow, planets: large atmospheric glow)

5. **Interaction with satellites**:
   - Hovering a satellite shows its technology name
   - Clicking a satellite could link to the technology's documentation (optional)
   - When parent planet is selected and camera is zoomed in, satellites are individually interactive
   - When in overview (zoomed out), satellites appear as small dots around planets

6. **Performance optimization**:
   - Use `THREE.InstancedMesh` if satellite count gets high
   - LOD (Level of Detail): when camera is far, render satellites as points; when close, render as geometry
   - Frustum culling (built into Three.js but ensure it's not disabled)

### Testing Criteria
- [ ] Each planet has the correct number of satellites matching its technologies
- [ ] Satellites orbit their parent planet, not the star
- [ ] Satellites move with their planet as it orbits the star
- [ ] Satellites are clearly smaller than planets
- [ ] Different technology categories show different satellite shapes
- [ ] Hovering a satellite shows its technology name
- [ ] Satellite colors match their technology definitions
- [ ] Satellites don't collide with each other or their parent planet
- [ ] At overview zoom level, satellites are visible but small
- [ ] At planet zoom level, satellites are clearly distinguishable
- [ ] Performance: still 60fps with all satellites rendered
- [ ] Adding a technology to a project's array automatically adds a satellite
- [ ] **Take screenshot**: Planet with visible satellites orbiting it
- [ ] **Take screenshot**: Close-up of satellites showing different shapes and labels
- [ ] **Take screenshot**: Overview showing size distinction between planets and satellites

---

## Phase 6: Project Detail Panel (2D UI Overlay)

### Objective
When a planet is selected, display a rich, detailed panel showing all project information. This is a 2D overlay that appears on top of the 3D scene.

### Steps

1. **Create `src/components/ui/ProjectPanel.tsx`**:
   - Animated panel that slides in from the right side of the screen
   - Uses Framer Motion for enter/exit animations
   - **Layout**:
     ```
     ┌─────────────────────────────────┐
     │  ← Back          [X] Close     │
     │                                 │
     │  ● PROJECT TITLE               │
     │  Role: Full Stack Developer     │
     │                                 │
     │  ┌─────────────────────────┐   │
     │  │   Project Screenshot/   │   │
     │  │   Preview Image         │   │
     │  └─────────────────────────┘   │
     │                                 │
     │  Description text paragraph     │
     │  spanning multiple lines with   │
     │  detailed information...        │
     │                                 │
     │  ─── Key Features ───          │
     │  ✦ Feature one                 │
     │  ✦ Feature two                 │
     │  ✦ Feature three               │
     │                                 │
     │  ─── Technologies ───          │
     │  [React] [Node.js] [MongoDB]   │
     │  [Docker] [TypeScript]         │
     │                                 │
     │  ┌──────────┐  ┌──────────┐   │
     │  │ Live Demo │  │  Source  │   │
     │  └──────────┘  └──────────┘   │
     └─────────────────────────────────┘
     ```
   - **Styling**:
     - Glassmorphism: `backdrop-blur-xl bg-black/40 border border-white/10`
     - Accent color matches the selected planet's color
     - Subtle animated border gradient
     - Scrollable if content overflows
     - Width: ~400px on desktop, full width on mobile
   - **Content**:
     - Project title with glow effect matching planet color
     - Role badge
     - Description (long description from data)
     - Key features list with custom bullet icons
     - Technologies as badges (colored to match technology data)
     - Live demo and source code buttons with hover effects
     - Project image/screenshot if available

2. **Create `src/components/shared/Badge.tsx`**:
   - Reusable badge component for technologies
   - Shows technology name with its color
   - Optional icon
   - Hover effect that makes it glow

3. **Create `src/components/shared/Button.tsx`**:
   - Space-themed button variants: `primary`, `secondary`, `ghost`
   - Glow border on hover
   - Icons support (external link icon for live demo, GitHub icon for source)
   - Accessible focus states

4. **Connect panel to Zustand store**:
   - Panel reads `selectedPlanet` from store
   - Looks up full project data from `projects` array
   - Renders content based on selected project
   - Panel open/close synced with `isPanelOpen` state

5. **Create `src/components/shared/AnimatedContainer.tsx`**:
   - Reusable Framer Motion container for staggered child animations
   - Children animate in one by one with slight delay
   - Used in ProjectPanel for content reveal

6. **Add panel integration to main page**:
   - Panel renders on top of the canvas
   - Panel doesn't block the 3D scene (positioned to the side)
   - When panel is open, 3D scene is partially visible and slightly dimmed/blurred
   - Clicking outside panel or pressing Escape closes it

7. **Animate technology badges to highlight corresponding satellites**:
   - When hovering a technology badge in the panel, the corresponding satellite in the 3D scene glows brighter
   - Creates a connection between 2D UI and 3D scene

### Testing Criteria
- [ ] Clicking a planet opens the ProjectPanel with correct project data
- [ ] Panel slides in with smooth animation
- [ ] All project fields render correctly (title, role, description, features, technologies, links)
- [ ] Technology badges display with correct colors
- [ ] Live Demo and Source Code buttons are clickable and open in new tabs
- [ ] Panel is scrollable when content overflows
- [ ] Panel closes on Escape key, X button, and back button
- [ ] Closing panel returns camera to overview
- [ ] Hovering technology badges highlights corresponding 3D satellites
- [ ] Panel doesn't overlap with critical 3D elements
- [ ] Staggered animation on panel content (items appear one by one)
- [ ] **Take screenshot**: Panel open with full content visible
- [ ] **Take screenshot**: Panel on mobile viewport (full width)
- [ ] **Take screenshot**: Technology badges hover state
- [ ] **Take screenshot**: Panel close animation (mid-transition)

---

## Phase 7: Navigation & HUD (Heads-Up Display)

### Objective
Create the navigation system and HUD overlay that provides consistent access to sections, settings, and wayfinding within the solar system.

### Steps

1. **Create `src/components/ui/Navigation.tsx`**:
   - Fixed position navigation bar
   - **Desktop**: Vertical pill on the left side of the screen
     ```
     ┌───┐
     │ ☀ │  Home (Star)
     │ 🪐 │  Projects
     │ 👤 │  About
     │ 📡 │  Contact
     │ 📄 │  Resume
     │ ⚙ │  Settings
     └───┘
     ```
   - **Mobile**: Bottom horizontal bar
   - Each nav item:
     - Icon + label (label visible on hover or always on mobile)
     - Active state indicator (glowing dot or line)
     - Click action: navigates to section (camera moves to relevant area or opens overlay)
     - Keyboard shortcut support
   - Glassmorphism style matching overall aesthetic
   - Framer Motion hover and active animations
   - Uses Radix NavigationMenu for accessibility

2. **Create `src/components/ui/HUD.tsx`** - Heads-up display overlay:
   - **Top left**: Site title/logo "PORTFOLIO" in space font
   - **Top right**: Mini solar system map (optional - small dots showing planet positions)
   - **Bottom left**: Current view label ("Overview" / "Project: Name" / "Profile")
   - **Bottom right**: Keyboard shortcut hint ("Press ? for shortcuts")
   - All HUD elements are subtle and don't distract from the 3D scene
   - HUD elements fade out when project panel is open

3. **Create `src/components/ui/SettingsToggle.tsx`**:
   - Opens a settings panel/popover (Radix Popover)
   - Toggle options:
     - Reduced motion (on/off)
     - Sound effects (on/off)
     - Show orbit paths (on/off)
     - Show labels (on/off)
     - Quality (Low/Medium/High)
     - View mode (3D/2D fallback)
   - Each toggle uses Radix Switch for accessibility
   - Settings persist to localStorage

4. **Create `src/components/ui/KeyboardShortcutsModal.tsx`**:
   - Triggered by pressing `?` key
   - Shows all available keyboard shortcuts:
     - `H` - Go home (overview)
     - `←→` - Navigate between planets
     - `Enter` - Select hovered planet
     - `Escape` - Close/go back
     - `P` - Toggle profile
     - `?` - Show shortcuts
   - Radix Dialog for accessibility

5. **Implement `src/hooks/useKeyboardNav.ts`** fully:
   - Arrow left/right: cycle through planets
   - Enter: select currently hovered planet
   - Escape: deselect / close panel / go back
   - Home/H: reset to overview
   - Tab: cycle through interactive elements
   - Number keys 1-9: jump to planet by index
   - Register all shortcuts and handle them

6. **Create breadcrumb/path indicator**:
   - Shows current navigation path: `Solar System > Project Name`
   - Clickable to go back to any level
   - Subtle, positioned at top of viewport

7. **Connect all navigation to Zustand store and camera system**:
   - "Home" nav item: resets camera to default overview position
   - "Projects" nav item: ensures camera is at overview level
   - "About" nav item: opens profile card (same as clicking star)
   - "Contact" nav item: opens a contact overlay
   - "Resume" nav item: opens resume link in new tab

### Testing Criteria
- [ ] Navigation bar is visible and positioned correctly on desktop (left side)
- [ ] Navigation bar adapts to bottom bar on mobile
- [ ] Clicking each nav item triggers the correct action
- [ ] Active state highlights the current section
- [ ] Keyboard shortcuts work (H, arrows, Enter, Escape, ?)
- [ ] Shortcuts modal appears on `?` press
- [ ] Settings panel opens and toggles work
- [ ] Toggling "Reduced Motion" stops planet animations
- [ ] Toggling "Show Orbits" hides/shows orbit rings
- [ ] Settings persist across page reload (localStorage)
- [ ] HUD elements are visible but unobtrusive
- [ ] HUD fades when project panel is open
- [ ] Tab navigation works through all interactive elements
- [ ] Focus states are clearly visible (outline or glow)
- [ ] **Take screenshot**: Desktop view with navigation bar
- [ ] **Take screenshot**: Mobile view with bottom navigation
- [ ] **Take screenshot**: Settings panel open
- [ ] **Take screenshot**: Keyboard shortcuts modal

---

## Phase 8: Contact Section & Additional Overlays

### Objective
Build the contact section, about section, and any remaining content overlays. These appear as 2D overlays triggered from navigation or celestial interactions.

### Steps

1. **Create `src/components/ui/ContactOverlay.tsx`**:
   - Full-screen or large modal overlay
   - Glassmorphism design consistent with other panels
   - **Content**:
     - "Let's Connect" heading with glow
     - Email link (mailto:)
     - Social links (larger, more prominent than in profile card)
     - Optional contact form (name, email, message) - can use Formspree or similar
     - Location indicator
     - "Download Resume" button
   - Animated entrance using Framer Motion
   - Background: slightly visible 3D scene with blur

2. **Create `src/components/ui/AboutOverlay.tsx`**:
   - Detailed about section
   - **Content**:
     - Larger bio text
     - Skills organized by category (can show as mini constellations or grouped badges)
     - Experience timeline (optional, styled as a "space timeline")
     - Education
     - Interests/Hobbies
   - Scrollable content area
   - Section headers with decorative elements (stars, lines)

3. **Create `src/components/ui/ResumeViewer.tsx`** (optional):
   - Either embed PDF or link to external resume
   - If embedded: styled viewer with download button
   - If external: redirect with a nice transition animation

4. **Add celestial objects for future sections** (extensibility):
   - Create an asteroid belt between inner and outer planets for "Skills"
   - Create a comet for "Blog" or "Latest Updates" (animated, crosses the scene periodically)
   - Document how to add new celestial types in the code with comments

5. **Create `src/components/ui/ContactForm.tsx`** (if including a form):
   - Space-themed form inputs:
     - Dark background inputs with glowing borders on focus
     - Floating labels
     - Submit button with loading state
   - Basic client-side validation
   - Success/error states with animations
   - Accessible: labels, error messages, ARIA attributes

6. **Implement smooth transitions between sections**:
   - Switching sections should feel seamless
   - 3D camera adjusts subtly based on active section
   - Example: Contact section might slowly pan camera to a specific angle
   - Profile/About might zoom slightly toward the star

### Testing Criteria
- [ ] Contact overlay opens from navigation
- [ ] All contact information renders correctly
- [ ] Social links work and open in new tabs
- [ ] Contact form validates inputs (if included)
- [ ] About overlay displays all personal information
- [ ] About overlay is scrollable for long content
- [ ] Resume button/link works correctly
- [ ] Overlays can be closed via X button, Escape, or clicking outside
- [ ] Transitions between sections are smooth
- [ ] Only one overlay is open at a time (opening one closes others)
- [ ] 3D scene remains visible (blurred) behind overlays
- [ ] **Take screenshot**: Contact overlay
- [ ] **Take screenshot**: About overlay
- [ ] **Take screenshot**: Contact form focused state
- [ ] **Take screenshot**: Mobile contact view

---

## Phase 9: Responsive Design & Mobile Experience

### Objective
Ensure the portfolio works beautifully on all device sizes. On mobile, the 3D solar system should adapt or provide an alternative interactive/scrollable experience.

### Steps

1. **Create `src/components/ui/MobileView.tsx`** - Alternative mobile layout:
   - On screens < 768px, offer a choice between:
     a. **Simplified 3D**: Reduced quality, touch-optimized controls, larger touch targets
     b. **2D Card Layout**: Scrollable, interactive card-based view
   - Default to option based on device capability (detect WebGL support and performance)

2. **Mobile 2D fallback layout**:
   - **Hero section**: Star visualization (CSS-only animated glow circle) + profile info
   - **Projects section**: Horizontal scrollable cards or vertical card list
     - Each card shows: project color accent, title, description excerpt, technology badges
     - Tap to expand card with full details
   - **Technologies**: Grouped badges section
   - **Contact**: Full-width contact section
   - Smooth scroll with snap points
   - Parallax star background using CSS

3. **Tablet optimization (768px - 1024px)**:
   - Keep 3D scene but with reduced quality settings
   - Larger touch targets on planets
   - Project panel takes more width (50-60% of screen)
   - Navigation adapts to horizontal top bar or bottom bar

4. **Touch interactions for 3D scene**:
   - Pinch to zoom (already supported by OrbitControls)
   - Drag to rotate
   - Tap on planet to select (larger hit areas)
   - Double-tap to zoom to planet
   - Swipe gestures for navigating between planets

5. **Responsive typography**:
   - Use `clamp()` for fluid typography
   - Heading sizes adapt to viewport
   - Body text stays readable at all sizes (min 16px on mobile)

6. **Responsive spacing and layout**:
   - Panels adapt width and positioning
   - HUD elements reposition for mobile
   - Navigation transforms from vertical sidebar to bottom bar
   - Adequate padding and margins on small screens

7. **Performance optimization for mobile**:
   - Reduce star count (3000 instead of 8000)
   - Lower geometry segments for planets
   - Disable post-processing on low-end devices
   - Reduce or disable shadows
   - Cap pixel ratio at 1.5 on mobile
   - Use quality detection: check `navigator.hardwareConcurrency` and WebGL renderer info

8. **Test all breakpoints**:
   - 320px (small mobile)
   - 375px (iPhone standard)
   - 414px (iPhone Plus/Max)
   - 768px (tablet)
   - 1024px (tablet landscape / small laptop)
   - 1440px (desktop)
   - 1920px+ (large desktop)

### Testing Criteria
- [ ] At 375px width: either simplified 3D or 2D card layout works
- [ ] At 768px width: 3D scene with touch controls works
- [ ] At 1440px width: full experience with all features
- [ ] Touch controls work: drag to rotate, pinch to zoom, tap to select
- [ ] Project panel is full-width on mobile
- [ ] Navigation is bottom bar on mobile
- [ ] All text is readable at all sizes (no overflow, no truncation of important info)
- [ ] No horizontal scrolling occurs (unless intentional, like project cards)
- [ ] Performance is acceptable on mobile (test with Chrome DevTools throttling)
- [ ] Orientation change (portrait ↔ landscape) handles gracefully
- [ ] **Take screenshot at 375px**: Mobile view
- [ ] **Take screenshot at 768px**: Tablet view
- [ ] **Take screenshot at 1440px**: Desktop view
- [ ] **Take screenshot at 375px**: Mobile project detail view
- [ ] **Take screenshot at 375px**: Mobile navigation

---

## Phase 10: Animations, Polish & Micro-interactions

### Objective
Add the finishing touches: refined animations, transitions, micro-interactions, loading states, and overall visual polish that make the experience feel premium.

### Steps

1. **Loading experience enhancement**:
   - Progress bar that tracks actual asset loading
   - Animated solar system forming during load (planets slide into orbit)
   - "Enter" button after load that triggers a zoom-in from far away
   - First visit: longer intro animation; return visit: faster load

2. **Planet entry animations**:
   - On initial load, planets fly in from off-screen and settle into orbits
   - Staggered timing (inner planets first)
   - Use GSAP timeline for coordinated animation

3. **Camera transition refinements**:
   - Smooth bezier-curved camera paths (not linear)
   - Subtle camera shake on planet selection (very subtle, using noise)
   - Parallax effect: nearer stars move faster than distant ones during camera movement
   - Use GSAP's `Power2.easeInOut` for natural feeling

4. **Hover micro-interactions**:
   - Planet surface ripple effect on hover (shader-based)
   - Satellite speed increases slightly when parent planet is hovered
   - Orbit ring glows when planet is hovered
   - Subtle haptic-like visual pulse on click

5. **Panel animations**:
   - Content items animate in with staggered delay
   - Technology badges pop in with spring physics
   - Subtle parallax within the panel on scroll
   - Close animation: content fades out first, then panel slides away

6. **Background enhancements**:
   - Occasional shooting star that crosses the scene (random interval, random direction)
   - Very subtle nebula color shift over time (gradual hue rotation)
   - Star twinkle variation (some stars twinkle faster, some slower)
   - Optional: distant galaxy clusters as faint textured planes

7. **Sound design** (optional but recommended):
   - Ambient space drone (very quiet, toggleable)
   - Soft click/chime on planet selection
   - Whoosh on camera transitions
   - Subtle hover sound on interactive elements
   - All sounds respect `soundEnabled` setting
   - Use Howler.js with sprite sheets for efficient loading

8. **Scroll-based interactions** (for mobile 2D view):
   - Parallax starfield on scroll
   - Cards animate in as they enter viewport
   - Progress indicator showing scroll position

9. **Cursor customization** (desktop):
   - Custom cursor: small crosshair/dot with subtle glow
   - Cursor changes on hoverable elements (grows, changes color)
   - Cursor trail effect (optional, very subtle)

10. **Transition between 3D and 2D views**:
    - If user switches view mode, animate the transition
    - 3D scene can "flatten" into 2D card layout
    - 2D view can "expand" into 3D scene

### Testing Criteria
- [ ] Loading animation plays and transitions to main scene
- [ ] Planets animate into position on first load
- [ ] Camera transitions feel smooth and natural (no jarring movements)
- [ ] Hover effects on planets are visible and responsive
- [ ] Panel content animates in with staggered timing
- [ ] Shooting star appears randomly (wait ~30 seconds to see one)
- [ ] Sound effects play on interaction (if enabled)
- [ ] Sound toggle works and mutes all sounds
- [ ] Custom cursor appears on desktop
- [ ] All animations respect reduced motion preference
- [ ] No animation jank or dropped frames
- [ ] **Take screenshot**: Loading screen with progress
- [ ] **Take screenshot**: Planet hover effect close-up
- [ ] **Take screenshot**: Panel with staggered content animation
- [ ] **Take screenshot**: Shooting star crossing the scene (may need manual timing)

---

## Phase 11: Accessibility & Performance Optimization

### Objective
Ensure the portfolio is accessible to all users and performs well on all devices. This phase focuses on WCAG compliance, performance metrics, and progressive enhancement.

### Steps

1. **Accessibility audit and fixes**:
   - Run automated accessibility scan (axe-core)
   - Ensure all interactive elements have:
     - Visible focus indicators (custom glow-style focus ring)
     - Appropriate ARIA labels
     - Keyboard operability
   - Screen reader testing:
     - 3D scene should have an `aria-label` describing the portfolio
     - Hidden `<div>` with text content of all projects for screen readers
     - Live regions for dynamic content changes
   - Color contrast: all text meets WCAG AA (4.5:1 ratio minimum)
   - Focus management: when panel opens, focus moves to panel; on close, focus returns

2. **Create `src/components/ui/AccessibilityBar.tsx`**:
   - Skip to main content link
   - Text size adjustment buttons
   - High contrast mode toggle
   - Motion reduction toggle (prominent)
   - Screen reader mode: replaces 3D scene with accessible HTML list

3. **Reduced motion implementation**:
   - When `prefers-reduced-motion: reduce` is detected OR user toggles setting:
     - All orbital motion stops (planets static at positions)
     - Transitions become instant cuts or very quick fades
     - No parallax effects
     - No shooting stars or particle effects
     - Camera transitions are immediate
     - Loading animation is simplified

4. **Performance optimization**:
   - **Code splitting**: Dynamic import all heavy components (Three.js scene, panels)
   - **Asset optimization**:
     - Compress any textures (use WebP/AVIF for images)
     - Lazy load images in panels
   - **Three.js optimizations**:
     - Dispose geometries and materials on unmount
     - Use `useMemo` for geometry/material creation
     - Implement LOD (Level of Detail) for planets based on camera distance
     - Frustum culling verification
     - Use `<PerformanceMonitor>` from drei to auto-adjust quality
   - **React optimizations**:
     - Memoize components that don't need re-rendering
     - Use `React.memo` on Planet components
     - Prevent unnecessary re-renders from Zustand (selective subscriptions)
   - **Bundle analysis**: Run `next-bundle-analyzer` and optimize large packages

5. **Core Web Vitals targets**:
   - LCP (Largest Contentful Paint): < 2.5s
   - FID (First Input Delay): < 100ms
   - CLS (Cumulative Layout Shift): < 0.1
   - Strategy: show 2D skeleton immediately, load 3D asynchronously

6. **Progressive enhancement**:
   - Base experience works without JavaScript (show static HTML portfolio)
   - Works without WebGL (fallback to 2D CSS-animated version)
   - Works without JavaScript animations (static but functional)
   - Feature detection for all advanced features

7. **SEO considerations**:
   - Proper meta tags (title, description, Open Graph, Twitter Card)
   - Structured data (JSON-LD for Person and CreativeWork)
   - Semantic HTML for all content
   - Sitemap generation
   - `robots.txt`

8. **Performance monitoring setup**:
   - Add `<PerformanceMonitor>` from drei:
     ```tsx
     <PerformanceMonitor
       onDecline={() => setQuality('low')}
       onIncline={() => setQuality('high')}
     >
       {/* Scene contents */}
     </PerformanceMonitor>
     ```
   - Log FPS in development
   - Adaptive quality: auto-reduce particles, post-processing, geometry when FPS drops

### Testing Criteria
- [ ] axe-core scan returns zero critical/serious violations
- [ ] All interactive elements reachable and operable by keyboard alone
- [ ] Tab order is logical (nav → star → planets → panel content)
- [ ] Focus indicators are clearly visible (test on white and dark backgrounds)
- [ ] Screen reader announces meaningful content for all elements
- [ ] Color contrast passes WCAG AA for all text
- [ ] `prefers-reduced-motion` properly disables animations
- [ ] Site functions without WebGL (fallback renders)
- [ ] Lighthouse performance score ≥ 80
- [ ] Lighthouse accessibility score ≥ 90
- [ ] Bundle size of initial page load < 200KB gzipped (before Three.js lazy load)
- [ ] Three.js loads within 2 seconds on fast 3G connection
- [ ] No memory leaks (check Chrome DevTools Memory tab over 5 minutes of use)
- [ ] **Run**: `npx playwright test` - all E2E tests pass
- [ ] **Run**: Lighthouse audit and record scores

---

## Phase 12: Final Testing, Bug Fixes & Deployment

### Objective
Comprehensive end-to-end testing, visual regression testing, bug fixes, final polish, and deployment to Vercel.

### Steps

1. **End-to-end test suite** (`tests/e2e/`):
   ```typescript
   // Tests to write:
   test('homepage loads and shows solar system', ...)
   test('clicking star opens profile card', ...)
   test('clicking planet opens project panel', ...)
   test('project panel shows correct data', ...)
   test('navigation links work', ...)
   test('keyboard navigation through planets', ...)
   test('escape closes open panels', ...)
   test('settings toggles work', ...)
   test('mobile layout renders card view', ...)
   test('adding new project to data shows new planet', ...)
   test('contact overlay opens and displays info', ...)
   test('reduced motion stops animations', ...)
   test('all external links have target blank and rel noopener', ...)
   ```

2. **Visual regression testing**:
   - Playwright screenshots at all major breakpoints
   - Screenshots of each panel/overlay
   - Compare before and after any changes
   - Test in Chrome, Firefox, Safari (WebKit)

3. **Cross-browser testing**:
   - Chrome (primary)
   - Firefox (verify WebGL shaders work)
   - Safari (verify WebGL compatibility, test on WebKit via Playwright)
   - Edge (should match Chrome)
   - Mobile Safari (iOS)
   - Chrome Android

4. **Bug fix pass**:
   - Address all issues found in testing
   - Fix any visual inconsistencies across browsers
   - Fix any performance issues found in specific browsers
   - Fix any edge cases (empty data, missing fields, etc.)

5. **Final polish checklist**:
   - [ ] All placeholder data replaced with real data (or clear instructions for the user)
   - [ ] All links work
   - [ ] Favicon and app icons set (space-themed)
   - [ ] Open Graph image created (screenshot of solar system)
   - [ ] 404 page created (space-themed "lost in space" page)
   - [ ] Console is clean (no errors, no debug logs)
   - [ ] All `TODO` comments resolved
   - [ ] Code is clean and well-commented
   - [ ] README.md with setup instructions

6. **Deployment to Vercel**:
   ```bash
   # Connect GitHub repo to Vercel
   # Configure:
   # - Framework: Next.js
   # - Build command: next build
   # - Output directory: .next
   # - Environment variables (if any)
   # Deploy
   ```
   - Set up custom domain (if available)
   - Enable Vercel Analytics
   - Enable Vercel Speed Insights
   - Verify deployment works correctly

7. **Post-deployment verification**:
   - Test deployed URL on multiple devices
   - Verify all features work in production
   - Run Lighthouse on production URL
   - Test social media share preview (Open Graph)
   - Verify SSL certificate is active
   - Test loading time from different geographic locations

8. **Documentation**:
   - `README.md` with:
     - Project description
     - Setup instructions
     - How to add new projects
     - How to customize profile data
     - How to add new celestial object types
     - Architecture overview
     - Deployment instructions
   - Inline code documentation for complex logic (shaders, orbital math, animations)

### Testing Criteria
- [ ] All E2E tests pass
- [ ] Visual regression: no unexpected visual changes
- [ ] Works in Chrome, Firefox, Safari, Edge
- [ ] Works on iOS Safari and Chrome Android
- [ ] No console errors in production
- [ ] Lighthouse performance ≥ 80
- [ ] Lighthouse accessibility ≥ 90
- [ ] Lighthouse best practices ≥ 90
- [ ] Lighthouse SEO ≥ 90
- [ ] Deployed URL loads in < 3 seconds
- [ ] All social preview cards render correctly
- [ ] 404 page works
- [ ] README is complete and clear
- [ ] **Final screenshot**: Production homepage (desktop)
- [ ] **Final screenshot**: Production homepage (mobile)
- [ ] **Final screenshot**: Production project detail
- [ ] **Final screenshot**: Production profile card

---

## Appendix A: Data-Driven Architecture

### How to Add a New Project
Simply add an entry to `src/data/projects.ts`:
```typescript
{
  id: 'new-project',
  title: 'My New Project',
  description: 'Short description',
  longDescription: 'Detailed description...',
  role: 'Developer',
  features: ['Feature 1', 'Feature 2'],
  technologies: ['react', 'nodejs', 'mongodb'],
  liveUrl: 'https://example.com',
  sourceUrl: 'https://github.com/...',
  color: '#FF6B6B',
  size: 0.8,
  orbitRadius: 20,
  orbitSpeed: 0.3,
}
```
The new planet and its satellites will automatically appear.

### How to Add a New Section Type
1. Create a new celestial object type in `types/index.ts`
2. Create the 3D component in `components/canvas/`
3. Create the overlay UI in `components/ui/`
4. Add to navigation
5. Add data to `data/` folder

### Suggested Future Celestial Objects
| Section | Celestial Object | Description |
|---------|-----------------|-------------|
| Skills | Asteroid Belt | Ring of categorized skill asteroids between projects |
| Blog | Comet | Animated comet that cycles through, clicking shows latest post |
| Experience | Space Station | Orbital station representing work experience |
| Certifications | Stars/Constellation | Group of stars forming a constellation |
| Achievements | Nebula | Colorful cloud formation representing achievements |
| Testimonials | Alien Signals | Pulsing communication signals from distant sources |

---

## Appendix B: Visual Design Tokens

```css
/* Color Palette */
--cosmic-black: #050510;
--deep-space: #0a0a1a;
--nebula-purple: #1a0533;
--nebula-blue: #0a1628;
--star-gold: #FDB813;
--star-white: #FFF5E0;
--orbit-gray: rgba(255, 255, 255, 0.08);
--orbit-highlight: rgba(255, 255, 255, 0.25);
--glass-bg: rgba(10, 10, 30, 0.6);
--glass-border: rgba(255, 255, 255, 0.1);
--accent-glow: 0 0 20px rgba(253, 184, 19, 0.3);

/* Typography */
--font-display: 'Space Grotesk', sans-serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Spacing Scale */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;

/* Animation Timing */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 600ms;
--duration-glacial: 1200ms;
```

---

## Appendix C: File Dependency Graph

```
page.tsx
├── LoadingScreen.tsx
├── Scene.tsx (dynamic import, ssr: false)
│   ├── Starfield.tsx
│   ├── Star.tsx
│   │   └── StarLabel.tsx
│   ├── PlanetSystem.tsx
│   │   └── Planet.tsx (×N from data)
│   │       ├── PlanetLabel.tsx
│   │       └── SatelliteSystem.tsx
│   │           └── Satellite.tsx (×M from technologies)
│   ├── OrbitRing.tsx (×N)
│   ├── CameraController.tsx
│   └── PostProcessing.tsx
├── HUD.tsx
├── Navigation.tsx
├── ProfileCard.tsx
├── ProjectPanel.tsx
├── ContactOverlay.tsx
├── AboutOverlay.tsx
├── SettingsToggle.tsx
├── AccessibilityBar.tsx
└── MobileView.tsx (conditional)
    └── ProjectCard.tsx (×N)
