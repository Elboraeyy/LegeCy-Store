/// Base URL for the Legacy Admin API.
class ApiConfig {
  ApiConfig._();

  // Production URL — the live Vercel deployment
  static const String baseUrl = 'https://www.legecy.store';

  // For local development only (uncomment when needed):
  // static const String baseUrl = 'http://192.168.1.6:8080';
  // static const String baseUrl = 'http://10.0.2.2:8080'; // Android emulator

  // API prefix
  static const String apiPrefix = '/api/admin';

  // Auth endpoints
  static const String loginEndpoint = '$apiPrefix/auth/login';
  static const String logoutEndpoint = '$apiPrefix/auth/logout';
  static const String profileEndpoint = '$apiPrefix/profile';

  // Orders endpoints
  static const String ordersEndpoint = '$apiPrefix/orders';

  // Dashboard endpoints
  static const String dashboardStatsEndpoint = '$apiPrefix/dashboard/stats';

  // Inventory endpoints
  static const String inventoryEndpoint = '$apiPrefix/inventory';

  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);
}
