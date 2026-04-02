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

### 2.0 Startup Setup (Before Login)
- [x] `startup.component.ts` — form startup + test connection tanpa simpan localStorage
- [x] `startup.component.html` — field dari `connection.js` (Terminal ID, API URL, Port) dibuat read-only
- [x] `startup.component.css` — host styling
- [x] `startup-config.service.ts` — load config dari runtime `public/connection.js` + test `GET {apiUrl}:{port}/api/health`
- [x] `public/connection.js` — source of truth runtime config (api/socket/terminal/outlet/printer)
- [x] Runtime config mapper disesuaikan ke format baru `host` (derived `apiUrl` + `socketUrl`) agar env & startup sinkron
- **Source**: `stitch_pos_retail_supermaket/startup/code.html`
- **Route**: `/startup` (default entry sebelum login)

### 2.2 Main Menu
- [x] `main-menu.component.ts`
- [x] `main-menu.component.html`
- [x] `main-menu.component.css`
- **Source**: `stitch_pos_retail_supermaket/pos_main_menu/code.html`
- **Route**: `/menu`

### 2.2a Report Submenu
- [x] `report-submenu.component.ts`
- [x] `report-submenu.component.html`
- [x] `report-submenu.component.css`
- **Route**: `/report-submenu`

### 2.3 Daily Start Dashboard
- [x] `daily-start.component.ts`
- [x] `daily-start.component.html`
- [x] `daily-start.component.css`
- **Source**: `stitch_pos_retail_supermaket/pos_daily_start_dashboard/code.html`
- **Route**: `/daily-start`

### 2.3a Manual Cash In
- [x] `manual-cash-in.component.ts`
- [x] `manual-cash-in.component.html`
- [x] `manual-cash-in.component.css`
- [x] `manual-cash.service.ts` (GET summary, POST add cash in, POST open drawer)
- **Design**: mirip Daily Start, tanpa badge/button "New Session"
- **Route**: `/manual-cash-in`

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
- [x] `payment.component.ts` — multi-payment (split payment), tipe dari API, keypad, add/remove entry, complete
- [x] `payment.component.html` — 2-panel layout: kiri keypad + payment types, kanan paid entries table + summary
- [x] `payment.component.css` — host styling
- **Source**: `stitch_pos_retail_supermaket/checkout_payment_selection/code.html`
- **Route**: `/payment`
- **Flow**: Cart → PAY button → `/payment` → `POST /api/payment/complete` → `/receipt`
- **Multi-Payment API**:
  - `GET /api/payment/types` — list tipe pembayaran (filtered `isLock=1`)
  - `GET /api/payment/pending/:kioskUuid` — current paid entries dari `kiosk_paid_pos`
  - `POST /api/payment/add` — add entry ke `kiosk_paid_pos`
  - `DELETE /api/payment/:id` — hapus entry dari `kiosk_paid_pos`
  - `POST /api/payment/complete` — finalize ke `transaction`/`transaction_detail`/`transaction_payment`

### 2.6 Receipt (Struk)
- [x] `receipt.component.ts` — preview struk, print, new transaction
- [x] `receipt.component.html` — full page (bukan overlay lagi)
- [x] `receipt.component.css` — host styling + receipt paper zigzag
- **Source**: `stitch_pos_retail_supermaket/transaction_details_receipt_preview/code.html`
- **Route**: `/receipt`
- **Flow**: dari Payment → complete → `/receipt?id={transactionId}` → New Transaction → `/cart`
- **Reuse Flow**: dari Report klik Detail → `/receipt?id={transactionId}` (reprint)
- **Data Source**: jika ada query param `id`, Receipt fetch `GET /api/transactions/:id`; fallback ke `CartService.lastTransaction` untuk flow lama

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

### 2.8a Daily Close History
- [x] `daily-close-history.component.ts`
- [x] `daily-close-history.component.html`
- [x] `daily-close-history.component.css`
- **Route**: `/daily-close-history`

