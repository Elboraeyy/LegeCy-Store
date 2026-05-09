import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _inventory = [];
  List<dynamic> _filteredInventory = [];
  List<dynamic> _alerts = [];
  Map<String, dynamic> _summary = {};
  final TextEditingController _searchController = TextEditingController();
  String _filter = 'all'; // all, low, out

  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadInventory();
    _searchController.addListener(_applyFilter);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadInventory() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/inventory');

      if (mounted) {
        setState(() {
          _inventory = data['inventory'] ?? [];
          _alerts = data['alerts'] ?? [];
          _summary = data['summary'] ?? {};
          _applyFilter();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  void _applyFilter() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filteredInventory = _inventory.where((item) {
        final name = item['productName']?.toString().toLowerCase() ?? '';
        final sku = item['sku']?.toString().toLowerCase() ?? '';
        final matchSearch = name.contains(query) || sku.contains(query);
        if (_filter == 'low') return matchSearch && item['isLowStock'] == true;
        if (_filter == 'out') return matchSearch && item['isOutOfStock'] == true;
        return matchSearch;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Inventory', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.accent,
          indicatorWeight: 3,
          labelColor: AppColors.primaryDark,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
          tabs: [
            Tab(text: 'Stock (${_inventory.length})'),
            Tab(text: 'Alerts (${_alerts.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : _error != null
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error), const SizedBox(height: 16), Text(_error!, style: GoogleFonts.inter(color: AppColors.error)), const SizedBox(height: 16), ElevatedButton(onPressed: _loadInventory, child: const Text('Retry'))]))
              : TabBarView(
                  controller: _tabController,
                  children: [_buildStockTab(), _buildAlertsTab()],
                ),
    );
  }

  Widget _buildStockTab() {
    return RefreshIndicator(
      onRefresh: _loadInventory,
      color: AppColors.primaryDark,
      child: CustomScrollView(
        slivers: [
          // Summary Cards
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(child: _buildSummaryCard('Total Items', '${_summary['totalItems'] ?? 0}', LucideIcons.package, const Color(0xFF3B82F6))),
                  const SizedBox(width: 10),
                  Expanded(child: _buildSummaryCard('Low Stock', '${_summary['lowStock'] ?? 0}', LucideIcons.alertTriangle, const Color(0xFFF59E0B))),
                  const SizedBox(width: 10),
                  Expanded(child: _buildSummaryCard('Out of Stock', '${_summary['outOfStock'] ?? 0}', LucideIcons.xCircle, const Color(0xFFEF4444))),
                ],
              ),
            ),
          ),

          // Search + Filter
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Container(
                decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.cardBorder)),
                child: TextField(
                  controller: _searchController,
                  style: GoogleFonts.inter(fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Search by product or SKU...',
                    hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted),
                    prefixIcon: const Icon(LucideIcons.search, size: 18, color: AppColors.textMuted),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Row(
                children: [
                  _buildChip('All', 'all'),
                  const SizedBox(width: 8),
                  _buildChip('Low Stock', 'low'),
                  const SizedBox(width: 8),
                  _buildChip('Out of Stock', 'out'),
                  const Spacer(),
                  Text('${_filteredInventory.length} items', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                ],
              ),
            ),
          ),

          // Inventory List
          _filteredInventory.isEmpty
              ? SliverFillRemaining(
                  child: Center(
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: AppColors.primaryDark.withValues(alpha: 0.05), shape: BoxShape.circle), child: const Icon(LucideIcons.package, size: 48, color: AppColors.primaryDark)),
                      const SizedBox(height: 24),
                      Text('No inventory found', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                    ]),
                  ),
                )
              : SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final item = _filteredInventory[index];
                      final isLow = item['isLowStock'] == true;
                      final isOut = item['isOutOfStock'] == true;
                      final statusColor = isOut ? AppColors.error : isLow ? AppColors.warning : AppColors.success;

                      return Container(
                        margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: isOut ? AppColors.error.withValues(alpha: 0.3) : isLow ? AppColors.warning.withValues(alpha: 0.3) : AppColors.cardBorder),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44, height: 44,
                              decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                              child: Icon(isOut ? LucideIcons.xCircle : isLow ? LucideIcons.alertTriangle : LucideIcons.checkCircle2, size: 20, color: statusColor),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item['productName'] ?? '', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                                  const SizedBox(height: 2),
                                  Text('SKU: ${item['sku']} • ${item['warehouseName']}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('${item['available']}', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800, color: statusColor)),
                                Text('min: ${item['minStock']}', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted)),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                    childCount: _filteredInventory.length,
                  ),
                ),
          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
    );
  }

  Widget _buildAlertsTab() {
    if (_alerts.isEmpty) {
      return Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(LucideIcons.checkCircle2, size: 48, color: AppColors.success)),
          const SizedBox(height: 24),
          Text('All Clear!', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
          const SizedBox(height: 8),
          Text('No active stock alerts at this time.', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
        ]),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: _alerts.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final alert = _alerts[index];
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.error.withValues(alpha: 0.2)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: AppColors.error.withValues(alpha: 0.1), shape: BoxShape.circle),
                child: const Icon(LucideIcons.alertTriangle, size: 20, color: AppColors.error),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(alert['productName'] ?? '', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text('${alert['alertType']} • SKU: ${alert['sku']}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                    Text('Warehouse: ${alert['warehouseName']}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('${alert['currentStock']}', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.error)),
                  Text('min: ${alert['threshold']}', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted)),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSummaryCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.cardBorder)),
      child: Column(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 8),
          Text(value, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
          const SizedBox(height: 4),
          Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildChip(String label, String value) {
    final isSelected = _filter == value;
    return GestureDetector(
      onTap: () { setState(() => _filter = value); _applyFilter(); },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryDark : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppColors.primaryDark : AppColors.cardBorder),
        ),
        child: Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: isSelected ? Colors.white : AppColors.textSecondary)),
      ),
    );
  }
}
