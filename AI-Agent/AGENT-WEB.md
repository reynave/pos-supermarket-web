# POS Supermarket Web — Frontend AI Agent Context Document

> This document describes the frontend Angular SPA for the POS Supermarket system.
> For backend context (API, database, business logic), see `../pos-supermarket/AGENT.md`.

---

## 1. Project Overview

This is the **frontend SPA** for a retail POS (Point of Sale) system designed to run on physical POS terminal machines with touchscreen monitors in a supermarket environment. It is **not** a responsive web app — it targets fixed-ratio displays (1024×768 or 1920×1080).

### Primary Users
| Role | Screens |
|------|---------|
| **Cashier** | Login, Main Menu, Daily Start, Cart, Payment, Receipt, Daily Close |
| **Supervisor** | All cashier screens + void auth, price override, refund, reports |
| **Customer** | Customer Facing Display (read-only mirror screen via Socket.IO) |

### Communication with Backend
- **REST API** → `/api/*` (proxied to `http://localhost:3000` via `proxy.conf.json`)
- **Socket.IO** → `http://localhost:3000` (real-time customer mirror screen)
- **Auth** → JWT Bearer token in `Authorization` header (auto-attached via `authInterceptor`)

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Angular (standalone components) | 18.x |
| Language | TypeScript | ~5.4 |
| Styling | Tailwind CSS | 3.x |
| UI Primitives | @angular/cdk (headless — Dialog, Overlay, A11y) | 18.x |
| Forms | Angular FormsModule (template-driven with ngModel) | 18.x |
| HTTP | Angular HttpClient + functional interceptors | 18.x |
| Realtime | socket.io-client | 4.x |
| PostCSS | postcss + autoprefixer | 8.x |
| Tailwind Plugins | @tailwindcss/forms, @tailwindcss/container-queries | latest |

### Styling Rules
- **Plain CSS only** — do NOT use SCSS/Sass (user preference)
- All styling via Tailwind utility classes in templates
- Component `.css` files only for `:host` display and component-scoped exceptions
- No ng-bootstrap, no Angular Material — use `@angular/cdk` for headless overlays/dialogs

---

## 3. UX Flow

