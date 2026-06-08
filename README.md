# ⚜️ Legacy Store Platform
[![Next.js](https://img.shields.io/badge/Next.js-16.1.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0.0-teal?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Upstash Redis](https://img.shields.io/badge/Upstash_Redis-red?style=for-the-badge&logo=redis)](https://upstash.com/)

A premium, full-stack luxury timepiece and watches e-commerce ecosystem. The platform encompasses a high-performance customer-facing storefront, a web-based Point of Sale (POS) system for physical showrooms, a comprehensive administration panel, a background notification/email worker queue, and a robust REST API designed to power the companion **Legacy Admin Mobile Application (Flutter)**.

---

## ✨ System Features

### 🛍️ Customer Storefront
*   **Luxury E-Catalog:** Interactive product showcase sorted by luxury brands (e.g., Rolex, Patek Philippe), premium materials (e.g., Sapphire Crystal, Rose Gold), and straps.
*   **Promotion & Marketing Engines:** Support for BOGO (Buy One Get One) deals, product bundles, custom discount coupons, flash sales, and free shipping thresholds.
*   **Premium Interactive UX:** Cart, Wishlist, side-by-side product comparison, and real-time restock requests.
*   **Loyalty Points Program:** Customers earn points on purchases and can redeem them for store coupons based on customized rules.
*   **Secure Checkout & Payments:** Multiple payment methods including COD (Cash on Delivery) and online payments (via Paymob integration).

### 🖥️ Web Point of Sale (POS)
*   Showroom integration allowing cashier sessions, cash drawer management, barcode scanner modes (keyboard emulation), quick-keys configuration, and instant physical order registration.

### ⚙️ ERP Admin Dashboard & Core API
*   **Enterprise Resource Planning (ERP) Ecosystem:** Designed as a lightweight ERP, managing company-wide business processes, multi-warehouse stock allocations, employee salaries, and partner equity models.
*   **Role-Based Access Control (RBAC):** Advanced permission management allowing granular access definition for each admin role (e.g. Owner, Stock Manager, Cashier, Financial Auditor). Admins are restricted strictly to pages, components, and API routes authorized for their role.
*   **Multi-Warehouse Inventory:** Manage product variants (SKUs, cost/price structures) distributed across multiple warehouses with logs, transfers, stock alerts, and automated variance audits.
*   **Treasury & Financial Auditing:** Comprehensive safe tracking, employee salary payments, investor and partner equity payouts, expenses log, and order financial auditing (COGS, packaging, shipping verification).
*   **Customer Risk Profiling:** Automated fraud prevention scoring and customer risk factor analysis.
*   **Detailed Audit Logging:** Automatic recording of all administrative actions, logins, database manipulations, and IP addresses to maintain strict security compliance.

---

## 🛠️ Technology Stack & Architecture

### Backend & API
*   **Next.js 16 (App Router)** & **React 19** serving as the core web portal, serverless functions, and REST API provider.
*   **Neon Database:** Serverless, scalable cloud **PostgreSQL** database managed via **Prisma ORM**.
*   **Upstash Redis:** Serves as a low-latency caching layer and API rate-limiter (`@upstash/ratelimit`) to defend endpoints against brute-force/DDoS attacks.
*   **Firebase Admin SDK:** Server integration with Firebase Cloud Messaging (FCM) to trigger instant administrative push notifications on mobile devices.
*   **Paymob Payment Gateway:** Secure payment integration allowing online card transactions and digital wallets directly on checkout.
*   **Resend & React Email:** Used for programmatic transactional email rendering and reliable delivery to customers.
*   **Cloudinary:** Handles cloud asset management, delivering responsive, optimized watch media files.
*   **Pino** & **Pino-Pretty:** High-performance, structured JSON logging for request tracking and server debugging.

### Mobile App Hot Updates
*   **Shorebird OTA Code Push:** Embedded engine inside the mobile app allowing instantaneous code patches to compile, download, and refresh in the background without needing a Google Play Store or iOS App Store review cycle.

### Styling & Interactive UI
*   **Tailwind CSS** for responsive layout design.
*   **Framer Motion** for premium animations matching the luxury branding.
*   **Radix UI** primitives for accessible, high-quality interactive components.
*   **Recharts** for rich administration sales charts and visual data graphs.

---

## 📁 Directory Structure

```text
├── prisma/               # Database schemas, migrations, and seed scripts
│   ├── schema.prisma     # Core Prisma Database Schema (PostgreSQL)
│   ├── seed.ts           # Development environment data seed script
│   └── seed-finance.ts   # Financial ledger seed configurations
│
├── public/               # Static assets, logos, and web illustrations
│
├── src/
│   ├── app/              # Next.js App Router (Pages, Components & APIs)
│   │   ├── (auth)/       # Authentication pages (login, registration)
│   │   ├── admin/        # Web admin dashboard pages
│   │   ├── api/          # REST API Endpoints (Auth, POS, Orders, Products, admin hooks)
│   │   ├── cart/         # Shopping cart interface
│   │   ├── checkout/     # Checkout and checkout success wizard
│   │   ├── pos/          # Cashier Point-of-Sale UI
│   │   └── shop/         # Shop catalog grid and filters
│   │
│   ├── components/       # Shared UI component library
│   ├── context/          # React Context providers (Cart, Wishlist, Auth)
│   ├── hooks/            # Custom React hooks (e.g. useOrders, useProducts)
│   ├── lib/              # Core business services, validations (Zod), and database clients
│   ├── scripts/          # Administration utility and cleanup scripts
│   ├── types/            # TypeScript shared type declarations
│   └── worker.ts         # Background email and notifications queue worker
│
├── tests/                # Unit testing files
└── admin-app/            # Companion Mobile Admin App (Flutter codebase)
```

---

## 🚀 Getting Started & Setup

### 📋 Prerequisites
*   Node.js `^20.0.0` or higher.
*   PostgreSQL Database instance.
*   Upstash Redis account (for rate limiting).
*   Cloudinary credentials (for image uploads).
*   Resend API Key (for transactional emails).

### ⚙️ Installation
1.  Clone the repository and install dependencies:
    ```bash
    npm install
    ```

2.  Set up your environment variables. Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
    *Ensure you fill in the required keys like `DATABASE_URL`, `AUTH_SECRET`, and API tokens.*

3.  Run database migrations and apply seeds:
    ```bash
    # Run Prisma migration
    npm run db:migrate
    
    # Generate Prisma Client
    npx prisma generate
    
    # Seed the database with initial products, admin roles, and default configurations
    npx prisma db seed
    ```

### 🏃 Running the Application
*   **Start Development Server:**
    ```bash
    npm run dev
    ```
    *The web application will be accessible at [http://localhost:8080](http://localhost:8080).*

*   **Start Background Mail/Alerts Queue Worker:**
    The email queue worker is decoupled and needs to run concurrently in production/development:
    ```bash
    npm run worker
    ```

*   **Verify Code Quality & Type Integrity:**
    ```bash
    # Run linter
    npm run lint
    
    # Run TypeScript compiler checks
    npm run type-check
    
    # Run unit tests
    npm run test
    ```

---

## 📱 Companion Mobile Application
The mobile companion application is a Flutter project designed for store owners and operations managers. It connects to the web app's REST API and provides full management capabilities on the go.
See the **[admin-app/README.md](file:///e:/Dev/web/LegaCy/admin-app/README.md)** for details on how to build and run the mobile app.
