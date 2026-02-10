# FODDER — Brand Identity & Implementation Guide

**"The Premium Feed" — A Michelin Guide for Internet Garbage**

---

## Executive Summary

FODDER transforms The Utility Filter from a technical tool into a luxury experience. It analyzes YouTube content using serious mathematics but presents findings through a clinical, satirical lens with Apple Modern aesthetics.

**Core Philosophy:** Cupertino Clean meets Condé Nast Critical.

---

## 1. Visual Identity

### Brand Positioning
- **Product Name:** FODDER
- **Tagline:** The Premium Feed
- **Metaphor:** "Michelin Guide for Internet Garbage"
- **Tone:** Clinical Satire — Serious analysis, absurd presentation

### Design Language
**Apple Modern x Surgical Precision**
- Frosted glass (glassmorphism)
- Super-ellipses (squircles, 18px radius)
- High-definition sterility
- Spring physics animations
- San Francisco / SF Pro typography

### Anti-Patterns (DO NOT)
- ❌ Hacker/terminal aesthetics
- ❌ Sharp corners or flat backgrounds
- ❌ Microsoft corporate UI
- ❌ Bright neon colors
- ❌ Gaming/Web3 gradients

---

## 2. Color System

### Background (Glass)
```css
--fodder-bg-glass: rgba(28, 28, 30, 0.75);        /* Dark mode base */
--fodder-bg-glass-light: rgba(255, 255, 255, 0.65); /* Light mode */
```

### Typography
```css
--fodder-text-primary: #F5F5F7;    /* Off-white */
--fodder-text-secondary: #86868B;  /* Metallic gray */
--fodder-text-dark: #1D1D1F;       /* Deep gray */
```

### Tier Colors (iOS System Palette)
```css
--fodder-organic: #30D158;         /* iOS Green - Pure */
--fodder-organic-gold: #FFD60A;    /* Premium Gold accent */
--fodder-filler: #FF9F0A;          /* Marigold - Processed */
--fodder-synthetic: #FF375F;       /* Pink Slime - Bio-Hazard */
--fodder-synthetic-alt: #FF453A;   /* International Orange */
```

### Borders & Effects
```css
--fodder-border: rgba(255, 255, 255, 0.15);
--fodder-border-strong: rgba(255, 255, 255, 0.25);
```

---

## 3. Typography System

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 
             "SF Pro Display", "Inter", "Segoe UI", 
             system-ui, sans-serif;
