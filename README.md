# ⚜️ Legacy Store Platform
[![Next.js](https://img.shields.io/badge/Next.js-16.1.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0.0-teal?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Upstash Redis](https://img.shields.io/badge/Upstash_Redis-red?style=for-the-badge&logo=redis)](https://upstash.com/)

A premium, full-stack luxury timepiece and watches e-commerce ecosystem. The platform encompasses a high-performance customer-facing storefront, a web-based Point of Sale (POS) system for physical showrooms, a comprehensive administration panel, a background notification/email worker queue, and a robust REST API designed to power the companion **Legacy Admin Mobile Application (Flutter)**.

---

## 📖 Arabic Overview | نبذة عن المنصة بالعربية
منصة **ليجاسي (Legacy Store)** هي نظام تجارة إلكترونية متكامل وفخم مخصص لبيع الساعات الفاخرة. تشتمل المنصة على:
1. **المتجر الإلكتروني (Storefront):** واجهة متميزة للعملاء لاستعراض الساعات الفاخرة، العروض الترويجية، الشراء وتتبع الطلبات.
2. **نظام البيع الفوري (Web POS):** واجهة مخصصة للمعارض لتسجيل المبيعات اليدوية والفورية وطباعة الفواتير.
3. **لوحة التحكم الإدارية للويب:** لإدارة الكتالوج، المخزون، الطلبات، التسويق، والماليات.
4. **خادم المهام الخلفية (Background Worker):** لمعالجة طابور رسائل البريد الإلكتروني وتنبيهات المخزون تلقائياً.
5. **واجهة برمجة التطبيقات (REST API):** التي تغذي تطبيق الموبايل الإداري (Flutter).

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

### ⚙️ Admin Dashboard & Core API
*   **Multi-Warehouse Inventory:** Manage product variants (SKUs, cost/price structures) distributed across multiple warehouses with logs, transfers, stock alerts, and automated variance audits.
*   **Treasury & Financial Auditing:** Comprehensive safe tracking, employee salary payments, investor and partner equity payouts, expenses log, and order financial auditing (COGS, packaging, shipping verification).
*   **Customer Risk Profiling:** Automated fraud prevention scoring and customer risk factor analysis.

---

## 🛠️ Technology Stack & Architecture

### Backend & API
*   **Next.js 16 (App Router)** & **React 19** serving as the API and Web host.
*   **Prisma ORM** coupled with a high-performance **PostgreSQL** database.
*   **Upstash Redis** for global API rate limiting and serverless state caching.
*   **Firebase Admin SDK** for dispatching live admin push notifications.
*   **Resend & React Email** for building and sending transactional notifications.
*   **Cloudinary** for scalable, high-fidelity media uploads.
*   **Pino** & **Pino-Pretty** for structured server environment logging.

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