Reference: `UX.drawio.xml` (open in https://app.diagrams.net)

```
Login Screen → Main Menu → [Already Daily Start?]
                 ↓ Logout → Login
                 ↓ YES → Cart (Scan & Keranjang)
                 ↓ NO  → Daily Start Dashboard → Cart

Cart → PAY button → Payment → Complete → Receipt → New Transaction → Cart
     ↓ End Shift → Daily Close → Daily Report → Logout

Payment → [CASH] → Cash keypad → Complete → Receipt
        → [CARD] → Card reader → Complete → Receipt
        → [QRIS] → QR scan → Complete → Receipt

Cart ··· (Socket.IO) ··· Customer Facing Display (parallel screen)
```

### Route-to-Screen Mapping
| Route | Component | Guard | Screen |
|-------|-----------|-------|--------|
| `/login` | `LoginComponent` | none | POS Login Screen |
| `/menu` | `MainMenuComponent` | `authGuard` | POS Main Menu |
| `/daily-start` | `DailyStartComponent` | `authGuard` | Daily Start Dashboard |
| `/cart` | `CartComponent` | `authGuard`, `shiftGuard` | Scan Item & Keranjang |
| `/payment` | `PaymentComponent` | `authGuard`, `shiftGuard` | Checkout Payment |
| `/receipt` | `ReceiptComponent` | `authGuard`, `shiftGuard` | Struk / Receipt Preview |
| `/daily-close` | `DailyCloseComponent` | `authGuard` | Daily Close Dashboard |
| `/report` | `DailyReportComponent` | `authGuard` | Daily Transaction Report |
| `/display` | `CustomerDisplayComponent` | none | Customer Facing Display |
| `/` | redirect → `/login` | — | — |
| `**` | redirect → `/login` | — | — |

### Guards
- **`authGuard`** — checks `AuthService.isLoggedIn()` (signal-based), redirects to `/login` if no token
- **`shiftGuard`** — checks if daily start session is active, redirects to `/daily-start` if not
- Both guards applied to `/cart`, `/payment`, `/receipt`

---

## 4. Project Structure

```
pos-supermarket-web/
├── AGENT-WEB.md              # This file
├── DESIGN.md                 # Comprehensive design reference (colors, typography, components)
├── UX.drawio.xml             # UX flowchart (diagrams.net)
├── angular.json              # Angular CLI config (CSS, no SCSS)
├── tailwind.config.js        # Custom colors, fonts, shadows, plugins
├── package.json
├── tsconfig.json / tsconfig.app.json
├── src/
│   ├── index.html            # Public Sans + Material Symbols font imports
│   ├── main.ts               # Bootstrap
│   ├── styles.css            # Tailwind directives + global styles
│   ├── proxy.conf.json       # /api → :3000, /socket.io → :3000 (ws)
│   ├── environments/
│   │   ├── environment.ts    # apiUrl=/api, terminalId=T01, storeOutletId=OT99
│   │   └── environment.prod.ts
│   └── app/
│       ├── app.component.ts      # Root: <router-outlet />
│       ├── app.config.ts         # provideRouter, provideHttpClient + authInterceptor
│       ├── app.routes.ts         # 9 lazy-loaded routes
│       ├── core/
│       │   ├── services/
│       │   │   ├── auth.service.ts      # login/logout/clearSession, JWT in localStorage, signals
│       │   │   ├── cart.service.ts       # Shared cart state (signals), addItem, setQty, saveForReceipt
│       │   │   ├── session.service.ts   # Shift state (daily start/close)
│       │   │   └── socket.service.ts    # Socket.IO wrapper
│       │   ├── guards/
│       │   │   ├── auth.guard.ts        # JWT check → redirect /login
│       │   │   └── shift.guard.ts       # Active shift check → redirect /daily-start
│       │   ├── interceptors/
│       │   │   └── auth.interceptor.ts  # Auto-attach Bearer token
│       │   └── models/
│       │       ├── user.model.ts        # User, LoginRequest, LoginResponse
│       │       ├── item.model.ts        # Item, ItemBarcode
│       │       ├── transaction.model.ts # Transaction, TransactionDetail, Cart
│       │       ├── payment.model.ts     # PaymentType, PaymentEntry
│       │       └── api-response.model.ts # ApiResponse<T>
│       ├── shared/
│       │   ├── pipes/
│       │   │   └── currency-idr.pipe.ts # Rp 1.234.567 format
│       │   └── directives/
│       │       └── auto-focus.directive.ts
│       └── features/
│           ├── auth/
│           │   └── login/
│           │       ├── login.component.ts
│           │       ├── login.component.html
│           │       └── login.component.css
│           ├── menu/
│           │   └── main-menu/main-menu.component.ts
│           ├── daily-ops/
│           │   ├── daily-start/daily-start.component.ts
│           │   └── daily-close/daily-close.component.ts
│           ├── register/
│           │   ├── cart/cart.component.ts          # Scan item, keranjang, keypad
│           │   ├── payment/payment.component.ts    # Cash/Card/QRIS checkout
│           │   └── receipt/receipt.component.ts     # Struk preview, print, new txn
│           ├── report/
│           │   └── daily-report/daily-report.component.ts
│           └── display/
│               └── customer-display/customer-display.component.ts
└── stitch_pos_retail_supermaket/    # Reference HTML mockups (Google Stitch)
    ├── pos_login_screen/
    ├── pos_main_menu/
    ├── pos_interface_light_theme/
    ├── main_sales_register_ui/
    ├── checkout_payment_selection/
    ├── checkout_modals_card_qr_select_1/
    ├── checkout_modals_card_qr_select_2/
    ├── qr_payment_interface/
    ├── transaction_details_receipt_preview/
    ├── pos_daily_start_dashboard/
    ├── pos_daily_close_dashboard/
    ├── pos_daily_transaction_report/
    ├── customer_facing_display_1/
    ├── customer_facing_display_2/
    └── velocity_retail/
```

---

## 5. Design System Summary

Full reference: `DESIGN.md`

### Colors (tailwind.config.js)
| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#ec5b13` | Brand orange — CTAs, header, active states |
| `primary-light` | `#ff8a50` | Hover variant |
| `primary-dark` | `#b34400` | Active/pressed variant |
| `accent-blue` | `#2563eb` | Secondary actions, payment UI, links |
| `brand-navy` | `#0a192f` | Customer display dark bg |
| `background-light` | `#f8f6f6` | App background |

### Typography
- **Font**: Public Sans (imported in `index.html`)
- **Icons**: Material Symbols Outlined (imported in `index.html`)
- **Text color**: `#191c1d` (never `#000000`)

### Component Patterns
- **Large inputs**: `h-16 pl-14 rounded-2xl border-2 text-xl`
- **Primary CTA**: `h-20 bg-primary text-white text-2xl rounded-2xl font-bold shadow-lg`
- **Cards**: `p-8 rounded-3xl bg-white shadow-sm`
- **Labels**: `uppercase tracking-widest text-xs font-bold`
- **Touch targets**: minimum 48px for all interactive elements

---

## 6. State Management

### Authentication (auth.service.ts)
- `currentUser` — Angular `signal<User | null>` loaded from `localStorage`
- `isLoggedIn` — `computed(() => !!currentUser())`
- Token stored in `localStorage` as `pos_token`
- User data stored as `pos_user`
- On `clearSession()` → remove both, signal set to null, redirect `/login`

### Shift State (session.service.ts)
- Tracks if daily start has been initiated for the current terminal
- Used by `shiftGuard` to gate access to `/register`

### Cart State (cart.service.ts)
- `cart` — `signal<CartItem[]>` shared across Cart, Payment, Receipt components
- `selectedIndex` — currently highlighted cart row
- `subtotal`, `taxTotal`, `grandTotal`, `itemCount` — computed signals
- `addItem()`, `removeItem()`, `setQty()`, `clearCart()` — cart mutations
- `saveForReceipt(transaction, method)` — snapshot cart before clearing for receipt display
- `lastTransaction`, `lastCartItems`, `lastPaymentMethod` — receipt data signals
- Cart → customer display sync via Socket.IO in CartComponent

---

## 7. API Integration

### Base URL
- Development: `/api` (proxied via `proxy.conf.json` to `http://localhost:3000`)
- Production: configured in `environment.prod.ts`

### Auth Endpoints (implemented)
| Method | Endpoint | Request | Response |
|--------|----------|---------|----------|
| POST | `/api/auth/login` | `{ userId, password?, terminalId? }` | `{ token, sessionId, user, terminalId }` |
| POST | `/api/auth/logout` | `{}` (Bearer token) | `{ success, message }` |
| GET | `/api/auth/me` | (Bearer token) | `{ user }` |

### Remaining Endpoints (to implement)
See `../pos-supermarket/AGENT.md` section 6 for full API reference:
- Item: `/api/item/barcode/:barcode`, `/api/item/:id`
- Cart: `/api/cart/start`, `/api/cart/scan`, `/api/cart/:kioskUuid`
- Payment: `/api/payment/types`, `/api/payment/add`, `/api/payment/finalize`
- Daily: `/api/daily/open`, `/api/daily/close`, `/api/daily/balance`
- Report: `/api/report/daily`, `/api/report/z-report/:id`
- Member: `/api/member/:id`

### Error Response Format
```json
{ "success": false, "message": "Error description", "data": null }
```

---

## 8. Socket.IO Events

### Customer Mirror Display
| Event | Direction | Payload |
|-------|-----------|---------|
| `terminal:register` | Client → Server | `{ terminalId }` |
| `cart:update` | Server → Client | `{ items[], total, discount, finalPrice }` |
| `cart:clear` | Server → Client | `{}` |
| `payment:start` | Server → Client | `{ finalPrice, paymentType }` |
| `payment:qr` | Server → Client | `{ qrContent, amount }` |
| `payment:complete` | Server → Client | `{ change, paymentMethods[] }` |
| `display:welcome` | Server → Client | `{ message }` |
| `display:thankyou` | Server → Client | `{ message }` |

---

## 9. Development Commands

```bash
# Start frontend dev server (port 4200, proxy to backend :3000)
cd c:\nodejs\pos-supermarket-web
npx ng serve

# Build for production
npx ng build --configuration=production

# Start backend (run in separate terminal)
cd c:\nodejs\pos-supermarket
npm run dev
```

### Test Login Credentials
| Role | Staff ID | Password |
|------|----------|----------|
| Cashier | `123123` | _(none — no password set)_ |
| Supervisor | `123456789` | `supervisor` |

---

## 10. Stitch Mockups Reference

The `stitch_pos_retail_supermaket/` folder contains 15 HTML mockups created with Google Stitch. Each folder has a `code.html` file that serves as the design reference for converting to Angular components.

| Mockup Folder | Target Component | Status |
|---------------|-----------------|--------|
| `pos_login_screen` | `LoginComponent` | Done |
| `pos_main_menu` | `MainMenuComponent` | Done |
| `pos_daily_start_dashboard` | `DailyStartComponent` | Done |
| `pos_interface_light_theme` | `CartComponent` | Done |
| `main_sales_register_ui` | `CartComponent` (alt layout) | Done |
| `checkout_payment_selection` | `PaymentComponent` | Done |
| `checkout_modals_card_qr_select_1` | `PaymentComponent` | Done |
| `checkout_modals_card_qr_select_2` | `PaymentComponent` (alt) | Done |
| `qr_payment_interface` | `PaymentComponent` | Done |
| `transaction_details_receipt_preview` | `ReceiptComponent` | Done |
| `pos_daily_close_dashboard` | `DailyCloseComponent` | Done |
| `pos_daily_transaction_report` | `DailyReportComponent` | Done |
| `customer_facing_display_1` | `CustomerDisplayComponent` | Done |
| `customer_facing_display_2` | `CustomerDisplayComponent` (alt) | Done |
| `velocity_retail` | Design system reference | N/A |

### Converting Stitch → Angular
1. Read the `code.html` from target stitch folder
2. Extract Tailwind classes (already compatible — same Tailwind config)
3. Replace static HTML with Angular bindings (`{{ }}`, `@if`, `@for`, `[(ngModel)]`)
4. Replace `<form onsubmit="return false;">` with `(ngSubmit)="handler()"`
5. Replace inline `<script>` with component TypeScript logic
6. Keep all Tailwind classes as-is — they match `tailwind.config.js`

---

## 11. Coding Conventions

- **Standalone components only** — no NgModules
- **Signals** for reactive state (`signal()`, `computed()`)
- **Functional interceptors/guards** — not class-based
- **Lazy loading** — all feature routes use `loadComponent`
- **Template syntax** — Angular 17+ control flow (`@if`, `@for`, `@switch`)
- **No SCSS** — plain CSS only
- **Imports** — use relative paths within feature, `../../../core/` for cross-cutting
- **Currency** — IDR format via `currency-idr.pipe.ts` (`Rp 1.234.567`)

### AI Restrictions

- **AI is strictly prohibited** from using any Angular API or framework feature marked as **Developer Preview** in the official Angular documentation for the project's Angular version.
- AI must always prefer **stable, production-ready APIs** and patterns.
- If a requested implementation would require a Developer Preview feature, AI must **reject that approach** and provide the closest stable alternative.
- This restriction applies to Angular core APIs, signal-related extensions, forms APIs, queries, inputs, model APIs, and any other feature explicitly labeled as **Developer Preview**.
- For this project on **Angular 18.x**, AI must avoid Developer Preview features such as `effect()`, signal inputs via `input()`, model inputs via `model()`, and signal queries when they are still marked as preview in the Angular 18 documentation.