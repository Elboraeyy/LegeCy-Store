import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

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


  final _statuses = [
    {'key': 'all', 'label': 'All'},
    {'key': 'pending', 'label': 'Pending'},
    {'key': 'PROCESSING', 'label': 'Processing'},
    {'key': 'SHIPPED', 'label': 'Shipped'},
    {'key': 'delivered', 'label': 'Delivered'},
    {'key': 'CANCELLED', 'label': 'Cancelled'},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _statuses.length, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        _currentStatus = _statuses[_tabController.index]['key']!;
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
      final data = await client.get(path);
      if (mounted) {
        setState(() {
          _orders = data['orders'] as List<dynamic>;
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
    switch (status.toUpperCase()) {
      case 'PENDING': return AppColors.warning;
      case 'PROCESSING': return AppColors.info;
      case 'SHIPPED': return const Color(0xFF7C3AED);
      case 'DELIVERED': return AppColors.success;
      case 'CANCELLED': case 'REJECTED': case 'FAILED': return AppColors.error;
      default: return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Orders', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
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
                  style: GoogleFonts.inter(fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Search by name, phone, or order #',
                    hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted),
                    prefixIcon: const Icon(LucideIcons.search, size: 18),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(LucideIcons.x, size: 16),
                            onPressed: () { _searchController.clear(); _loadOrders(); },
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.cardBorder)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.cardBorder)),
                    filled: true,
                    fillColor: AppColors.background,
                  ),
                ),
              ),
              // Status tabs
              TabBar(
                controller: _tabController,
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                labelColor: AppColors.primaryDark,
                unselectedLabelColor: AppColors.textMuted,
                labelStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600),
                unselectedLabelStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500),
                indicatorColor: AppColors.primaryDark,
                indicatorSize: TabBarIndicatorSize.label,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                tabs: _statuses.map((s) => Tab(text: s['label'])).toList(),
              ),
            ],
          ),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.primaryDark,
        onRefresh: _loadOrders,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
            : _error != null
                ? _buildError()
                : _orders.isEmpty
                    ? _buildEmpty()
                    : _buildList(),
      ),
    );
  }

  Widget _buildList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _orders.length,
      itemBuilder: (context, index) {
        final order = _orders[index];
        final status = (order['status'] ?? '').toString();
        final color = _statusColor(status);

        return GestureDetector(
          onTap: () => _openOrderDetail(order['id']),
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.cardBorder),
            ),
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
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        status.toUpperCase(),
                        style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w700, color: color, letterSpacing: 0.5),
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
                    Text(
                      '${order['itemCount'] ?? 0} items',
                      style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                    ),
                  ],
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
      builder: (_) => _OrderDetailPage(orderId: id),
    )).then((_) => _loadOrders());
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    return '${d.day}/${d.month}/${d.year} ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }
}

// ── Order Detail Page ──
class _OrderDetailPage extends StatefulWidget {
  final String orderId;
  const _OrderDetailPage({required this.orderId});

  @override
  State<_OrderDetailPage> createState() => _OrderDetailPageState();
}

class _OrderDetailPageState extends State<_OrderDetailPage> {
  Map<String, dynamic>? _order;
  bool _isLoading = true;
  bool _isUpdating = false;

  final _statusOptions = ['pending', 'PROCESSING', 'SHIPPED', 'delivered', 'CANCELLED'];

  @override
  void initState() {
    super.initState();
    _loadOrder();
  }

