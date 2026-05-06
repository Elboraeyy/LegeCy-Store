import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';
import 'package:admin_app/features/orders/create_manual_order_screen.dart';
import 'package:admin_app/features/orders/order_details_screen.dart';
import 'package:admin_app/core/constants/order_constants.dart';
import 'package:flutter/services.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _searchController = TextEditingController();
  List<dynamic> _orders = [];
  bool _isLoading = true;
  String? _error;
  String _currentStatus = 'all';
  Map<String, int> _counts = {};
  
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isSelectionMode = false;
  final Set<String> _selectedOrderIds = {};



  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: OrderConstants.statuses.length, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        _currentStatus = OrderConstants.statuses[_tabController.index]['key']!;
        _loadOrders();
      }
    });
    _loadOrders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      String path = '/api/admin/auth/orders?status=$_currentStatus';
      if (_searchController.text.isNotEmpty) {
        path += '&search=${Uri.encodeComponent(_searchController.text)}';
      }
      if (_startDate != null) {
        path += '&startDate=${_startDate!.toIso8601String()}';
      }
      if (_endDate != null) {
        path += '&endDate=${_endDate!.toIso8601String()}';
      }
      final data = await client.get(path);
      if (mounted) {
        setState(() {
          _orders = data['orders'] as List<dynamic>;
          _counts = (data['counts'] as Map<dynamic, dynamic>?)?.map(
            (k, v) => MapEntry(k.toString(), v as int)
          ) ?? {};
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _error = e.toString(); _isLoading = false; });
      }
    }
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'payment_pending': return const Color(0xFF7C3AED);
      case 'pending': return const Color(0xFFB76E00);
      case 'paid': return const Color(0xFF166534);
      case 'confirmed': return const Color(0xFF166534);
      case 'preparing': return const Color(0xFF0D9488);
      case 'shipped': return const Color(0xFF1E40AF);
      case 'delivered': return const Color(0xFF166534);
      case 'cancelled': return const Color(0xFF991B1B);
      case 'refunded': return const Color(0xFFCA8A04);
      case 'payment_failed': return const Color(0xFF991B1B);
      case 'cash_received': return const Color(0xFF166534);
      default: return AppColors.textMuted;
    }
  }

  String _statusLabel(String status) {
    return status.replaceAll('_', ' ').toUpperCase();
  }

  IconData _sourceIcon(String source) {
    switch (source.toLowerCase()) {
      case 'whatsapp': return LucideIcons.messageCircle;
      case 'facebook': return LucideIcons.facebook;
      case 'instagram': return LucideIcons.instagram;
      case 'phone': return LucideIcons.phone;
      case 'website': return LucideIcons.globe;
      case 'in-person': return LucideIcons.user;
      default: return LucideIcons.globe;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Orders', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w600, color: AppColors.primaryDark)),
        backgroundColor: AppColors.background,
        surfaceTintColor: Colors.transparent,
        actions: [
          if (_startDate != null)
            IconButton(
              icon: const Icon(LucideIcons.xCircle, color: AppColors.error, size: 20),
              onPressed: () {
                setState(() { _startDate = null; _endDate = null; });
                _loadOrders();
              },
            ),
          IconButton(
            icon: Icon(LucideIcons.calendar, color: _startDate != null ? AppColors.primaryDark : AppColors.textPrimary, size: 20),
            onPressed: _showDateRangePicker,
          ),
          IconButton(
            icon: Icon(_isSelectionMode ? LucideIcons.x : LucideIcons.checkSquare, color: AppColors.primaryDark, size: 20),
            onPressed: () {
              setState(() {
                _isSelectionMode = !_isSelectionMode;
                if (!_isSelectionMode) _selectedOrderIds.clear();
              });
            },
          ),
          const SizedBox(width: 8),
        ],
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(
            bottom: Radius.circular(30),
          ),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(100),
          child: Column(
            children: [
              // Search bar
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: TextField(
                  controller: _searchController,
                  onSubmitted: (_) => _loadOrders(),
                  style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'Search by name, phone, or order #',
                    hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted),
                    prefixIcon: Icon(LucideIcons.search, size: 18, color: AppColors.textMuted),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(LucideIcons.x, size: 16, color: AppColors.textPrimary),
                            onPressed: () { _searchController.clear(); _loadOrders(); },
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFD4AF37))),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
              ),
              // Status tabs
              TabBar(
                controller: _tabController,
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                labelColor: const Color(0xFFD4AF37), // Gold
                unselectedLabelColor: AppColors.textMuted,
                labelStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600),
                unselectedLabelStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500),
                indicatorColor: const Color(0xFFD4AF37),
                indicatorSize: TabBarIndicatorSize.label,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                tabs: OrderConstants.statuses.map((s) {
                  final count = _counts[s['key']?.toString().toLowerCase()] ?? 0;
                  return Tab(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(s['label']!),
                        if (count > 0) ...[
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                            decoration: BoxDecoration(
                              color: _tabController.index == OrderConstants.statuses.indexOf(s) 
                                ? const Color(0xFFD4AF37) 
                                : AppColors.textMuted.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              count > 999 ? '999+' : count.toString(),
                              style: GoogleFonts.inter(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: _tabController.index == OrderConstants.statuses.indexOf(s) 
                                  ? Colors.white 
                                  : AppColors.textMuted,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: OrderConstants.statuses.map((s) => RefreshIndicator(
          color: AppColors.primaryDark,
          onRefresh: _loadOrders,
          child: _isLoading
              ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
              : _error != null
                  ? _buildError()
                  : _orders.isEmpty
                      ? _buildEmpty()
                      : _buildList(),
        )).toList(),
      ),
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 90),
        child: _isSelectionMode
            ? FloatingActionButton.extended(
                onPressed: _selectedOrderIds.isEmpty ? null : _showBulkStatusPicker,
                backgroundColor: _selectedOrderIds.isEmpty ? AppColors.divider : AppColors.primaryDark,
                foregroundColor: Colors.white,
                elevation: 4,
                icon: const Icon(LucideIcons.edit, size: 20),
                label: Text('Update Status (${_selectedOrderIds.length})', style: GoogleFonts.inter(fontWeight: FontWeight.w600, letterSpacing: 0.5)),
              )
            : FloatingActionButton.extended(
                onPressed: _openCreateOrder,
                backgroundColor: AppColors.primaryDark,
                foregroundColor: Colors.white,
                elevation: 4,
                icon: const Icon(LucideIcons.plus, size: 20),
                label: Text('Manual Order', style: GoogleFonts.inter(fontWeight: FontWeight.w600, letterSpacing: 0.5)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
      ),
    );
  }

  void _openCreateOrder() {
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => const CreateManualOrderScreen(),
    )).then((_) => _loadOrders());
  }

  Widget _buildList() {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 140),
      itemCount: _orders.length,
      itemBuilder: (context, index) {
        final order = _orders[index];
        final status = (order['status'] ?? '').toString();
        final color = _statusColor(status);

        return GestureDetector(
          onTap: () {
            if (_isSelectionMode) {
              setState(() {
                if (_selectedOrderIds.contains(order['id'])) {
                  _selectedOrderIds.remove(order['id']);
                } else {
                  _selectedOrderIds.add(order['id']);
                }
              });
            } else {
              _openOrderDetail(order['id']);
            }
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _selectedOrderIds.contains(order['id']) ? AppColors.primaryDark : AppColors.cardBorder, width: _selectedOrderIds.contains(order['id']) ? 2 : 1),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_isSelectionMode) ...[
                  Padding(
                    padding: const EdgeInsets.only(top: 2, right: 12),
                    child: Icon(
                      _selectedOrderIds.contains(order['id']) ? LucideIcons.checkSquare : LucideIcons.square,
                      color: _selectedOrderIds.contains(order['id']) ? AppColors.primaryDark : AppColors.textMuted,
                      size: 20,
                    ),
                  ),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '#${order['orderNumber']}',
                      style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.primaryDark),
                    ),
                    GestureDetector(
                      onTap: () {
                        if (!OrderConstants.terminalStates.contains(status.toLowerCase())) {
                          _showStatusPicker(order);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: color.withValues(alpha: 0.1), width: 1),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              _statusLabel(status),
                              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.5),
                            ),
                            if (!OrderConstants.terminalStates.contains(status.toLowerCase())) ...[
                              const SizedBox(width: 4),
                              Icon(LucideIcons.chevronDown, size: 12, color: color),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Icon(LucideIcons.user, size: 14, color: AppColors.textMuted),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        order['displayName'] ?? 'Guest',
                        style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(LucideIcons.mapPin, size: 14, color: AppColors.textMuted),
                        const SizedBox(width: 6),
                        Text(
                          order['shippingGovernorate'] ?? order['shippingCity'] ?? '-',
                          style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                    Text(
                      '${(order['totalPrice'] as num?)?.toStringAsFixed(0) ?? '0'} EGP',
                      style: GoogleFonts.playfairDisplay(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.primaryDark),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _formatDate(order['createdAt']),
                      style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                    ),
                    Row(
                      children: [
                        Icon(_sourceIcon((order['source'] ?? 'website').toString()), size: 12, color: AppColors.textMuted),
                        const SizedBox(width: 4),
                        Text(
                          '${order['itemCount'] ?? 0} items',
                          style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
            ),
            ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.inbox, size: 48, color: AppColors.textMuted.withValues(alpha: 0.4)),
          const SizedBox(height: 16),
          Text('No orders found', style: GoogleFonts.inter(fontSize: 16, color: AppColors.textMuted)),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.wifiOff, size: 48, color: AppColors.error.withValues(alpha: 0.5)),
            const SizedBox(height: 16),
            Text('Failed to load orders', style: GoogleFonts.inter(fontSize: 16, color: AppColors.error)),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _loadOrders, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }

  void _openOrderDetail(String id) {
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => OrderDetailsScreen(orderId: id),
    )).then((_) => _loadOrders());
  }

  void _showStatusPicker(Map<String, dynamic> order) {
    final currentStatus = (order['status'] ?? '').toString().toLowerCase();
    final allowed = OrderConstants.allowedTransitions[currentStatus] ?? [];
    
    if (allowed.isEmpty) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.divider,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Update Order Status',
              style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark),
            ),
            const SizedBox(height: 8),
            Text(
              'Select the next state for order #${order['orderNumber']}',
              style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: allowed.length,
                separatorBuilder: (_, _) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final status = allowed[index];
                  final color = _statusColor(status);
                  return InkWell(
                    onTap: () async {
                      HapticFeedback.lightImpact();
                      Navigator.pop(context);
                      _confirmStatusUpdate(order, status);
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Row(
                        children: [
                          Container(
                            width: 12,
                            height: 12,
                            decoration: BoxDecoration(
                              color: color,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Text(
                            _statusLabel(status),
                            style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                          ),
                          const Spacer(),
                          Icon(LucideIcons.chevronRight, size: 18, color: AppColors.textMuted),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _confirmStatusUpdate(Map<String, dynamic> order, String newStatus) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('Change Status?', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700)),
        content: Text(
          'Are you sure you want to update order #${order['orderNumber']} status from "${_statusLabel(order['status'])}" to "${_statusLabel(newStatus)}"?',
          style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted, fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            onPressed: () async {
              HapticFeedback.mediumImpact();
              Navigator.pop(context);
              _updateOrderStatus(order['id'], newStatus);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: newStatus == 'cancelled' ? AppColors.error : AppColors.primaryDark,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            ),
            child: Text('Confirm Update'),
          ),
        ],
      ),
    );
  }

  Future<void> _updateOrderStatus(String id, String status) async {
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.patch('/api/admin/auth/orders/$id', body: {'status': status});
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Order status updated successfully'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
      _loadOrders();
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update status: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _showDateRangePicker() async {
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: _startDate != null && _endDate != null
          ? DateTimeRange(start: _startDate!, end: _endDate!)
          : null,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primaryDark,
              onPrimary: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
      _loadOrders();
    }
  }

  void _showBulkStatusPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: AppColors.divider, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 24),
            Text('Bulk Update Status', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            Flexible(
              child: ListView.separated(
                shrinkWrap: true,
                physics: const BouncingScrollPhysics(),
                itemCount: OrderConstants.statuses.length,
                separatorBuilder: (context, index) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final status = OrderConstants.statuses[index]['key']!;
                  if (status == 'all') return const SizedBox.shrink();
                  final color = _statusColor(status);
                  return InkWell(
                    onTap: () {
                      Navigator.pop(context);
                      _updateBulkStatus(status);
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      child: Row(
                        children: [
                          Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                          const SizedBox(width: 16),
                          Text(_statusLabel(status), style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _updateBulkStatus(String newStatus) async {
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.patch('/api/admin/auth/orders/bulk', body: {
        'orderIds': _selectedOrderIds.toList(),
        'status': newStatus,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Orders updated successfully'), backgroundColor: AppColors.success));
        setState(() {
          _isSelectionMode = false;
          _selectedOrderIds.clear();
        });
      }
      _loadOrders();
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.error));
      }
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    return '${d.day}/${d.month}/${d.year} ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }
}