### 2.10 Cash Balance Detail
- [x] `cash-balance.component.ts`
- [x] `cash-balance.component.html`
- [x] `cash-balance.component.css`
- **Source**: `stitch_pos_retail_supermaket/cash_balance/code.html`
- **Route**: `/cash-balance`
- **Note**: Menampilkan mutasi cash drawer (cash in/out) dari transaksi cash + opening balance shift aktif.

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
- [x] Manual Cash In API → `GET /api/manual-cash/summary/:terminalId?`, `POST /api/manual-cash/add`, `POST /api/manual-cash/open-drawer`
- [x] Daily Start session persistence → save active session ID to localStorage (`shiftId`/`settlementId` + `resetId` compatibility)
- [x] Cart/Scan API → scan/add, list, void with PIN verification (user_pin table, MD5)
- [x] Cart Add Qty API → POST /api/item/add-qty (duplicate selected item row insert by qty)
- [x] Payment API → POST /api/transactions (transaction + detail + payment + balance)
- [x] Payment complete payload updated → sends `resetId` (with fallback `settlementId`) for backend compatibility
- [x] Daily Close API → GET /api/daily-close/:resetId, POST /api/daily-close/:resetId
- [x] Daily Close Report API → GET /api/daily-close/report/:resetId
- [x] Main menu route wired → tombol Daily Close Report now navigates to `/daily-close`
- [x] Report API → GET /api/transactions?date=&page=&limit= (paginated, with payment type)
- [x] Report Reprint Link → tombol Detail membuka `/receipt?id={transactionId}`
- [x] Socket.IO customer display → server relays display:update to terminal room

## Phase 4: Final
- [x] Full build clean (`ng build --configuration=production`)
- [ ] End-to-end test all screens

## Phase 5: Wajib Ditambah (Masukan AI)

### 5.1 Stabilitas Operasional POS
- [ ] E2E automation untuk happy-path utama: startup -> login -> daily-start -> cart -> payment -> receipt -> daily-close.
- [ ] Global error boundary UX: fallback page + retry action untuk API timeout/network error.
- [ ] Offline-safe UX minimum: indikator koneksi, disable aksi kritikal saat offline, dan pesan recovery.

### 5.2 Integrasi Device Nyata
- [ ] Print & cash-drawer flow real-device readiness (status printer, retry, error toast yang actionable).
- [ ] Supervisor override dialog terstandar untuk void/aksi sensitif (PIN flow konsisten lintas halaman).

### 5.3 Kualitas Produk
- [ ] Route-level loading skeleton + empty/error states di semua screen data-heavy (`/report`, `/cash-balance`, `/daily-close-history`).
- [ ] Accessibility pass untuk touch POS (focus order, keyboard scanner flow, kontras teks, target sentuh >=48px).
- [ ] Smoke test CI untuk build + lint + test minimal agar regresi cepat ketahuan.

---

## Last Updated
- **Date**: 2026-04-02
- **Last Completed Step**: Dedicated Daily Close endpoints aktif, startup runtime config (`public/connection.js`) sinkron, dan route tambahan report history/submenu sudah wired.
- **Next Step**: Jalankan E2E test full closing flow + hardening UX untuk error/offline/device.

### Route Summary
| Route | Component | Guard |
|-------|-----------|-------|
| `/login` | LoginComponent | — |
| `/menu` | MainMenuComponent | authGuard |
| `/report-submenu` | ReportSubmenuComponent | authGuard |
| `/daily-start` | DailyStartComponent | authGuard |
| `/manual-cash-in` | ManualCashInComponent | authGuard + shiftGuard |
| `/cart` | CartComponent | authGuard + shiftGuard |
| `/payment` | PaymentComponent | authGuard + shiftGuard |
| `/receipt` | ReceiptComponent | authGuard + shiftGuard |
| `/daily-close` | DailyCloseComponent | authGuard |
| `/report` | DailyReportComponent | authGuard |
| `/daily-close-history` | DailyCloseHistoryComponent | authGuard |
| `/cash-balance` | CashBalanceComponent | authGuard |
| `/display` | CustomerDisplayComponent | — |
| `/startup` | StartupComponent | — |