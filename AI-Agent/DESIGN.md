# POS Supermarket Web — Frontend Design Document

> Comprehensive design reference for the Angular 18.x POS Supermarket frontend.
> Generated from UI mockups created with Google Stitch (stitch.withgoogle.com).

---

## 1. Overview

This is the **frontend SPA** for the POS Supermarket system. It runs on physical POS terminal machines (touchscreen monitors) in a retail/supermarket environment — **not** desktop/mobile responsive web. The UI is optimized for **1024×768** or **1920×1080** fixed-ratio touchscreen displays.

### Target Users
| Role | Access |
|------|--------|
| **Cashier** | Login, daily start, sales register, payment, daily close |
| **Supervisor** | All cashier functions + void authorization, price override, refund, reports |

### Communication
- **REST API** → `http://localhost:3000/api/*` (backend: `pos-supermarket/`)
- **Socket.IO** → real-time mirror screen for customer-facing display
- **Auth** → JWT Bearer token in `Authorization` header

---

## 2. Design Philosophy

Based on the **"Digital Concierge"** concept from the Velocity Retail design system:

- **Aerated Minimalism** — generous white space, tonal shifts instead of harsh borders
- **No-Line Rule** — avoid 1px borders for sections; use background color shifts to define zones
- **Intentional Asymmetry** — primary action zones (Pay, Total) elevated through scale and tonal depth
- **Touch-First** — all interactive elements minimum 48px touch target, large CTAs (h-20)
- **Speed-Oriented** — cashiers process 20+ transactions/hour; every tap counts

---

## 3. Color System

### Dual Theme (chosen from stitch mockups)

