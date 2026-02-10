# FODDER

**The Premium Feed — A Chrome extension that scores YouTube videos 0-100 to surface expert content and filter AI slop.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://chrome.google.com/)
[![Version](https://img.shields.io/badge/version-4.0.0-30D158.svg)](https://github.com/yourusername/fodder)

<p align="center">
  <img src="fodderBanner.png" alt="FODDER Banner" />
  <strong>Clinical analysis of YouTube content with luxury aesthetics.</strong><br>
  Using serious mathematics to rate internet slop with Apple Modern design.
</p>

---

## 🎯 What Is FODDER?

FODDER analyzes YouTube videos using advanced statistical models and presents findings through a **clinical, satirical lens** with **premium Apple Modern UI**.

### The "Sommelier" Tier System

- 🟡 **ORGANIC (70-100)** — "Pure." Free-range content. Safe for consumption.
- 🟠 **FILLER (40-69)** — "Processed." Contains additives. Caloric but empty.
- 🔴 **SYNTHETIC (0-39)** — "Bio-Hazard." AI slurry detected. DO NOT CONSUME.

---

## 🚀 Quick Start

### Installation

1. **Clone this repository:**
   ```bash
   git clone https://github.com/yourusername/fodder.git
   cd fodder
   ```

2. **Load in Chrome:**
   - Navigate to `chrome://extensions/`
   - Enable **Developer Mode**
   - Click **Load unpacked**
   - Select the `fodder` directory

3. **Visit YouTube** — FODDER pill appears next to video metadata

### How to Use

1. **The Pill** appears inline with video view count/date
2. **Click the pill** to reveal The Bento Box
3. **Hover metrics** to see detailed breakdowns
4. **Thumbnail badges** show scores on all videos in feeds

---

## 📐 Design Philosophy

**Apple Modern x Clinical Satire**

### Visual Identity
- **Glassmorphism:** Frosted backgrounds with blur(20px) + saturate(180%)
- **Squircles:** 18px border radius everywhere (no sharp corners)
- **iOS Colors:** System palette (#30D158, #FF9F0A, #FF375F)
- **SF Pro Typography:** -apple-system font stack
- **Spring Physics:** cubic-bezier(0.25, 1, 0.5, 1) animations

### Anti-Patterns (What FODDER Is NOT)
- ❌ Hacker/terminal aesthetics
- ❌ Gaming/Web3 gradients
- ❌ Microsoft corporate UI
- ❌ Sharp corners or flat backgrounds

---

## 🧮 The Scoring Model

### Formula
```
composite = 0.45·Approval + 0.25·Velocity + 0.15·Integrity + 0.10·Volume - 0.025·Clickbait
score = composite × decay × 100
```

### Components

#### Approval DNA (45% weight)
Bayesian like/dislike ratio calibrated to YouTube's 92-98% distribution.
- **92%** → 0% credit (bottom 15% of content)
- **95%** → 50% credit (median)
- **98%+** → 100% credit (top tier)

#### Engagement Velocity (25% weight)
View/subscriber ratio + engagement rate per day + recency bonus.
- Videos <7 days old get up to **+20% boost**
- Penalizes subscriber churn (mega channels with low views)

#### Integrity Index (15% weight)
Interaction density catches bot views and passive slop.
- **3%+ interaction rate** → full credit
- Hard floor at **0.1%** for extreme cases

#### Volume Magnitude (10% weight)
Absolute engagement scale (favors 10k likes over 100 likes).
- **100 likes** → ~40% volume credit
- **1,000 likes** → ~75%
- **10,000+ likes** → ~100%

#### Clickbait Penalty (2.5% weight)
Title heuristic (CAPS, keywords, emoji spam).
- Max penalty: **-2.5 points**

---

## 🎨 Component Showcase

### Component A: The Pill
**Small inline badge next to video metadata**

```
┌──────────────────┐
│  🟡  ORGANIC     │  ← Click to expand Bento
└──────────────────┘
```

- Glassmorphic background
- SVG food icon (Truffle/Corn/Cube)
- Spring animation on hover
- Toggles Bento Box on click

### Component B: The Bento Box
**Detailed popover with CSS Grid layout**

```
┌─────────────────────────────┐
│ FODDER       │ Pure.        │
├─────────────────────────────┤
│         85                  │
│    HUMANITY SCORE           │
├──────────────┬──────────────┤
│ APPROVAL DNA │ ENG. VELOCITY│
│     92%      │     76%      │
├──────────────┼──────────────┤
│ VOLUME MAG.  │ INTEGRITY    │
│     88%      │     95%      │
└─────────────────────────────┘
```

- **Negative metrics** highlighted in red (#FF375F)
- Clinical labels (not technical jargon)
- Frosted glass with spring slide-in

### Component C: Mini-Badges
**Thumbnail overlays on all video cards**

```
┌─────────────┐
│ 🟡 85       │  ← Top-left corner
│             │
│  [Thumbnail]│
└─────────────┘
```

- Squircle shape (12px radius)
- Tier-colored border
- `~` prefix for low confidence

---

## 🔧 Configuration

All constants in `content_script.js`:

```javascript
const CONFIG = {
  TIER_ORGANIC: 70,    // "Pure"
  TIER_FILLER: 40,     // "Processed"
  // Below 40 = "Bio-Hazard"
};

const WEIGHTS = {
  approval: 0.45,
  velocity: 0.25,
  integrity: 0.15,
  volume: 0.10,
  clickbait: 0.025,
};
```

### Customization Examples

**Stricter quality filter:**
```javascript
CONFIG.TIER_ORGANIC = 80;
CONFIG.TIER_FILLER = 55;
```

**Favor viral breakouts:**
```javascript
WEIGHTS.velocity = 0.35;
WEIGHTS.approval = 0.35;
```

---

## 📊 The "Sommelier" Voice

FODDER uses clinical, deadpan language to describe internet content:

### Organic (70-100)
**Verdict:** "Pure."  
**Detail:** "Free-range content detected. Safe for consumption."  
**Tone:** Approving but sterile

### Filler (40-69)
**Verdict:** "Processed."  
**Detail:** "Contains additives and preservatives. Caloric but empty."  
**Tone:** Neutral, matter-of-fact

### Synthetic (0-39)
**Verdict:** "Bio-Hazard."  
**Detail:** "High levels of AI slurry detected. Thumbnail DNA does not match content."  
**Warning:** "Recommended handling: DO NOT CONSUME."  
**Tone:** Urgent but deadpan

---

## 🛠️ Architecture

### File Structure
```
fodder/
├── manifest.json          # Manifest V3 config
├── background.js          # Service worker (RYD API + channel data)
├── content_script.js      # Scoring engine + UI injection
├── styles.css             # Glassmorphism + tier styling
├── icon48.png             # Extension icon (48x48)
├── icon128.png            # Extension icon (128x128)
└── FODDER_BRAND_GUIDE.md  # Complete design system
```

### Data Flow
```
YouTube DOM
    ↓
Extract: videoId, channelHandle, daysOld, title
    ↓
background.js → RYD API (likes, dislikes, views)
              → Channel page (subscribers)
    ↓
content_script.js → computeScore()
    ↓
Inject: Pill + Bento + Mini-badges
```

### APIs Used
- **Return YouTube Dislike:** Like/dislike data
- **YouTube Channel Pages:** Subscriber counts (HTML scraping)

---

## 🎭 Brand Guidelines

### Color Palette
```css
Organic:   #30D158  /* iOS Green */
Filler:    #FF9F0A  /* Marigold */
Synthetic: #FF375F  /* Pink Slime */

Background: rgba(28, 28, 30, 0.75)  /* Glass */
Text:       #F5F5F7  /* Off-white */
Secondary:  #86868B  /* Metallic gray */
```

### Typography
```css
Font: -apple-system, SF Pro Display
Weights: 700 (bold), 600 (semi-bold), 400 (regular)
Labels: UPPERCASE, 0.08em tracking
Numbers: tabular-nums variant
```

### Geometry
```css
Border Radius: 18px (squircles)
Glassmorphism: blur(20px) saturate(180%)
Animation: cubic-bezier(0.25, 1, 0.5, 1)
```

See `FODDER_BRAND_GUIDE.md` for complete design system.

---

## 📈 Roadmap

### v4.1 (Planned)
- [ ] Light mode color scheme
- [ ] Settings UI with weight sliders
- [ ] Export score cards as images
- [ ] Channel aggregate scoring

### v4.2 (Future)
- [ ] Browser action popup dashboard
- [ ] Historical score tracking
- [ ] Category-aware decay (news vs tutorials)
- [ ] Machine learning calibration

### v5.0 (Vision)
- [ ] Firefox extension
- [ ] Cross-platform (Twitch, TikTok)
- [ ] API for external integrations
- [ ] "FODDER Premium" subscription tier

---

## 🐛 Known Issues

1. **YouTube DOM changes** — Selectors may need updates
2. **RYD data estimated** — Dislikes extrapolated from extension userbase
3. **Pill positioning** — May shift on some YouTube layouts
4. **Glassmorphism performance** — Can stutter on low-end devices

---

## 🤝 Contributing

We welcome contributions that maintain FODDER's design integrity:

### Design Contributions
- Must follow Apple Modern aesthetic
- No sharp corners, flat backgrounds, or bright gradients
- Use iOS system colors only
- Spring physics for all animations

### Code Contributions
- Maintain glassmorphism effects
- Use CSS custom properties
- Follow existing naming conventions (fodder-*)
- Test on multiple YouTube layouts

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

**Attribution Required:**
- Return YouTube Dislike API
- Apple Human Interface Guidelines (design inspiration)

---

## 🙏 Credits

**Design System:** Apple Human Interface Guidelines  
**Color Palette:** iOS 15 System Colors  
**Typography:** San Francisco  
**Glassmorphism:** iOS Control Center  
**Metaphor:** Michelin Guide + FDA Warning Labels  

Built for researchers, educators, and anyone who demands better from their feed.

---

<p align="center">
  <strong>FODDER v4.0 — "Cupertino Clean. Condé Nast Critical."</strong><br>
  If this extension improves your feed, consider starring ⭐ the repo.
</p>
