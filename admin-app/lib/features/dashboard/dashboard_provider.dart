import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class DashboardProvider extends ChangeNotifier {
  bool _isLoading = false;
  String? _error;

  int _todayOrders = 0;
  double _todayRevenue = 0;
  int _pendingOrders = 0;
  int _totalProducts = 0;
  int _lowStockCount = 0;

  bool get isLoading => _isLoading;
  String? get error => _error;
  int get todayOrders => _todayOrders;
  double get todayRevenue => _todayRevenue;
  int get pendingOrders => _pendingOrders;
  int get totalProducts => _totalProducts;
  int get lowStockCount => _lowStockCount;

  Future<void> loadStats(BuildContext context) async {
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
      _totalProducts = (data['totalProducts'] as num?)?.toInt() ?? 0;
      _lowStockCount = (data['lowStockCount'] as num?)?.toInt() ?? 0;

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
