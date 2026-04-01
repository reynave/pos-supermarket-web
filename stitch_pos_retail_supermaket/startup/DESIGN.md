# Design System Document: The Precision Merchant

## 1. Overview & Creative North Star
**The Creative North Star: "The Digital Concierge"**
In a high-speed retail environment, the interface must not just be a tool, but a sophisticated assistant. This design system moves away from the "industrial calculator" look of legacy POS systems and adopts an editorial, high-end retail aesthetic. We achieve this through **Aerated Minimalism**—using generous white space and tonal shifts rather than harsh lines to organize complex data. The goal is to reduce cognitive load for the cashier while maintaining a premium brand experience for the customer facing the screen.

The layout rejects traditional rigid grids in favor of **Intentional Asymmetry**. Primary action zones (like the "Pay" button or "Total") are elevated through scale and tonal depth, while utility functions are nested within subtle surface shifts.

---

## 2. Colors
Our palette is anchored by a "Professional Blue" that signifies trust and stability, layered over a sophisticated range of architectural greys.

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited for sectioning.** To define boundaries, use background color shifts. For example, a receipt list should sit on `surface_container_low`, while the main workspace remains on `surface`. This creates "edge-less" design that feels modern and expansive.

### Surface Hierarchy & Nesting
Instead of a flat plane, treat the UI as a series of stacked premium cardstock.
*   **Base Layer:** `surface` (#f8f9fa) – The canvas.
*   **Secondary Zones (Navigation/Sidebar):** `surface_container` (#edeeef).
*   **Active Workspaces (The Cart):** `surface_container_lowest` (#ffffff) to provide a "lifted" feel against the base.
*   **Nested Elements:** Use `surface_container_high` (#e7e8e9) for subtle grouping inside a workspace.

### The "Glass & Gradient" Rule
To elevate CTAs beyond "standard blue boxes," apply a subtle linear gradient from `primary` (#0040a1) to `primary_container` (#0056d2). For floating overlays (like a "Price Check" modal), use **Glassmorphism**: a semi-transparent `surface` color with a 20px backdrop-blur. This ensures the cashier never loses context of the background transaction.

---

## 3. Typography
We utilize a dual-font strategy to balance character with extreme legibility.

*   **Display & Headlines (Manrope):** A modern geometric sans-serif used for high-impact data (Total Price, Item Count). Its wide stance ensures readability even at a distance or a glance.
*   **Body & Labels (Inter):** A high-performance typeface designed for screen clarity. It handles dense product names and technical SKU data without becoming cluttered.

**Hierarchy Strategy:**
*   **The Hero Value:** Use `display-lg` (Manrope, 3.5rem) for the "Grand Total."
*   **The Action Label:** Use `title-lg` (Inter, 1.375rem) for button text to ensure touch-target confidence.
*   **The Metadata:** Use `label-sm` (Inter, 0.6875rem) in `on_surface_variant` for secondary details like tax breakdowns or loyalty points.

---

## 4. Elevation & Depth
Depth in this system is a product of **Tonal Layering**, not heavy drop shadows.

*   **The Layering Principle:** Achieve "lift" by placing a `surface_container_lowest` card atop a `surface_container_low` background. This creates a soft, natural separation.
*   **Ambient Shadows:** For critical floating elements (Modals or "Void" confirmations), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(25, 28, 29, 0.06)`. This mimics soft gallery lighting rather than harsh digital shadows.
*   **The Ghost Border Fallback:** If a divider is required for accessibility in dense lists, use `outline_variant` (#c3c6d6) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons (High-Speed Touch Optimized)
*   **Primary (Pay/Confirm):** Uses the `primary` to `primary_container` gradient. Large internal padding (spacing scale `6`). Corner radius: `lg` (0.5rem).
*   **Secondary (Add Item/Discount):** `secondary_container` background with `on_secondary_container` text.
*   **Tertiary (Void/Cancel):** Transparent background with `outline` ghost borders (20% opacity).

### Product Cards & Cart Lists
*   **Forbidden:** Dividers between items.
*   **Required:** Use a spacing scale of `3` (1rem) between items. The active item being scanned should transition its background to `primary_fixed` (#dae2ff) to provide an unmistakable visual anchor.

### Numeric Keypad
*   **Styling:** Keys should be `surface_container_highest` with `title-lg` typography.
*   **Interaction:** On-press, keys shift to `secondary_fixed_dim` for haptic visual feedback.

### Status Chips
*   **Inventory/Stock:** Use `tertiary_container` for "Low Stock" alerts. The burnt-orange tone provides an urgent contrast to the blue primary theme without the "alarmism" of pure red.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `surface_bright` to highlight the most important "Next Step" in a workflow.
*   **Do** leverage the spacing scale `10` (3.5rem) for bottom-of-screen margins to ensure the cashier's hand doesn't obscure content.
*   **Do** use `headline-sm` for product titles in the cart to ensure they are readable in a fast-moving environment.

### Don't
*   **Don't** use black (#000000). Use `on_surface` (#191c1d) for text to maintain a premium, softer contrast.
*   **Don't** use `rounded-none`. Everything in a retail environment should feel approachable; use at least `DEFAULT` (0.25rem) rounding.
*   **Don't** stack more than three levels of surface nesting. If you need a fourth, use a "Glass" overlay.
*   **Don't** use 100% opaque borders. They clutter the UI and create "visual noise" that slows down high-speed operators.