The mockups use two distinct color themes. The project will unify them:

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#ec5b13` | Main brand orange — header, CTAs, active states, main register |
| `primary-light` | `#ff8a50` | Hover/lighter variant |
| `accent-blue` | `#2563eb` | Secondary actions, links, payment-related UI, info badges |
| `brand-navy` | `#0a192f` | Customer-facing display dark background, sidebar |
| `background-light` | `#f8f6f6` | App background (light mode) |
| `background-dark` | `#221610` | App background (dark mode) |
| `surface` | `#ffffff` | Card backgrounds, panels |
| `surface-container` | `#f1f5f9` | Secondary zones (slate-100) |
| `surface-container-high` | `#e2e8f0` | Nested elements (slate-200) |
| `on-surface` | `#191c1d` | Primary text (never use #000000) |
| `on-surface-variant` | `#64748b` | Secondary text (slate-500) |
| `success` | `#16a34a` | Paid, online, confirmed |
| `warning` | `#f59e0b` | Pending, low stock |
| `error` | `#dc2626` | Void, cancel, shortage, refund |
| `error-container` | `#fef2f2` | Error background |

### Surface Hierarchy (layer stacking)
```
Base canvas         → background-light (#f8f6f6)
  Secondary zones   → surface-container (#f1f5f9)  e.g. sidebar, table header
    Active panels   → surface (#ffffff)             e.g. cart panel, card
      Nested items  → surface-container-high        e.g. input fields, keypad keys
```

### Payment Badge Colors
| Payment Method | Background | Text |
|---------------|------------|------|
| CASH | `bg-blue-100` | `text-blue-700` |
| QRIS | `bg-purple-100` | `text-purple-700` |
| CARD (Debit/Credit) | `bg-emerald-100` | `text-emerald-700` |
| DIGITAL WALLET | `bg-amber-100` | `text-amber-700` |

---

## 4. Typography

| Role | Font | Weight | Size | Usage |
|------|------|--------|------|-------|
| Display / Hero | Public Sans | 900 (Black) | 3.5rem–5rem | Grand Total on customer display |
| Headline | Public Sans | 700–800 | 1.5rem–2.5rem | Page titles, section headers |
| Title | Public Sans | 600–700 | 1.125rem–1.375rem | Button text, card titles |
| Body | Public Sans | 400–500 | 0.875rem–1rem | Product names, descriptions |
| Label | Public Sans | 600–700 | 0.6875rem–0.75rem | Form labels, uppercase tracking |
| Mono / Receipt | Monospace (system) | 400 | 0.875rem | Receipt preview, keypad display |

### Typography Rules
- All uppercase labels use `uppercase tracking-widest text-xs font-bold`
- Hero values (Total, Amount Due) use `text-4xl` to `text-8xl font-black`
- Never use `#000000` for text — use `#191c1d` (`on-surface`)
- Tab bar labels use `text-sm font-semibold`

---

## 5. Icons

### Material Symbols Outlined (Google Fonts)

Import via `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
```

Usage in Angular templates:
```html
<span class="material-symbols-outlined">icon_name</span>
```

### Icon Inventory by Module

**Login & Auth:**
`storefront`, `badge`, `lock`, `visibility`, `login`, `logout`

**Navigation & Menu:**
`shopping_cart`, `shopping_basket`, `point_of_sale`, `inventory_2`, `assessment`, `search`, `card_membership`, `tune`, `settings`, `notifications`, `help`, `menu`, `close`

**Sales Register:**
`sell`, `person_search`, `grid_view`, `view_list`, `delete_forever`, `pause_circle`, `payments`

**Payment:**
`credit_card`, `contactless`, `qr_code_2`, `wallet`, `account_balance`, `payments`, `check_circle`

**Daily Operations:**
`lock_open`, `play_circle`, `analytics`, `warning`, `verified_user`, `cloud_done`, `print`

**Transaction / Receipt:**
`receipt_long`, `share`, `mail`, `account_circle`, `call_split`, `assignment_return`, `local_mall`, `visibility`

**Customer Display:**
`favorite`, `stars`, `add_circle`, `celebration`, `schedule`, `confirmation_number`

**System Status:**
`wifi`, `print`, `qr_code_scanner`, `settings_remote`, `update`, `battery_full`

---

## 6. Component Library

### 6.1 Numeric Keypad
Used in: Daily Start, Payment Cash Entry, POS Interface

```
Layout:     3×4 grid (1-9, dot, 0, backspace) or 3×4 grid (1-9, 0, 00, backspace)
Key size:   h-16 to h-20, aspect-square on mobile
Font:       text-2xl font-bold
Background: surface-container-high (slate-200)
Hover:      bg-slate-300
Active:     scale-95 transition
Special:    CLR key → red text, Backspace → icon button
```

### 6.2 Buttons

| Type | Style | Usage |
|------|-------|-------|
| Primary CTA | `bg-primary text-white h-20 rounded-2xl font-bold text-2xl shadow-lg` | PAY NOW, START SHIFT, Complete Payment |
| Secondary CTA | `bg-accent-blue text-white h-16 rounded-xl font-bold` | OPEN DRAWER, Confirm Payment |
| Danger | `bg-error text-white` or `bg-error-container text-error` | VOID, CANCEL, Refund |
| Warning | `bg-amber-500 text-white` | SUSPEND BILL |
| Ghost | `bg-transparent border border-slate-200 hover:bg-slate-50` | Cancel, secondary actions |
| Icon Button | `p-2 rounded-xl bg-slate-100 hover:bg-slate-200` | Settings, Help, Grid toggle |

### 6.3 Input Fields
```
Height:      h-16 (large POS inputs)
Padding:     pl-14 pr-5 (with left icon)
Background:  bg-slate-50 dark:bg-slate-800
Border:      border-2 border-slate-100 focus:border-primary
Radius:      rounded-2xl
Font:        text-xl font-medium
Focus ring:  focus:ring-4 focus:ring-primary/10
Icon:        absolute left positioned, text-slate-400, focus:text-primary
```

### 6.4 Cards

| Type | Style | Usage |
|------|-------|-------|
| Menu Card | `p-8 rounded-3xl bg-white hover:-translate-y-1 shadow-sm` | Main menu module selection |
| Payment Method | `p-6 rounded-xl border-2 border-transparent hover:border-primary` | Cash/Card/QR selection |
| Category Card | `relative overflow-hidden rounded-xl` + bg image + gradient overlay | Quick access product categories |
| Stat Card | `p-6 rounded-xl bg-white shadow-sm` | System summary, cash declaration |

### 6.5 Tables (Transaction List)

```
Header:     sticky top-0 bg-slate-50 uppercase text-sm font-bold tracking-wider
Rows:       divide-y divide-slate-100, hover:bg-primary/5
Active row: bg-primary/10 border-l-4 border-primary (currently scanned item)
Columns:    Item Name | Qty | Price | Total
Font:       text-lg font-bold for item names
```

### 6.6 Status Badges / Chips

```html
<!-- Payment method badge -->
<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
  CASH
</span>
```

### 6.7 Modal / Dialog

```
Overlay:    fixed inset-0 z-50 bg-black/30 backdrop-blur-sm
Container:  bg-white rounded-2xl shadow-2xl max-w-lg mx-auto
Header:     flex justify-between items-center p-6 border-b
Body:       p-6
Footer:     flex gap-4 p-6 border-t
Animation:  fade-in + zoom-in (CSS transition)
```

### 6.8 Header / Navigation Bar

```
Position:   sticky top-0 z-50
Height:     py-3 (compact) or py-4
Background: bg-white border-b border-slate-200
Left:       Brand logo icon + App name + subtitle (terminal info)
Right:      Status indicators + User avatar/name + action icons
```

### 6.9 Receipt Preview (Thermal Paper)

```
Container:  max-w-md mx-auto bg-white shadow-xl rounded-lg
Paper:      font-mono text-sm, scalloped edges (pseudo-element)
Sections:   Store header → Date/Cashier → Items → Totals → QR → Footer
Width:      ~80mm equivalent on screen
```

---

## 7. Page / Route Map

| Route | Component | Stitch Source | Description |
|-------|-----------|---------------|-------------|
| `/login` | `LoginComponent` | `pos_login_screen` | Employee ID + password login |
| `/menu` | `MainMenuComponent` | `pos_main_menu` | Module selection after login |
| `/daily-start` | `DailyStartComponent` | `pos_daily_start_dashboard` | Enter opening balance, start shift |
| `/register` | `SalesRegisterComponent` | `main_sales_register_ui` | Main POS — scan items, cart, quick access |
| `/register` (alt) | (variant/config) | `pos_interface_light_theme` | Compact register with function keys |
| `/register/pay` | `PaymentComponent` | `checkout_payment_selection` | Select payment method, enter amount |
| `/register/pay/qris` | `QrisPaymentComponent` | `qr_payment_interface` | QR code display, waiting for scan |
| `/register/pay/card` | (modal) | `checkout_modals_card_qr_select_1/2` | Credit/debit card entry |
| `/register/receipt` | (modal/overlay) | `transaction_details_receipt_preview` | Receipt preview + print/share actions |
| `/daily-close` | `DailyCloseComponent` | `pos_daily_close_dashboard` | Cash declaration, Z-report |
| `/report` | `DailyReportComponent` | `pos_daily_transaction_report` | Transaction list with filters |
| `/display` | `CustomerDisplayComponent` | `customer_facing_display_1/2` | Mirror screen (separate window/monitor) |

### Route Guards
- `/login` → public (no auth)
- `/menu`, `/daily-start`, `/daily-close`, `/report` → `authGuard` (any role)
- `/register/**` → `authGuard` + active shift required
- `/display` → separate window, receives data via Socket.IO (no auth needed)

---

## 8. Layout Architecture

### 8.1 App Shell

```
┌──────────────────────────────────────────┐
│ HeaderComponent (sticky top)             │  ← shared across all authenticated pages
│  Logo | Terminal Info | Status | User    │
├──────────────────────────────────────────┤
│                                          │
│         <router-outlet>                  │  ← page content
│                                          │
├──────────────────────────────────────────┤
│ FooterBarComponent (optional)            │  ← action buttons on register page
│  [VOID] [SUSPEND] [====PAY NOW====]     │
└──────────────────────────────────────────┘
```

### 8.2 Sales Register Layout (Split Screen)

```
┌──────────────────────────────────────────┐
│ Header (search bar + actions)            │
├────────────────┬─────────────────────────┤
│                │                         │
│  Cart Panel    │   Quick Access Grid     │
│  (40% width)   │   OR Function Keys +    │
│                │   Numeric Keypad        │
│  Item list     │   (60% width)           │
│  Subtotal      │                         │
│  Tax           │                         │
│  TOTAL         │                         │
│                │                         │
├────────────────┴─────────────────────────┤
│ [VOID ITEM] [SUSPEND BILL] [=PAY $XX=]  │
└──────────────────────────────────────────┘
```

### 8.3 Customer Display Layout (Split Screen)

```
┌────────────────────────┬─────────────────┐
│                        │                 │
│   Your Basket          │   Promo Area    │
│   (60% width)          │   (40% width)   │
│                        │                 │
│   Item list table      │   Thank You msg │
│   with qty & price     │   Subtotal/Tax  │
│                        │   Loyalty pts   │
│                        │                 │
│   Total Savings bar    │   GRAND TOTAL   │
│                        │   $XX.XX        │
└────────────────────────┴─────────────────┘
```

### 8.4 Payment Flow Layout

```
┌──────────────────────────────────────────┐
│ Header (Station + Cashier)               │
├──────────────────────┬───────────────────┤
│                      │                   │
│  Amount Due Panel    │   Cash Entry      │
│  $142.50             │   Numpad          │
│  Items: 12           │   Received: xxx   │
│                      │   Change: $x.xx   │
│  Payment Methods     │                   │
│  [Cash][Card][QR]    │   [Complete]      │
│                      │                   │
│  Quick Amounts       │                   │
│  [$150][$200][Exact] │                   │
└──────────────────────┴───────────────────┘
```

---

## 9. Angular Module / Component Structure

```
src/
├── app/
│   ├── app.component.ts              ← root component
│   ├── app.config.ts                 ← standalone app config
│   ├── app.routes.ts                 ← route definitions
│   │
│   ├── core/                         ← singleton services, guards, interceptors
│   │   ├── services/
│   │   │   ├── auth.service.ts       ← login, logout, token management
│   │   │   ├── api.service.ts        ← HTTP client wrapper
│   │   │   ├── socket.service.ts     ← Socket.IO client
│   │   │   ├── session.service.ts    ← shift / settlement state
│   │   │   └── printer.service.ts    ← ESC/POS thermal printing
│   │   ├── guards/
│   │   │   ├── auth.guard.ts         ← JWT check
│   │   │   └── shift.guard.ts        ← active shift check
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts   ← attach Bearer token
│   │   └── models/
│   │       ├── user.model.ts
│   │       ├── item.model.ts
│   │       ├── transaction.model.ts
│   │       └── payment.model.ts
│   │
│   ├── shared/                       ← reusable components, pipes, directives
│   │   ├── components/
│   │   │   ├── header/               ← top navigation bar
│   │   │   ├── numeric-keypad/       ← reusable 3×4 keypad
│   │   │   ├── status-badge/         ← payment type badges
│   │   │   ├── amount-display/       ← large formatted currency
│   │   │   ├── loading-spinner/
│   │   │   └── confirm-dialog/       ← confirmation modal
│   │   ├── pipes/
│   │   │   ├── currency-idr.pipe.ts  ← Rp 1.234.567 format
│   │   │   └── time-ago.pipe.ts
│   │   └── directives/
│   │       └── auto-focus.directive.ts
│   │
│   ├── features/                     ← lazy-loaded feature modules
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── login.component.ts|html|scss
│   │   │   └── auth.routes.ts
│   │   │
│   │   ├── menu/
│   │   │   ├── main-menu/
│   │   │   │   └── main-menu.component.ts|html|scss
│   │   │   └── menu.routes.ts
│   │   │
│   │   ├── daily-ops/
│   │   │   ├── daily-start/
│   │   │   │   └── daily-start.component.ts|html|scss
│   │   │   ├── daily-close/
│   │   │   │   └── daily-close.component.ts|html|scss
│   │   │   └── daily-ops.routes.ts
│   │   │
│   │   ├── register/
│   │   │   ├── sales-register/
│   │   │   │   └── sales-register.component.ts|html|scss
│   │   │   ├── payment/
│   │   │   │   ├── payment-selection/
│   │   │   │   │   └── payment-selection.component.ts|html|scss
│   │   │   │   ├── qris-payment/
│   │   │   │   │   └── qris-payment.component.ts|html|scss
│   │   │   │   └── card-entry-modal/
│   │   │   │       └── card-entry-modal.component.ts|html|scss
│   │   │   ├── receipt-preview/
│   │   │   │   └── receipt-preview.component.ts|html|scss
│   │   │   └── register.routes.ts
│   │   │
│   │   ├── report/
│   │   │   ├── daily-report/
│   │   │   │   └── daily-report.component.ts|html|scss
│   │   │   └── report.routes.ts
│   │   │
│   │   └── display/
│   │       ├── customer-display/
│   │       │   └── customer-display.component.ts|html|scss
│   │       └── display.routes.ts
│   │
│   └── environments/
│       ├── environment.ts
│       └── environment.prod.ts
│
├── assets/
│   └── images/
│       ├── categories/               ← product category images
│       └── logo.svg
│
├── styles.scss                       ← global styles + Tailwind imports
├── index.html
└── tailwind.config.js
```

---

## 10. Tailwind CSS Configuration

```js
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#ec5b13",
          light: "#ff8a50",
          dark: "#b34400",
        },
        "accent-blue": {
          DEFAULT: "#2563eb",
          light: "#3b82f6",
        },
        "brand-navy": "#0a192f",
        "background-light": "#f8f6f6",
        "background-dark": "#221610",
      },
      fontFamily: {
        display: ["Public Sans", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        ambient: "0 20px 40px rgba(25, 28, 29, 0.06)",
        "card-hover": "0 10px 30px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};
```

---

## 11. Key UI Patterns

### 11.1 Split Screen Layout
Most pages use a **40/60** or **60/40** horizontal split:
```html
<main class="flex-1 flex overflow-hidden">
  <section class="w-[40%] flex flex-col border-r border-slate-200">
    <!-- Cart / Info panel -->
  </section>
  <section class="w-[60%] flex flex-col">
    <!-- Action / Input panel -->
  </section>
</main>
```

### 11.2 Glass Overlay (Modals)
```html
<div class="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
  <div class="bg-white rounded-2xl shadow-ambient p-8 max-w-lg w-full">
    <!-- Modal content -->
  </div>
</div>
```

### 11.3 Pulsing Status Indicator
```html
<span class="relative flex h-3 w-3">
  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
  <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
</span>
```

### 11.4 Category Card with Image Overlay
```html
<div class="relative overflow-hidden rounded-xl aspect-[4/3] cursor-pointer group">
  <img src="..." class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform">
  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
  <span class="absolute bottom-4 left-4 text-white font-black text-xl uppercase">CATEGORY</span>
</div>
```

### 11.5 Thermal Receipt Paper Effect
```scss
.receipt-paper {
  font-family: monospace;
  max-width: 320px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  // Scalloped edge at bottom:
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    right: 0;
    height: 16px;
    background: radial-gradient(circle at 8px 0, transparent 8px, white 8px);
    background-size: 16px 16px;
  }
}
```

---

## 12. State Management

### Angular Signals (preferred for POS app)

```typescript
// Key signals in register
currentCart = signal<CartItem[]>([]);
subtotal = computed(() => this.currentCart().reduce((sum, i) => sum + i.total, 0));
tax = computed(() => this.subtotal() * 0.11);  // PPN 11%
grandTotal = computed(() => this.subtotal() + this.tax());
activeItem = signal<CartItem | null>(null);
```

### Session State (via SessionService)
```typescript
interface SessionState {
  user: User;
  terminalId: string;
  shiftId: string;
  settlementId: string;
  openingBalance: number;
  isShiftActive: boolean;
}
```

---

## 13. API Integration Points

All API calls go to `{API_BASE_URL}/api/*`:

| Feature | Method | Endpoint | Description |
|---------|--------|----------|-------------|
| Login | POST | `/api/auth/login` | `{ userId, password, terminalId }` |
| Logout | POST | `/api/auth/logout` | Invalidate session |
| Get Profile | GET | `/api/auth/me` | Current user info |
| Start Shift | POST | `/api/settlement/start` | `{ openingBalance }` |
| Close Shift | POST | `/api/settlement/close` | `{ cashDeclaration, notes }` |
| Scan Item | GET | `/api/items/barcode/:code` | Lookup by barcode |
| Search Items | GET | `/api/items/search?q=` | Text search |
| Create Transaction | POST | `/api/transactions` | Full cart + payment data |
| Void Transaction | POST | `/api/transactions/:id/void` | Requires supervisor auth |
| Get Transactions | GET | `/api/transactions?date=` | Daily transaction list |
| Payment Methods | GET | `/api/payments/types` | Available payment methods |
| QRIS Generate | POST | `/api/payments/qris/generate` | Generate QR code |
| QRIS Status | GET | `/api/payments/qris/:id/status` | Poll payment status |

### Socket.IO Events

| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `terminal:register` | Client → Server | `{ terminalId }` | Register terminal on connect |
| `cart:update` | Client → Server | `{ items, subtotal, tax, total }` | Mirror cart to customer display |
| `payment:update` | Client → Server | `{ method, amount, status }` | Mirror payment status |
| `display:greeting` | Client → Server | `{ message }` | Show promo/greeting |
| `display:clear` | Client → Server | — | Reset customer display |

---

## 14. Currency & Locale

- Currency: **IDR (Indonesian Rupiah)**
- Format: `Rp 1.234.567` (dot as thousands separator, no decimal)
- Tax: PPN 11%
- Date format: `DD/MM/YYYY HH:mm`
- Locale: `id-ID`

### Currency Pipe
```typescript
@Pipe({ name: 'idr', standalone: true })
export class CurrencyIdrPipe implements PipeTransform {
  transform(value: number): string {
    return 'Rp ' + value.toLocaleString('id-ID');
  }
}
```

Usage: `{{ grandTotal() | idr }}` → `Rp 142.500`

---

## 15. Stitch Source Reference

Original HTML mockups location: `stitch_pos_retail_supermaket/`

| Folder | Maps To | Theme |
|--------|---------|-------|
| `pos_login_screen/` | LoginComponent | Blue |
| `pos_main_menu/` | MainMenuComponent | Orange |
| `pos_daily_start_dashboard/` | DailyStartComponent | Orange + Blue accent |
| `main_sales_register_ui/` | SalesRegisterComponent | Orange |
| `pos_interface_light_theme/` | SalesRegisterComponent (alt layout) | Blue |
| `checkout_payment_selection/` | PaymentSelectionComponent | Blue |
| `checkout_modals_card_qr_select_1/` | CardEntryModalComponent | Blue |
| `checkout_modals_card_qr_select_2/` | CardEntryModalComponent (variant) | Blue |
| `qr_payment_interface/` | QrisPaymentComponent | Blue + Navy |
| `transaction_details_receipt_preview/` | ReceiptPreviewComponent | Orange |
| `customer_facing_display_1/` | CustomerDisplayComponent | Orange + Navy |
| `customer_facing_display_2/` | CustomerDisplayComponent (variant) | Orange + Navy |
| `pos_daily_close_dashboard/` | DailyCloseComponent | Orange |
| `pos_daily_transaction_report/` | DailyReportComponent | Orange |
| `velocity_retail/DESIGN.md` | Design system reference | — |

---

## 16. Interaction & Animation

| Pattern | CSS | Used In |
|---------|-----|---------|
| Card hover lift | `hover:-translate-y-1 transition-transform duration-200` | Menu cards |
| Button press | `active:scale-95 transition-transform` | All buttons |
| Icon hover scale | `group-hover:scale-110 transition-transform` | Menu card icons |
| Pulsing dot | `animate-ping` on `::before` pseudo | Online status |
| Modal enter | `animate-in fade-in zoom-in duration-300` | Dialogs |
| Scanned item highlight | `bg-primary/10 border-l-4 border-primary` | Cart list active row |
| Keypad press | `active:bg-slate-300 active:scale-95` | Numpad keys |
| Page transition | Angular route animation (fade) | Router outlet |

---

## 17. Dark Mode

All stitch designs include `dark:` Tailwind variants. Implementation:

```typescript
// Toggle via class on <html>
document.documentElement.classList.toggle('dark');
```

Key dark mappings:
```
bg-white          → dark:bg-slate-900
bg-slate-50       → dark:bg-slate-800
text-slate-900    → dark:text-slate-100
text-slate-500    → dark:text-slate-400
border-slate-200  → dark:border-slate-800
```

> Note: Customer display always uses dark theme (`brand-navy` background) regardless of POS terminal setting.

---

## 18. Development Notes

### Proxy Configuration (Angular → Backend)
```json
// proxy.conf.json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false
  },
  "/socket.io": {
    "target": "http://localhost:3000",
    "secure": false,
    "ws": true
  }
}
```

### Environment Config
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  socketUrl: 'http://localhost:3000',
  terminalId: 'T01',
  storeOutletId: 'OT99',
};
```
