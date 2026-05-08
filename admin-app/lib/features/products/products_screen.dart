import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';
import 'package:admin_app/features/products/add_product_screen.dart';
import 'package:admin_app/core/config/api_config.dart';

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  final _searchController = TextEditingController();
  List<dynamic> _products = [];
  bool _isLoading = true;
  String? _error;
  String _statusFilter = 'all';
  bool _selectionMode = false;
  final Set<String> _selectedIds = {};

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      String path = '${ApiConfig.authProductsEndpoint}?status=$_statusFilter';
      if (_searchController.text.isNotEmpty) {
        path += '&search=${Uri.encodeComponent(_searchController.text)}';
      }
      final data = await client.get(path);
      if (mounted) {
        setState(() { _products = data['products'] as List<dynamic>; _isLoading = false; });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  void _toggleSelection(String id) {
    HapticFeedback.lightImpact();
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
        if (_selectedIds.isEmpty) _selectionMode = false;
      } else {
        _selectedIds.add(id);
        _selectionMode = true;
      }
    });
  }

  void _exitSelection() {
    setState(() { _selectionMode = false; _selectedIds.clear(); });
  }

  Future<void> _bulkAction(String action, {String? status}) async {
    if (action == 'delete') {
      final ok = await showDialog<bool>(
        context: context,
        builder: (ctx) => _buildConfirmDialog(
          title: 'Delete ${_selectedIds.length} Products?',
          message: 'This action cannot be undone.',
          confirmLabel: 'Delete All',
          isDestructive: true,
        ),
      );
      if (ok != true) return;
    }

    setState(() => _isLoading = true);
    try {
      if (!mounted) return;
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final body = <String, dynamic>{
        'action': action == 'delete' ? 'delete' : 'update_status',
        'ids': _selectedIds.toList(),
      };
      if (status != null) body['status'] = status;
      await client.post('${ApiConfig.authProductsEndpoint}/bulk', body: body);
      if (mounted) {
        _showSnack(action == 'delete' ? 'Products deleted' : 'Status updated', isSuccess: true);
        _exitSelection();
        _loadProducts();
      }
    } catch (e) {
      if (mounted) {
        _showSnack('Failed: $e');
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _deleteSingle(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => _buildConfirmDialog(
        title: 'Delete Product?',
        message: 'This will permanently remove this product and its variants.',
        confirmLabel: 'Delete',
        isDestructive: true,
      ),
    );
    if (ok != true) return;

    setState(() => _isLoading = true);
    try {
      if (!mounted) return;
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.delete('${ApiConfig.authProductsEndpoint}/$id');
      if (mounted) {
        _showSnack('Product deleted', isSuccess: true);
        _loadProducts();
      }
    } catch (e) {
      if (mounted) {
        _showSnack('Failed: $e');
        setState(() => _isLoading = false);
      }
    }
  }

  void _duplicateProduct(Map<String, dynamic> product) {
    final copy = Map<String, dynamic>.from(product);
    copy.remove('id');
    copy['name'] = '${copy['name']} (Copy)';
    Navigator.push(context, MaterialPageRoute(builder: (_) => AddProductScreen(product: copy)))
      .then((r) { if (r == true) _loadProducts(); });
  }

  void _showSnack(String msg, {bool isSuccess = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(color: Colors.white)),
      backgroundColor: isSuccess ? AppColors.success : AppColors.error,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ));
  }

  Widget _buildConfirmDialog({required String title, required String message, required String confirmLabel, bool isDestructive = false}) {
    return AlertDialog(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      title: Text(title, style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
      content: Text(message, style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted, fontWeight: FontWeight.w600))),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, true),
          style: ElevatedButton.styleFrom(
            backgroundColor: isDestructive ? AppColors.error : AppColors.primaryDark,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0,
          ),
          child: Text(confirmLabel),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // ── Premium App Bar ──
          SliverAppBar(
            pinned: true,
            backgroundColor: AppColors.background,
            surfaceTintColor: Colors.transparent,
            expandedHeight: _selectionMode ? 60 : 110,
            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(bottom: Radius.circular(30))),
            leading: _selectionMode
                ? IconButton(icon: const Icon(LucideIcons.x, color: AppColors.primaryDark), onPressed: _exitSelection)
                : null,
            title: _selectionMode
                ? Text('${_selectedIds.length} selected', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.primaryDark))
                : null,
            flexibleSpace: _selectionMode
                ? null
                : FlexibleSpaceBar(
                    titlePadding: const EdgeInsets.only(left: 20, bottom: 16, right: 20),
                    title: Text('Products', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                  ),
            actions: _selectionMode
                ? [
                    IconButton(
                      icon: Icon(_selectedIds.length == _products.length ? LucideIcons.checkSquare : LucideIcons.square, color: AppColors.primaryDark),
                      onPressed: () {
                        setState(() {
                          if (_selectedIds.length == _products.length) {
                            _selectedIds.clear(); _selectionMode = false;
                          } else {
                            _selectedIds.addAll(_products.map((p) => p['id'].toString()));
                          }
                        });
                      },
                    ),
                    PopupMenuButton<String>(
                      icon: const Icon(LucideIcons.moreVertical, color: AppColors.primaryDark),
                      onSelected: (v) => v == 'delete' ? _bulkAction('delete') : _bulkAction('status', status: v),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      itemBuilder: (_) => [
                        PopupMenuItem(value: 'active', child: Row(children: [Container(width: 8, height: 8, decoration: BoxDecoration(color: AppColors.success, shape: BoxShape.circle)), const SizedBox(width: 10), const Text('Set Active')])),
                        PopupMenuItem(value: 'draft', child: Row(children: [Container(width: 8, height: 8, decoration: BoxDecoration(color: AppColors.warning, shape: BoxShape.circle)), const SizedBox(width: 10), const Text('Set Draft')])),
                        const PopupMenuDivider(),
                        const PopupMenuItem(value: 'delete', child: Row(children: [Icon(LucideIcons.trash2, size: 16, color: Colors.red), SizedBox(width: 10), Text('Delete', style: TextStyle(color: Colors.red))])),
                      ],
                    ),
                  ]
                : [
                    IconButton(icon: const Icon(LucideIcons.checkSquare, size: 20, color: AppColors.primaryDark), onPressed: () => setState(() => _selectionMode = true)),
                    const SizedBox(width: 8),
                  ],
          ),

          // ── Search + Filter Bar ──
          if (!_selectionMode)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.cardBorder),
                          boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.03), blurRadius: 12, offset: const Offset(0, 4))],
                        ),
                        child: TextField(
                          controller: _searchController,
                          onSubmitted: (_) => _loadProducts(),
                          style: GoogleFonts.inter(fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Search products...',
                            hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted),
                            prefixIcon: const Icon(LucideIcons.search, size: 18, color: AppColors.textMuted),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(icon: const Icon(LucideIcons.x, size: 16), onPressed: () { _searchController.clear(); _loadProducts(); })
                                : null,
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    PopupMenuButton<String>(
                      onSelected: (v) { _statusFilter = v; _loadProducts(); },
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: _statusFilter != 'all' ? AppColors.accent : AppColors.cardBorder),
                          boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.03), blurRadius: 12, offset: const Offset(0, 4))],
                        ),
                        child: Icon(LucideIcons.slidersHorizontal, size: 18, color: _statusFilter != 'all' ? AppColors.accent : AppColors.textMuted),
                      ),
                      itemBuilder: (_) => [
                        _filterItem('all', 'All Products', AppColors.textMuted),
                        _filterItem('active', 'Active', AppColors.success),
                        _filterItem('draft', 'Draft', AppColors.warning),
                      ],
                    ),
                  ],
                ),
              ),
            ),

          // ── Status filter chips ──
          if (!_selectionMode)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                child: Row(
                  children: [
                    _chip('All', 'all'),
                    const SizedBox(width: 8),
                    _chip('Active', 'active'),
                    const SizedBox(width: 8),
                    _chip('Draft', 'draft'),
                    const Spacer(),
                    Text('${_products.length} items', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                  ],
                ),
              ),
            ),

          // ── Content ──
          _isLoading
              ? const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppColors.primaryDark)))
              : _error != null
                  ? SliverFillRemaining(child: _buildErrorState())
                  : _products.isEmpty
                      ? SliverFillRemaining(child: _buildEmptyState())
                      : SliverPadding(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 140),
                          sliver: SliverGrid(
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              mainAxisSpacing: 14,
                              crossAxisSpacing: 14,
                              childAspectRatio: 0.62,
                            ),
                            delegate: SliverChildBuilderDelegate(
                              (context, index) => _buildProductCard(_products[index]),
                              childCount: _products.length,
                            ),
                          ),
                        ),
        ],
      ),
      floatingActionButton: _selectionMode
          ? null
          : Padding(
              padding: const EdgeInsets.only(bottom: 90),
              child: FloatingActionButton.extended(
                onPressed: () async {
                  HapticFeedback.mediumImpact();
                  final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => const AddProductScreen()));
                  if (result == true) _loadProducts();
                },
                backgroundColor: AppColors.primaryDark,
                foregroundColor: Colors.white,
                elevation: 4,
                icon: const Icon(LucideIcons.plus, size: 20),
                label: Text('New Product', style: GoogleFonts.inter(fontWeight: FontWeight.w600, letterSpacing: 0.5)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
            ),
    );
  }

  PopupMenuItem<String> _filterItem(String value, String label, Color dot) {
    return PopupMenuItem(
      value: value,
      child: Row(children: [
        Container(width: 8, height: 8, decoration: BoxDecoration(color: dot, shape: BoxShape.circle)),
        const SizedBox(width: 10),
        Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: _statusFilter == value ? FontWeight.w700 : FontWeight.w500)),
      ]),
    );
  }

  Widget _chip(String label, String value) {
    final isActive = _statusFilter == value;
    return GestureDetector(
      onTap: () { _statusFilter = value; _loadProducts(); },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primaryDark : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isActive ? AppColors.primaryDark : AppColors.cardBorder),
        ),
        child: Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: isActive ? Colors.white : AppColors.textSecondary)),
      ),
    );
  }

  Widget _buildProductCard(Map<String, dynamic> product) {
    final isActive = product['status'] == 'active';
    final isSelected = _selectedIds.contains(product['id']);
    final priceRaw = product['price'];
    final priceNum = priceRaw is String ? num.tryParse(priceRaw) : priceRaw as num?;
    final price = priceNum?.toStringAsFixed(0) ?? '0';
    
    final compRaw = product['compareAtPrice'];
    final compareAt = compRaw is String ? num.tryParse(compRaw) : compRaw as num?;
    
    final stockRaw = product['totalStock'];
    final stock = (stockRaw is String ? int.tryParse(stockRaw) : stockRaw as int?) ?? 0;

    return GestureDetector(
      onLongPress: () { HapticFeedback.mediumImpact(); _toggleSelection(product['id']); },
      onTap: () {
        if (_selectionMode) { _toggleSelection(product['id']); return; }
        HapticFeedback.lightImpact();
        Navigator.push(context, MaterialPageRoute(builder: (_) => AddProductScreen(product: product)))
            .then((r) { if (r == true) _loadProducts(); });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppColors.accent : AppColors.cardBorder, width: isSelected ? 2 : 1),
          boxShadow: [
            BoxShadow(color: AppColors.primaryDark.withValues(alpha: isSelected ? 0.08 : 0.04), blurRadius: 16, offset: const Offset(0, 6)),
          ],
        ),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Image ──
                Expanded(
                  flex: 5,
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(19)),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        product['imageUrl'] != null
                            ? CachedNetworkImage(
                                imageUrl: product['imageUrl'],
                                fit: BoxFit.cover,
                                placeholder: (_, _) => Container(color: AppColors.shimmer),
                                errorWidget: (_, _, _) => Container(
                                  color: AppColors.shimmer,
                                  child: const Center(child: Icon(LucideIcons.image, color: AppColors.textMuted, size: 28)),
                                ),
                              )
                            : Container(
                                color: AppColors.shimmer,
                                child: Center(
                                  child: Icon(LucideIcons.image, color: AppColors.textMuted.withValues(alpha: 0.4), size: 36),
                                ),
                              ),
                        // Gradient overlay at bottom
                        Positioned(
                          bottom: 0, left: 0, right: 0,
                          child: Container(
                            height: 40,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [Colors.transparent, Colors.black.withValues(alpha: 0.15)],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // ── Info Section ──
                Expanded(
                  flex: 3,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Name
                        Text(
                          product['name'] ?? '',
                          style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary, height: 1.3),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        // Price Row
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (compareAt != null)
                                    Text(
                                      '${compareAt.toStringAsFixed(0)} EGP',
                                      style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted, decoration: TextDecoration.lineThrough, decorationColor: AppColors.textMuted),
                                    ),
                                  Text(
                                    '$price EGP',
                                    style: GoogleFonts.playfairDisplay(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.primaryDark),
                                  ),
                                ],
                              ),
                            ),
                            // Stock badge
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: (stock as int) > 0
                                    ? AppColors.success.withValues(alpha: 0.08)
                                    : AppColors.error.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                stock > 0 ? '$stock' : 'Out',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: stock > 0 ? AppColors.success : AppColors.error,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // ── Status Badge ──
            Positioned(
              top: 10, right: 10,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isActive ? AppColors.primaryDark : AppColors.warning,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 8, offset: const Offset(0, 2))],
                ),
                child: Text(
                  isActive ? 'ACTIVE' : 'DRAFT',
                  style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 1),
                ),
              ),
            ),

            // ── Selection Indicator ──
            if (_selectionMode)
              Positioned(
                top: 10, left: 10,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 26, height: 26,
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.accent : Colors.white.withValues(alpha: 0.9),
                    shape: BoxShape.circle,
                    border: Border.all(color: isSelected ? AppColors.accent : AppColors.cardBorder, width: 2),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 6)],
                  ),
                  child: isSelected ? const Icon(LucideIcons.check, size: 14, color: Colors.white) : null,
                ),
              ),

            // ── Quick Menu ──
            if (!_selectionMode)
              Positioned(
                top: 6, left: 6,
                child: PopupMenuButton<String>(
                  icon: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.85),
                      shape: BoxShape.circle,
                      boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 8)],
                    ),
                    child: const Icon(LucideIcons.moreHorizontal, size: 14, color: AppColors.primaryDark),
                  ),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  onSelected: (v) {
                    if (v == 'duplicate') {
                      _duplicateProduct(product);
                    } else if (v == 'delete') {
                      _deleteSingle(product['id']);
                    }
                  },
                  itemBuilder: (_) => [
                    PopupMenuItem(value: 'duplicate', child: Row(children: [Icon(LucideIcons.copy, size: 16, color: AppColors.textSecondary), const SizedBox(width: 10), Text('Duplicate', style: GoogleFonts.inter(fontSize: 13))])),
                    const PopupMenuDivider(),
                    PopupMenuItem(value: 'delete', child: Row(children: [const Icon(LucideIcons.trash2, size: 16, color: Colors.red), const SizedBox(width: 10), Text('Delete', style: GoogleFonts.inter(fontSize: 13, color: Colors.red))])),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.08), shape: BoxShape.circle),
              child: Icon(LucideIcons.package, size: 48, color: AppColors.accent.withValues(alpha: 0.5)),
            ),
            const SizedBox(height: 24),
            Text('No Products Yet', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
            const SizedBox(height: 8),
            Text('Start building your catalog by\nadding your first product.', textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted, height: 1.5)),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: AppColors.error.withValues(alpha: 0.08), shape: BoxShape.circle),
              child: Icon(LucideIcons.wifiOff, size: 40, color: AppColors.error.withValues(alpha: 0.5)),
            ),
            const SizedBox(height: 20),
            Text('Failed to Load', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.error)),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _loadProducts, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
