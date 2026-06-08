# ⚜️ Legacy Admin Mobile Application

A premium, feature-rich mobile administrative portal for the **Legacy Store** (luxury timepieces & watches brand). Built with **Flutter**, this application provides store administrators, managers, and partners with complete control over storefront catalog, inventory, orders, marketing promotions, finance ledger, operations, support tickets, and advanced reports, all directly from their mobile devices.

The design utilizes a luxury color palette featuring **Emerald Green (`#12403C`)** and **Gold (`#D4AF37`)** combined with premium typography (**Playfair Display & Inter** via Google Fonts) and micro-animations to align with the brand's aesthetic.

---

## 📖 Arabic Documentation
For a fully detailed, feature-by-feature breakdown in Arabic, please refer to:
👉 **[APP_FEATURES.md](file:///e:/Dev/web/LegaCy/admin-app/APP_FEATURES.md)**

---

## ✨ Features Overview

1. **Dashboard & Tasks Manager**: Live overview of daily sales, active store status, and an advanced local-first Todo list with deadlines, priorities, and backend synchronization.
2. **Catalog & Inventory Management**: Add or edit luxury products, handle multi-option variants (colors, sizes), manage product images, and track incoming stock batches.
3. **Order Management & POS**: Track order fulfillment (Pending, Shipped, Delivered, Canceled), change statuses, print PDF invoices directly, and register physical/offline orders via a mobile POS (Manual Order screen).
4. **Finance, Treasury & Audits**: View treasury liquidity, approve partner payouts, track store expenses, perform financial order audits, and execute month-end closings.
5. **Marketing & Promotions Hub**: Manage discount coupon codes, buy-one-get-one (BOGO) deals, flash sales, shipping discounts, product bundles, custom announcements, loyalty programs, and affiliate marketers.
6. **Operations & Logistics**: Set up delivery zones with flat/custom shipping rates, manage suppliers, and record procurement logs.
7. **Storefront Customization (Merchandising)**: Rearrange store homepage banners, catalog categories, brands, and premium materials (e.g., Sapphire Crystal, Rose Gold, Crocodile Leather).
8. **CRM, Reviews & Support**: View user accounts, read and respond to support/contact messages, moderate product reviews, and inspect restock requests.
9. **Advanced Reports & Analytics**: Dynamic interactive charts (powered by `fl_chart`) representing daily sales, revenue metrics, cost of goods, partner commissions, and machine-learning-inspired inventory insights.
10. **Push Notifications**: Real-time admin alerts (powered by Firebase Cloud Messaging) for new orders, financial actions, and critical inventory drops.

---

## 🛠️ Technology Stack & Dependencies

The project relies on a clean, scalable architectural layout utilizing standard Dart packages:

* **Framework**: Flutter SDK (compatible with version `^3.10.3`)
* **State Management**: `provider` (version `^6.1.5+1`)
* **Database & Storage**: 
  * `shared_preferences` (for general offline task storage & app state caching)
  * `flutter_secure_storage` (for encrypted storage of credentials and auth tokens)
* **Networking**: `http` (for REST API communication with the backend server)
* **UI/UX & Enhancements**:
  * `google_fonts` (Playfair Display & Inter typography)
  * `lucide_icons` & `lucide_icons_flutter` (modern icons)
  * `shimmer` (premium shimmer-loading effects)
  * `fl_chart` (highly configurable data visualizations)
  * `cached_network_image` & `flutter_cache_manager` (efficient caching of product graphics)
* **Document Generation & Utilities**:
  * `pdf` & `printing` (local PDF invoice generation and wireless printing)
  * `share_plus` (sharing invoices or reports)
  * `gal` (saving generated images/invoices to gallery)
  * `intl` (date/currency formatting)
  * `arabic_reshaper` (correct RTL rendering for Arabic strings)
* **Push Notifications**: `firebase_core` & `firebase_messaging` with `flutter_local_notifications`
* **Over-The-Air (OTA) Updates**: **Shorebird Code Push** integration for issuing instantaneous bug-fixes and patches without App Store/Play Store review delays.

---

## 📁 Directory Structure

```text
lib/
├── core/
│   ├── config/       # API configuration and endpoints
│   ├── constants/    # Style constants, asset paths, and hardcoded values
│   ├── network/      # API client wrapper and error interceptors
│   ├── services/     # Printing, Notification, and UnreadTracker helpers
│   ├── theme/        # Dark/Light theme specifications (AppColors and AppTheme)
│   └── widgets/      # Shared components (buttons, text fields, cards)
│
├── features/         # Modular feature-driven directory structure
│   ├── auth/         # Login screen, authentication providers, and state
│   ├── dashboard/    # Main stats dashboard and Todo task manager
│   ├── finance/      # Treasury, expenses, payouts, audits, and closings
│   ├── home/         # Navigation shell & overall layout
│   ├── marketing/    # Coupons, flash sales, affiliates, and bundle offers
│   ├── more/         # Extended menu including CRM, reviews, and support
│   ├── notifications/# System alert tray & notifications history
│   ├── operations/   # Suppliers, zones, invoices, and procurement
│   ├── orders/       # Order tracking lists, details, and manual order POS
│   ├── products/     # Product grid, creation forms, and batch additions
│   ├── reports/      # Daily charts, financial analytics, and insights
│   ├── settings/     # Administrative preferences and notification templates
│   └── storefront/   # Categories, brands, materials, and merchandising tools
│
└── main.dart         # Splash screen and application entry point
```

---

## 🚀 Setting Up & Getting Started

### 📋 Prerequisites
Ensure you have the following installed on your system:
* [Flutter SDK](https://docs.flutter.dev/get-started/install) (version `^3.10.3`)
* [Dart SDK](https://dart.dev/get-started)
* Java Development Kit (JDK) & Android Studio (for Android build)
* Xcode (for iOS build - macOS required)

### ⚙️ Installation
1. Clone the repository and navigate to the admin-app directory:
   ```bash
   cd admin-app
   ```

2. Retrieve project dependencies:
   ```bash
   flutter pub get
   ```

3. Ensure you have the Firebase configuration files setup:
   * **Android**: `android/app/google-services.json`
   * **iOS**: `ios/Runner/GoogleService-Info.plist`

4. Run the project in development mode:
   ```bash
   flutter run
   ```

---

## 📦 Building for Production

### Android
* Build an APK for direct installation:
  ```bash
  flutter build apk --release
  ```
* Build a secure App Bundle for Google Play Store release:
  ```bash
  flutter build appbundle --release
  ```

### iOS
* Build the app bundle for iOS devices:
  ```bash
  flutter build ipa --release
  ```

---

## 🦅 Shorebird Integration (Code Push)

The app is pre-configured with Shorebird for OTA updates.

* **Configuration File**: [shorebird.yaml](file:///e:/Dev/web/LegaCy/admin-app/shorebird.yaml)
* **Check Shorebird status**:
  ```bash
  shorebird doctor
  ```
* **Build a release version via Shorebird**:
  ```bash
  shorebird release android
  ```
* **Push an instantaneous patch (fix) to live users**:
  ```bash
  shorebird patch android
  ```

For more details on managing code push, refer to the [Shorebird Documentation](https://docs.shorebird.dev).
