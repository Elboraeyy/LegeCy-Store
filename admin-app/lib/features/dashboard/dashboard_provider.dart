import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class DashboardProvider extends ChangeNotifier {
  bool _isLoading = false;
  String? _error;

  // Core stats
  int _todayOrders = 0;
  double _todayRevenue = 0;
  int _pendingOrders = 0;
  int _processingOrders = 0;
  int _shippedOrders = 0;
  int _totalProducts = 0;
  int _lowStockCount = 0;

  // Comparisons
  int _yesterdayOrders = 0;
  double _yesterdayRevenue = 0;
  int _revenueChange = 0;
  int _ordersChange = 0;

  // Customer stats
  int _totalCustomers = 0;
  int _newCustomersToday = 0;

  // Monthly
  double _monthlyRevenue = 0;
  int _totalOrdersThisMonth = 0;

  // Charts
  List<Map<String, dynamic>> _weeklyChart = [];
  Map<String, int> _statusBreakdown = {};

  // Lists
  List<Map<String, dynamic>> _recentOrders = [];
  List<Map<String, dynamic>> _topProducts = [];

  // Badges
  int _recentReviews = 0;
  int _pendingMessages = 0;
  int _pendingStockRequests = 0;
  int _activeCoupons = 0;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get todayOrders => _todayOrders;
  double get todayRevenue => _todayRevenue;
  int get pendingOrders => _pendingOrders;
  int get processingOrders => _processingOrders;
  int get shippedOrders => _shippedOrders;
  int get totalProducts => _totalProducts;
  int get lowStockCount => _lowStockCount;
  int get yesterdayOrders => _yesterdayOrders;
  double get yesterdayRevenue => _yesterdayRevenue;
  int get revenueChange => _revenueChange;
  int get ordersChange => _ordersChange;
  int get totalCustomers => _totalCustomers;
  int get newCustomersToday => _newCustomersToday;
  double get monthlyRevenue => _monthlyRevenue;
  int get totalOrdersThisMonth => _totalOrdersThisMonth;
  List<Map<String, dynamic>> get weeklyChart => _weeklyChart;
  Map<String, int> get statusBreakdown => _statusBreakdown;
  List<Map<String, dynamic>> get recentOrders => _recentOrders;
  List<Map<String, dynamic>> get topProducts => _topProducts;
  int get recentReviews => _recentReviews;
  int get pendingMessages => _pendingMessages;
  int get pendingStockRequests => _pendingStockRequests;
  int get activeCoupons => _activeCoupons;

  Future<void> loadDashboard(BuildContext context) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/dashboard');

      _todayOrders = (data['todayOrders'] as num?)?.toInt() ?? 0;
      _todayRevenue = (data['todayRevenue'] as num?)?.toDouble() ?? 0;
      _pendingOrders = (data['pendingOrders'] as num?)?.toInt() ?? 0;
      _processingOrders = (data['processingOrders'] as num?)?.toInt() ?? 0;
      _shippedOrders = (data['shippedOrders'] as num?)?.toInt() ?? 0;
      _totalProducts = (data['totalProducts'] as num?)?.toInt() ?? 0;
      _lowStockCount = (data['lowStockCount'] as num?)?.toInt() ?? 0;

      _yesterdayOrders = (data['yesterdayOrders'] as num?)?.toInt() ?? 0;
      _yesterdayRevenue = (data['yesterdayRevenue'] as num?)?.toDouble() ?? 0;
      _revenueChange = (data['revenueChange'] as num?)?.toInt() ?? 0;
      _ordersChange = (data['ordersChange'] as num?)?.toInt() ?? 0;

      _totalCustomers = (data['totalCustomers'] as num?)?.toInt() ?? 0;
      _newCustomersToday = (data['newCustomersToday'] as num?)?.toInt() ?? 0;

      _monthlyRevenue = (data['monthlyRevenue'] as num?)?.toDouble() ?? 0;
      _totalOrdersThisMonth =
          (data['totalOrdersThisMonth'] as num?)?.toInt() ?? 0;

      _weeklyChart = List<Map<String, dynamic>>.from(data['weeklyChart'] ?? []);
      final rawStatus = data['statusBreakdown'] as Map<String, dynamic>? ?? {};
      _statusBreakdown = rawStatus.map(
        (k, v) => MapEntry(k, (v as num).toInt()),
      );

      _recentOrders = List<Map<String, dynamic>>.from(
        data['recentOrders'] ?? [],
      );
      _topProducts = List<Map<String, dynamic>>.from(data['topProducts'] ?? []);

      _recentReviews = (data['recentReviews'] as num?)?.toInt() ?? 0;
      _pendingMessages = (data['pendingMessages'] as num?)?.toInt() ?? 0;
      _pendingStockRequests =
          (data['pendingStockRequests'] as num?)?.toInt() ?? 0;
      _activeCoupons = (data['activeCoupons'] as num?)?.toInt() ?? 0;

      _isLoading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.message;
      _isLoading = false;
      notifyListeners();

      if (e.isUnauthorized) {
        if (context.mounted) {
          context.read<AuthProvider>().logout();
        }
      }
    } catch (e) {
      _error = 'Could not connect to the server';
      _isLoading = false;
      notifyListeners();
    }
  }
}
