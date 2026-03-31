# POS Supermarket Web — Progress Log

> Tracking progress for converting stitch HTML mockups to Angular components.
> If interrupted (mati lampu/internet), lanjut dari item yang masih `[ ]` atau `[~]`.

---

## Legend
- `[x]` = Done
- `[~]` = In Progress
- `[ ]` = Not Started

---

## Phase 1: Project Setup
- [x] Angular 18 project scaffolded (`ng new`)
- [x] Tailwind CSS 3 configured
- [x] Proxy config (`/api` → `:3000`, `/socket.io` → `:3000`)
- [x] Environment files (dev/prod)
- [x] Core services: auth, session, socket
- [x] Core guards: auth, shift
- [x] Core interceptor: auth (Bearer token)
- [x] Core models: user, item, transaction, payment, api-response
- [x] Shared pipes: currency-idr
- [x] Shared directives: auto-focus
- [x] SCSS → CSS migration
- [x] AGENT-WEB.md created
- [x] UX.drawio.xml updated (full flowchart)
- [x] Build verified clean

## Phase 2: Convert Stitch Mockups → Angular Components

### 2.1 Login Screen
- [x] `login.component.ts` — logic (signals, FormsModule, AuthService, redirect)
- [x] `login.component.html` — template from `pos_login_screen/code.html`
- [x] `login.component.css` — host styling
- **Source**: `stitch_pos_retail_supermaket/pos_login_screen/code.html`
- **Route**: `/login`

### 2.2 Main Menu
- [x] `main-menu.component.ts`
- [x] `main-menu.component.html`
- [x] `main-menu.component.css`
- **Source**: `stitch_pos_retail_supermaket/pos_main_menu/code.html`
- **Route**: `/menu`

### 2.3 Daily Start Dashboard
- [x] `daily-start.component.ts`
- [x] `daily-start.component.html`
- [x] `daily-start.component.css`
- **Source**: `stitch_pos_retail_supermaket/pos_daily_start_dashboard/code.html`
- **Route**: `/daily-start`

### 2.4 Cart (Scan & Keranjang)
- [x] `cart.component.ts` — scan item, keypad, void, cart state via CartService
- [x] `cart.component.html` — template (left: item list, right: keypad + functions)
- [x] `cart.component.css` — host styling
- [x] `cart.service.ts` — shared cart state (signals), addItem, removeItem, setQty, saveForReceipt
- **Source**: `stitch_pos_retail_supermaket/pos_interface_light_theme/code.html`
- **Alt Source**: `stitch_pos_retail_supermaket/main_sales_register_ui/code.html`
- **Route**: `/cart`
- **Note**: Renamed dari `sales-register` → `cart`. Folder `sales-register/` dihapus.

### 2.5 Payment (Checkout)
- [x] `payment.component.ts` — pilih method (cash/card/QRIS), cash keypad, complete payment
- [x] `payment.component.html` — full page (bukan overlay lagi)
- [x] `payment.component.css` — host styling
- **Source**: `stitch_pos_retail_supermaket/checkout_payment_selection/code.html`
- **Alt Source**: `stitch_pos_retail_supermaket/checkout_modals_card_qr_select_1/code.html`
- **Alt Source**: `stitch_pos_retail_supermaket/qr_payment_interface/code.html`
- **Route**: `/payment`
- **Flow**: dari Cart → PAY button → `/payment`

### 2.6 Receipt (Struk)
- [x] `receipt.component.ts` — preview struk, print, new transaction
- [x] `receipt.component.html` — full page (bukan overlay lagi)
- [x] `receipt.component.css` — host styling + receipt paper zigzag
- **Source**: `stitch_pos_retail_supermaket/transaction_details_receipt_preview/code.html`
- **Route**: `/receipt`
- **Flow**: dari Payment → complete → `/receipt` → New Transaction → `/cart`

### 2.7 Daily Close Dashboard
- [x] `daily-close.component.ts`
- [x] `daily-close.component.html`
- [x] `daily-close.component.css`
- **Source**: `stitch_pos_retail_supermaket/pos_daily_close_dashboard/code.html`
- **Route**: `/daily-close`

### 2.8 Daily Transaction Report
- [x] `daily-report.component.ts`
- [x] `daily-report.component.html`
- [x] `daily-report.component.css`
- **Source**: `stitch_pos_retail_supermaket/pos_daily_transaction_report/code.html`
- **Route**: `/report`

### 2.9 Customer Facing Display
- [x] `customer-display.component.ts`
- [x] `customer-display.component.html`
- [x] `customer-display.component.css`
- **Source**: `stitch_pos_retail_supermaket/customer_facing_display_1/code.html`
- **Alt Source**: `stitch_pos_retail_supermaket/customer_facing_display_2/code.html`
- **Route**: `/display`

## Phase 3: Backend API Integration (per feature)
- [x] Login API → tested working
- [x] Daily Start API → POST /api/shift/open, real endpoint
- [x] Cart/Scan API → scan/add, list, void with PIN verification (user_pin table, MD5)
- [x] Payment API → POST /api/transactions (transaction + detail + payment + balance)
- [x] Daily Close API → GET /api/shift/summary, POST /api/shift/close
- [x] Report API → GET /api/transactions?date=&page=&limit= (paginated, with payment type)
- [x] Socket.IO customer display → server relays display:update to terminal room

## Phase 4: Final
- [ ] Full build clean (`ng build --configuration=production`)
- [ ] End-to-end test all screens

---

## Last Updated
- **Date**: 2026-03-30
- **Last Completed Step**: Phase 2 Complete — Refactored sales-register → cart/payment/receipt (3 komponen terpisah, 3 route). Build clean.
- **Next Step**: Phase 3 — Backend API Integration testing

### Route Summary
| Route | Component | Guard |
|-------|-----------|-------|
| `/login` | LoginComponent | — |
| `/menu` | MainMenuComponent | authGuard |
| `/daily-start` | DailyStartComponent | authGuard |
| `/cart` | CartComponent | authGuard + shiftGuard |
| `/payment` | PaymentComponent | authGuard + shiftGuard |
| `/receipt` | ReceiptComponent | authGuard + shiftGuard |
| `/daily-close` | DailyCloseComponent | authGuard |
| `/report` | DailyReportComponent | authGuard |
| `/display` | CustomerDisplayComponent | — |