```

### Weight Hierarchy
- **Headers:** 700 (Bold) — Brand name, verdicts
- **Metrics:** 600 (Semi-Bold) — Score numbers
- **Labels:** 600 (Semi-Bold), UPPERCASE, 0.08em tracking
- **Body:** 400 (Regular)
- **Numbers:** `font-variant-numeric: tabular-nums`

### Size Scale
- **Hero Score:** 56px
- **Pill Label:** 11px (uppercase)
- **Metric Values:** 22px
- **Metric Labels:** 10px (uppercase)

---

## 4. Geometric System

### Border Radius
```css
--fodder-radius: 18px;        /* Squircles (main elements) */
--fodder-radius-sm: 12px;     /* Metric cards */
--fodder-radius-pill: 24px;   /* Pill badges */
```

### Glassmorphism Effect
```css
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.2);
```

### Animation Curves
```css
--fodder-spring: cubic-bezier(0.25, 1, 0.5, 1);  /* Spring physics */
--fodder-ease: cubic-bezier(0.4, 0, 0.2, 1);     /* Material ease */
```

**Duration:** 300-400ms for interactions

---

## 5. Component Anatomy

### Component A: The Pill (Inline Badge)

**Purpose:** Minimalist indicator next to video metadata

**Specs:**
- Padding: 6px 14px
- Height: Auto-fit (inline-flex)
- Gap: 6px
- Icon: 16x16px SVG
- Label: 11px, 600 weight, uppercase, 0.08em tracking

**States:**
1. Default: Glass background, subtle border
2. Hover: Scale 1.02, lift -1px, stronger shadow
3. Active: Darker background (85% opacity), Bento visible
4. Loading: Spinning icon, "ANALYZING" label

**Behavior:**
- Click toggles Bento Box
- Hover preview via transform
- Spring animation on load

---

### Component B: The Bento Box (Detailed Popover)

**Purpose:** Clinical breakdown with CSS Grid layout

**Layout:** 2-column grid (mobile: 1-column)

**Structure:**
```
┌─────────────────────────────┐
│ FODDER       │ Pure.        │ ← Header
├─────────────────────────────┤
│         85                  │ ← Main Score
│    HUMANITY SCORE           │
├──────────────┬──────────────┤
│ APPROVAL DNA │ ENG. VELOCITY│ ← Metrics Row 1
├──────────────┼──────────────┤
│ VOLUME MAG.  │ INTEGRITY    │ ← Metrics Row 2
├─────────────────────────────┤
│ Warning: DO NOT CONSUME     │ ← Footer (synthetic only)
└─────────────────────────────┘
```

**Metrics Cell:**
- Label: 10px uppercase gray
- Value: 22px bold, colored if negative
- Detail: 11px secondary text

**Animation:**
- Slide-in from top (-8px)
- Scale from 0.98 to 1.0
- 350ms spring curve
- Backdrop blur intensifies on open

---

### Component C: Mini-Badges (Thumbnails)

**Purpose:** Overlay score on video thumbnails

**Specs:**
- Position: Absolute top-left (8px offset)
- Padding: 5px 11px
- Font: 13px bold, tabular nums
- Border: 1px solid tier color
- Glass background

**Tier Styling:**
- Organic: Green border + text
- Filler: Orange border + text
- Synthetic: Pink border + text

**Low Confidence:**
- Opacity: 0.7
- Prefix: `~` before score

---

## 6. Iconography (SVG Food Metaphors)

### The Golden Truffle (Organic)
**Represents:** Pure, free-range content
**Shape:** Lumpy mushroom with stem
**Color:** #FFD60A (iOS Gold)
**Details:** Spots for texture, organic irregularity

### The Corn Cob (Filler)
**Represents:** Processed, mass-produced feed
**Shape:** Gridded cylinder
**Color:** #FF9F0A (Marigold)
**Details:** Vertical + horizontal lines, husk at top

### The Cube (Synthetic)
**Represents:** Bio-hazard AI slurry
**Shape:** Isometric cube (sharp, unnatural)
**Color:** #FF375F (Pink Slime)
**Details:** Hard edges, meat-block aesthetic

---

## 7. Copywriting ("Sommelier" Tone)

### Tier Messaging

#### Organic (70-100)
**Verdict:** "Pure."
**Badge:** "ORGANIC"
**Detail:** "Free-range content detected. Safe for consumption."
**Voice:** Approving but clinical

#### Filler (40-69)
**Verdict:** "Processed."
**Badge:** "FILLER"
**Detail:** "Contains additives and preservatives. Caloric but empty."
**Voice:** Neutral, matter-of-fact

#### Synthetic (0-39)
**Verdict:** "Bio-Hazard."
**Badge:** "SYNTHETIC"
**Detail:** "High levels of AI slurry detected. Thumbnail DNA does not match content."
**Warning:** "DO NOT CONSUME."
**Voice:** Urgent but deadpan

### Label Terminology
- "Humanity Score" (not "Utility Score")
- "Approval DNA" (not "Like Ratio")
- "Engagement Velocity" (not "V/S Ratio")
- "Volume Magnitude" (not "Like Count")
- "Integrity Index" (not "Interaction Rate")

---

## 8. Interaction Patterns

### Micro-Interactions

**Pill Hover:**
```
Initial → Scale 1.0, Y 0
Hover  → Scale 1.02, Y -1px
Timing → 300ms spring
```

**Bento Toggle:**
```
Closed → display: none
Open   → display: grid, slide-in animation
Click  → Toggle + pill background change
```

**Metric Highlighting:**
- Negative factors: #FF375F (red)
- Positive factors: Default color
- Threshold: <30% = negative

### Loading States

**Watch Page:**
1. Pill appears with spinning icon
2. "ANALYZING" label
3. 1.5s delay minimum
4. Pop animation on score reveal

**Thumbnails:**
- Silent background scoring
- Badge fades in after score computed
- No loading indicator (async)

---

## 9. Technical Implementation

### CSS Variables Integration
All colors, spacing, and effects use CSS custom properties for easy theming:
```css
:root {
  --fodder-organic: #30D158;
  --fodder-radius: 18px;
  --fodder-spring: cubic-bezier(0.25, 1, 0.5, 1);
}
```

### DOM Injection Strategy
1. **Pill:** Appended to `#info-strings` or video metadata row
2. **Bento:** Child of pill (absolute positioned)
3. **Mini-badges:** Absolute within `#thumbnail` container

### Browser Compatibility
- Backdrop-filter: Webkit prefix required
- CSS Grid: Modern browsers only (Chrome 57+)
- SVG: Inline for control and styling

---

## 10. Quality Checklist

Before releasing:
- [ ] All tier colors use iOS system palette
- [ ] Border radius = 18px (squircles, not circles)
- [ ] Typography uses SF Pro / system stack
- [ ] Glassmorphism includes saturate(180%)
- [ ] Animations use spring curve (0.25, 1, 0.5, 1)
- [ ] Labels are UPPERCASE with 0.08em tracking
- [ ] No sharp corners anywhere
- [ ] Negative metrics highlighted in red
- [ ] Pill integrates seamlessly into YouTube DOM
- [ ] Bento Box uses CSS Grid
- [ ] SVG icons render crisp at all sizes

---

## 11. Future Enhancements

### Phase 2
- Light mode color scheme
- Customizable tier thresholds
- Export/share score cards
- Aggregated channel scoring

### Phase 3
- Browser action popup dashboard
- Historical score tracking
- Category-specific analysis
- A/B testing UI

---

## Credits

**Design System:** Apple Human Interface Guidelines  
**Color Palette:** iOS 15 System Colors  
**Typography:** San Francisco (system default)  
**Glassmorphism:** iOS Control Center  
**Metaphor:** Michelin Guide + FDA Warning Labels  

---

**FODDER v4.0**  
*"Cupertino Clean. Condé Nast Critical."*