  Future<void> _loadOrder() async {
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/orders/${widget.orderId}');
      if (mounted) setState(() { _order = data; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    setState(() => _isUpdating = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.patch('/api/admin/auth/orders/${widget.orderId}', body: {'status': newStatus});
      await _loadOrder();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Status updated to $newStatus'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isUpdating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          _order != null ? '#${_order!['orderNumber']}' : 'Order',
          style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w600),
        ),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : _order == null
              ? Center(child: Text('Order not found', style: GoogleFonts.inter(color: AppColors.textMuted)))
              : RefreshIndicator(
                  onRefresh: _loadOrder,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildStatusCard(),
                        const SizedBox(height: 16),
                        _buildCustomerCard(),
                        const SizedBox(height: 16),
                        _buildItemsCard(),
                        const SizedBox(height: 16),
                        _buildFinancialCard(),
                        const SizedBox(height: 16),
                        _buildActionsCard(),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildStatusCard() {
    final status = (_order!['status'] ?? '').toString();
    final color = _statusColorFor(status);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(LucideIcons.packageCheck, color: color, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Current Status', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted, letterSpacing: 1)),
                const SizedBox(height: 4),
                Text(status.toUpperCase(), style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: color)),
              ],
            ),
          ),
          // Change status button
          PopupMenuButton<String>(
            onSelected: _updateStatus,
            enabled: !_isUpdating,
            icon: _isUpdating
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                : Icon(LucideIcons.chevronsUpDown, color: AppColors.primaryDark),
            itemBuilder: (context) => _statusOptions
                .where((s) => s != status)
                .map((s) => PopupMenuItem(value: s, child: Text(s.toUpperCase())))
                .toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomerCard() {
    final phone = _order!['customerPhone'] ?? '';
    return _card(
      title: 'CUSTOMER',
      icon: LucideIcons.user,
      children: [
        _infoRow(LucideIcons.user, _order!['displayName'] ?? 'Guest'),
        if ((_order!['customerEmail'] ?? '').toString().isNotEmpty)
          _infoRow(LucideIcons.mail, _order!['customerEmail']),
        if (phone.isNotEmpty) _infoRow(LucideIcons.phone, phone),
        if ((_order!['shippingAddress'] ?? '').toString().isNotEmpty)
          _infoRow(LucideIcons.mapPin, '${_order!['shippingAddress']}, ${_order!['shippingCity'] ?? ''} ${_order!['shippingGovernorate'] ?? ''}'),
        if ((_order!['shippingNotes'] ?? '').toString().isNotEmpty)
          _infoRow(LucideIcons.messageSquare, _order!['shippingNotes']),
      ],
    );
  }

  Widget _buildItemsCard() {
    final items = (_order!['items'] as List?) ?? [];
    return _card(
      title: 'ITEMS (${items.length})',
      icon: LucideIcons.shoppingBag,
      children: items.map<Widget>((item) {
        final product = item['product'];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            children: [
              // Product image
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  width: 50,
                  height: 50,
                  color: AppColors.shimmer,
                  child: product?['imageUrl'] != null
                      ? Image.network(product['imageUrl'], fit: BoxFit.cover,
                          errorBuilder: (_, e, st) => Icon(LucideIcons.image, color: AppColors.textMuted, size: 20))
                      : Icon(LucideIcons.image, color: AppColors.textMuted, size: 20),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item['name'] ?? '', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500), maxLines: 2, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text('SKU: ${item['sku'] ?? '-'}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('×${item['quantity']}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                  Text('${(item['price'] as num).toStringAsFixed(0)} EGP', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildFinancialCard() {
    return _card(
      title: 'SUMMARY',
      icon: LucideIcons.receipt,
      children: [
        _summaryRow('Subtotal', '${(_order!['subtotal'] as num?)?.toStringAsFixed(0) ?? '0'} EGP'),
        _summaryRow('Shipping', '${(_order!['shippingCost'] as num?)?.toStringAsFixed(0) ?? '0'} EGP'),
        if ((_order!['discountAmount'] as num?) != null && (_order!['discountAmount'] as num) > 0)
          _summaryRow('Discount', '-${(_order!['discountAmount'] as num).toStringAsFixed(0)} EGP', color: AppColors.success),
        const Divider(height: 20),
        _summaryRow('Total', '${(_order!['totalPrice'] as num).toStringAsFixed(0)} EGP', isBold: true),
        const SizedBox(height: 8),
        _summaryRow('Payment', (_order!['paymentMethod'] ?? 'cod').toString().toUpperCase()),
      ],
    );
  }

  Widget _buildActionsCard() {
    final phone = _order!['customerPhone'] ?? '';
    return _card(
      title: 'ACTIONS',
      icon: LucideIcons.zap,
      children: [
        Row(
          children: [
            if (phone.isNotEmpty) ...[
              Expanded(
                child: _actionButton(
                  icon: LucideIcons.phone,
                  label: 'Call',
                  color: AppColors.info,
                  onTap: () {},
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _actionButton(
                  icon: LucideIcons.messageCircle,
                  label: 'WhatsApp',
                  color: const Color(0xFF25D366),
                  onTap: () {},
                ),
              ),
              const SizedBox(width: 10),
            ],
            Expanded(
              child: _actionButton(
                icon: LucideIcons.printer,
                label: 'Invoice',
                color: AppColors.primaryDark,
                onTap: () {},
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _actionButton({required IconData icon, required String label, required Color color, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.15)),
        ),
        child: Column(
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(height: 4),
            Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
          ],
        ),
      ),
    );
  }

  Widget _card({required String title, required IconData icon, required List<Widget> children}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: AppColors.textMuted),
              const SizedBox(width: 8),
              Text(title, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 1.5)),
            ],
          ),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 15, color: AppColors.textMuted),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textPrimary))),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value, {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted)),
          Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: isBold ? FontWeight.w700 : FontWeight.w500, color: color ?? AppColors.textPrimary)),
        ],
      ),
    );
  }

  Color _statusColorFor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING': return AppColors.warning;
      case 'PROCESSING': return AppColors.info;
      case 'SHIPPED': return const Color(0xFF7C3AED);
      case 'DELIVERED': return AppColors.success;
      case 'CANCELLED': case 'REJECTED': return AppColors.error;
      default: return AppColors.textMuted;
    }
  }
}
