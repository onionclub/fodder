# CHANGELOG

All notable changes to the **FODDER** extension will be documented in this file.

## [3.0.0] — The Lumina Update (2026-02-11)

### Added
* **Adaptive Theme Engine**: Real-time synchronization with YouTube’s internal theme (Dark/Light).
* **Independent Weighted Analysis**: Metrics (DNA, VEL, INT) are now evaluated independently against their specific weights to trigger impact-based "Health Glows."
* **Floating Edge Dock**: A borderless icon housing that docks to the left of the score pill, allowing for larger, high-definition floating icons.
* **Lumina Mini-Badges**: Redesigned thumbnail scores for Light Mode featuring high-transparency white backgrounds and deep-contrast charcoal text.
* **Ghost Watermarks**: Integrated large, 25% opacity background watermark icons in the Bento box for immediate tier recognition.
* **Positive Health Glow**: A vibrant green highlight specifically for peak signals hitting 95% or higher.
* **Dual-Icon Support**: Dedicated icon sets for both Dark and Light themes to ensure maximum clarity on any background.

### Changed
* **Scoring Logic**: Re-engineered the composite formula weights: 45% Approval (DNA), 25% Velocity (VEL), 20% Integrity (INT), and 10% Volume.
* **Lumina Typography**: Bumped mini-badge text on video listings to weight 900 (Extra Bold) with a 10% shadow edge for improved legibility.
* **Light Mode Aesthetics**: Implemented a "frosted glass" white base for the Bento box with adaptive colored glows.
* **Pill Definition**: Added a subtle edge shadow to the Score Pill in Light Mode (80% strength of the icon shadow) for better depth.

### Fixed
* **Double-Injection Bug**: Strictly implemented an `activePills` ID registry to eliminate duplicate UI elements during rapid navigation.
* **Navigation Refresh**: Fixed an issue where channel filters (Popular, Newest) failed to update scores without a full page reload.
* **Stability Fix**: Eliminated infinite loop crash risks by transitioning to a targeted HTML attribute observer for theme syncing.
* **Context Invalidation**: Resolved "Extension context invalidated" errors by implementing a safe-messaging API wrapper.

### Removed
* **Legacy Assets**: Deprecated and removed low-resolution icon files (`icon48.png`, `icon128.png`) in favor of the high-definition floating dock system.

---

## [2.0.0] — Tactical Refactor
* **Modular Architecture**: Rebuilt background and content scripts for better reliability.
* **Bento Box v1**: Initial implementation of the detailed popover breakdown.

## [1.5.0] — Foundation
* **Initial Pill Injection**: First stable version of the inline score pill next to video metadata.
