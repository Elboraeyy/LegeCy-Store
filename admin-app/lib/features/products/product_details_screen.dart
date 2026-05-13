import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/features/auth/auth_provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/products/add_product_screen.dart';

class ProductDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> product;

  const ProductDetailsScreen({super.key, required this.product});

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> with SingleTickerProviderStateMixin {
  late Map<String, dynamic> _product;
  late TabController _infoTabController;
  bool _isLoading = false;
  List<dynamic> _reviews = [];

  @override
  void initState() {
    super.initState();
    _product = Map<String, dynamic>.from(widget.product);
    _infoTabController = TabController(length: 3, vsync: this);
    _loadReviews();
  }

  Future<void> _refreshProduct() async {
    setState(() => _isLoading = true);
    try {
      final client = ApiClient(token: context.read<AuthProvider>().token);
      final data = await client.get('/api/products/${_product['id']}');
      if (mounted) {
        setState(() {
          _product = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      _snack('Failed to refresh: $e');
    }
  }

  Future<void> _loadReviews() async {
    try {
      final client = ApiClient(token: context.read<AuthProvider>().token);
      final data = await client.get('/api/admin/auth/reviews?limit=100');
      final allReviews = data['reviews'] as List<dynamic>;
      
      // Filter reviews for this product
      // Note: We need to ensure the API returns productId or use productName match as fallback
      if (mounted) {
        setState(() {
          _reviews = allReviews.where((r) => 
            r['productId'] == _product['id'] || 
            r['productName'] == _product['name']
          ).toList();
        });
      }
    } catch (_) {}
  }

  void _snack(String m, {bool ok = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(m, style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w500)),
      backgroundColor: ok ? AppColors.success : AppColors.error,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      margin: const EdgeInsets.all(20),
    ));
  }

  @override
  void dispose() {
    _infoTabController.dispose();
    super.dispose();
  }

  void _navigateToEdit() async {
    HapticFeedback.lightImpact();
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => AddProductScreen(product: _product)),
    );
    if (result == true) {
      // In a real scenario, you'd fetch the updated product.
      // For now, we will just pop to the previous screen to reload.
      if (mounted) Navigator.pop(context, true);
    }
  }

  Future<void> _updateProduct(Map<String, dynamic> data) async {
    setState(() => _isLoading = true);
    try {
      final client = ApiClient(token: context.read<AuthProvider>().token);
      await client.put('/api/admin/auth/products/${_product['id']}', body: data);
      await _refreshProduct();
      _snack('Product updated successfully', ok: true);
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      _snack('Update failed: $e');
    }
  }

  void _showStockDialog() {
    final stockController = TextEditingController(text: (_product['totalStock'] ?? _product['stock'] ?? 0).toString());
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Adjust Stock', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Enter total stock units available for this product.', style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary)),
            const SizedBox(height: 16),
            TextField(
              controller: stockController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Quantity',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _updateProduct({'stock': int.tryParse(stockController.text) ?? 0});
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryDark, foregroundColor: Colors.white),
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showDiscountDialog() {
    final currentPrice = (_product['price'] as num?)?.toDouble() ?? 0.0;
    final currentCompareAt = (_product['compareAtPrice'] as num?)?.toDouble() ?? 0.0;
    
    // If we are currently on sale, the 'original' price is compareAtPrice.
    // If not, the 'original' price is price.
    final originalPrice = currentCompareAt > 0 ? currentCompareAt : currentPrice;
    final saleController = TextEditingController(text: currentCompareAt > 0 ? currentPrice.toStringAsFixed(0) : "");

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Apply Discount', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Original Price: ${originalPrice.toStringAsFixed(0)} EGP', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            Text('Enter the new discounted price. Leave empty to remove discount.', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
            const SizedBox(height: 16),
            TextField(
              controller: saleController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Sale Price',
                prefixText: 'EGP ',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              final salePrice = double.tryParse(saleController.text);
              if (salePrice != null && salePrice < originalPrice) {
                _updateProduct({
                  'price': salePrice,
                  'compareAtPrice': originalPrice,
                });
              } else {
                // Remove discount
                _updateProduct({
                  'price': originalPrice,
                  'compareAtPrice': null,
                });
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryDark, foregroundColor: Colors.white),
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }

  void _showBadgeDialog() {
    final List<String> currentTags = List<String>.from(_product['detailTags'] ?? []);
    final tagController = TextEditingController();
    
    final List<String> suggestions = ['New|#3B82F6', 'Hot|#EF4444', 'Sale|#F59E0B', 'Limited|#8B5CF6', 'Best Seller|#10B981'];
    final List<Map<String, String>> colorOptions = [
      {'name': 'Blue', 'hex': '#3B82F6'},
      {'name': 'Red', 'hex': '#EF4444'},
      {'name': 'Amber', 'hex': '#F59E0B'},
      {'name': 'Green', 'hex': '#10B981'},
      {'name': 'Purple', 'hex': '#8B5CF6'},
      {'name': 'Dark', 'hex': '#1E293B'},
    ];
    String selectedHex = colorOptions[0]['hex']!;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text('Product Badges', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: currentTags.map((tag) {
                    final parts = tag.split('|');
                    final label = parts[0];
                    final color = parts.length > 1 ? _parseColor(parts[1], AppColors.primaryDark) : AppColors.primaryDark;
                    return Chip(
                      label: Text(label, style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.bold)),
                      backgroundColor: color,
                      deleteIconColor: Colors.white,
                      onDeleted: () {
                        setDialogState(() => currentTags.remove(tag));
                      },
                    );
                  }).toList(),
                ),
                if (currentTags.isNotEmpty) const Divider(height: 24),
                Text('Add Custom Badge', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: colorOptions.map((c) => GestureDetector(
                    onTap: () => setDialogState(() => selectedHex = c['hex']!),
                    child: Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        color: _parseColor(c['hex']!, Colors.grey),
                        shape: BoxShape.circle,
                        border: Border.all(color: selectedHex == c['hex'] ? Colors.white : Colors.transparent, width: 2),
                        boxShadow: [
                          if (selectedHex == c['hex']) BoxShadow(color: _parseColor(c['hex']!, Colors.grey).withValues(alpha: 0.5), blurRadius: 8)
                        ],
                      ),
                      child: selectedHex == c['hex'] ? const Icon(LucideIcons.check, size: 16, color: Colors.white) : null,
                    ),
                  )).toList(),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: tagController,
                  decoration: InputDecoration(
                    labelText: 'Badge Name',
                    suffixIcon: IconButton(
                      icon: const Icon(LucideIcons.plusCircle),
                      onPressed: () {
                        if (tagController.text.isNotEmpty) {
                          setDialogState(() {
                            currentTags.add('${tagController.text.trim()}|$selectedHex');
                            tagController.clear();
                          });
                        }
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text('Suggestions', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  children: suggestions.where((s) => !currentTags.contains(s)).map((s) {
                    final parts = s.split('|');
                    final label = parts[0];
                    final color = parts.length > 1 ? _parseColor(parts[1], AppColors.primaryDark) : AppColors.primaryDark;
                    return ActionChip(
                      label: Text(label, style: const TextStyle(fontSize: 11, color: Colors.white)),
                      backgroundColor: color,
                      onPressed: () => setDialogState(() => currentTags.add(s)),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                _updateProduct({'detailTags': currentTags});
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryDark, foregroundColor: Colors.white),
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  void _showPlaceholderDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(title, style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        content: Text(message, style: GoogleFonts.inter(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Close', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.primaryDark)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final priceRaw = _product['price'];
    final priceNum = priceRaw is String ? num.tryParse(priceRaw) : priceRaw as num?;
    final price = priceNum?.toStringAsFixed(0) ?? '0';
    
    final compRaw = _product['compareAtPrice'];
    final compareAtNum = compRaw is String ? num.tryParse(compRaw) : compRaw as num?;
    final compareAt = compareAtNum?.toStringAsFixed(0);

    final stockRaw = _product['totalStock'] ?? _product['stock'];
    final stock = (stockRaw is String ? int.tryParse(stockRaw) : stockRaw as int?) ?? 0;

    final String status = _product['status'] ?? 'draft';
    final Color statusColor = status == 'active' ? AppColors.success : (status == 'draft' ? AppColors.warning : AppColors.textMuted);

    final String? imageUrl = _product['imageUrl'];
    final List<dynamic> gallery = _product['images'] ?? [];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
          SliverAppBar(
            expandedHeight: 320,
            pinned: true,
            backgroundColor: AppColors.background,
            leading: IconButton(
              icon: CircleAvatar(
                backgroundColor: Colors.white.withValues(alpha: 0.8),
                child: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark, size: 20),
              ),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: CircleAvatar(
                  backgroundColor: Colors.white.withValues(alpha: 0.8),
                  child: const Icon(LucideIcons.edit2, color: AppColors.primaryDark, size: 20),
                ),
                onPressed: _navigateToEdit,
              ),
              const SizedBox(width: 8),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(24),
              child: Container(
                height: 32,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                ),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: imageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(color: AppColors.shimmer),
                      errorWidget: (context, url, error) => Container(color: AppColors.shimmer, child: const Icon(LucideIcons.imageOff, size: 48, color: AppColors.textMuted)),
                    )
                  : Container(
                      color: AppColors.shimmer,
                      child: const Icon(LucideIcons.package, size: 64, color: AppColors.textMuted),
                    ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header Info
                   Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _product['name'] ?? 'Unnamed Product',
                              style: GoogleFonts.playfairDisplay(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.primaryDark, height: 1.2),
                            ),
                            if ((_product['detailTags'] as List?)?.isNotEmpty == true || (compareAtNum != null && compareAtNum > (priceNum ?? 0))) ...[
                              const SizedBox(height: 8),
                              Wrap(
                                spacing: 6,
                                runSpacing: 6,
                                children: [
                                  if (compareAtNum != null && compareAtNum > (priceNum ?? 0))
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEF4444),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        '-${(((compareAtNum - (priceNum ?? 0)) / compareAtNum) * 100).round()}%',
                                        style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 0.5),
                                      ),
                                    ),
                                  ...(_product['detailTags'] as List? ?? []).map((tagRaw) {
                                    final tagStr = tagRaw.toString();
                                    if (tagStr.isEmpty) return const SizedBox.shrink();
                                    String label = tagStr;
                                    Color badgeColor = AppColors.primaryDark;
                                    if (tagStr.contains('|')) {
                                      final parts = tagStr.split('|');
                                      label = parts[0];
                                      if (parts.length > 1 && parts[1].isNotEmpty) badgeColor = _parseColor(parts[1], AppColors.primaryDark);
                                    }
                                    return Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: badgeColor,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        label.toUpperCase(),
                                        style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 0.5),
                                      ),
                                    );
                                  }),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: statusColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          status.toUpperCase(),
                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: statusColor),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '$price EGP',
                            style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark),
                          ),
                          if (compareAt != null) ...[
                            const SizedBox(width: 8),
                            Text(
                              '$compareAt EGP',
                              style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w500, color: AppColors.textMuted, decoration: TextDecoration.lineThrough),
                            ),
                          ]
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('In Stock', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                          Text('$stock Units', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: stock > 0 ? AppColors.success : AppColors.error)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Quick Actions (Controls requested by User)
                  _buildSectionTitle('Quick Controls', LucideIcons.zap),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildActionCard(
                          title: 'Add Stock',
                          subtitle: '$stock in stock',
                          icon: LucideIcons.packagePlus,
                          color: const Color(0xFF3B82F6),
                          onTap: _showStockDialog,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildActionCard(
                          title: 'Discount',
                          subtitle: compareAt != null ? 'On Sale' : 'Apply offer',
                          icon: LucideIcons.tag,
                          color: const Color(0xFFF59E0B),
                          onTap: _showDiscountDialog,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildActionCard(
                          title: 'Badge',
                          subtitle: (_product['detailTags'] as List?)?.isNotEmpty == true ? '${(_product['detailTags'] as List).length} active' : 'e.g. New',
                          icon: LucideIcons.sparkles,
                          color: const Color(0xFF8B5CF6),
                          onTap: _showBadgeDialog,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Specifications Card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.cardBorder),
                      boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildSectionTitle('Organization', LucideIcons.folderTree),
                        const SizedBox(height: 16),
                        _buildDetailRow('Category', _product['category'] ?? _product['categoryRel']?['name'] ?? 'N/A'),
                        const Divider(height: 24, color: AppColors.cardBorder),
                        _buildDetailRow('Brand', _product['brand']?['name'] ?? 'N/A'),
                        const Divider(height: 24, color: AppColors.cardBorder),
                        _buildDetailRow('Material', _product['material']?['name'] ?? 'N/A'),
                        const Divider(height: 24, color: AppColors.cardBorder),
                        _buildDetailRow('SKU', _product['sku'] ?? 'N/A'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Compact Information Tabs (Overview, Details, Specs)
                  _buildSectionTitle('Information', LucideIcons.info),
                  const SizedBox(height: 12),
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.cardBorder),
                      boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(4),
                          margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                          decoration: BoxDecoration(
                            color: AppColors.background,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: TabBar(
                            controller: _infoTabController,
                            indicatorSize: TabBarIndicatorSize.tab,
                            dividerColor: Colors.transparent,
                            indicator: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(8),
                              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))],
                            ),
                            labelColor: AppColors.primaryDark,
                            unselectedLabelColor: AppColors.textMuted,
                            labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
                            unselectedLabelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500),
                            tabs: const [
                              Tab(text: 'Overview'),
                              Tab(text: 'Details'),
                              Tab(text: 'Specs'),
                            ],
                          ),
                        ),
                        SizedBox(
                          height: 220,
                          child: TabBarView(
                            controller: _infoTabController,
                            children: [
                              _buildTabText(_product['description']?.toString().isNotEmpty == true ? _product['description'] : 'No overview available.'),
                              _buildTabText(_product['detailedDescription']?.toString().isNotEmpty == true ? _product['detailedDescription'] : 'No details available.'),
                              _buildSpecsContent(),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),

                  // Gallery
                  if (gallery.isNotEmpty) ...[
                    _buildSectionTitle('Gallery', LucideIcons.image),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 100,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: gallery.length,
                        itemBuilder: (context, index) {
                          final img = gallery[index]['url'];
                          return Container(
                            width: 100,
                            margin: const EdgeInsets.only(right: 12),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.cardBorder),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: CachedNetworkImage(
                                imageUrl: img,
                                fit: BoxFit.cover,
                                placeholder: (ctx, url) => Container(color: AppColors.shimmer),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                  // Reviews Section
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildSectionTitle('Customer Reviews', LucideIcons.star),
                      TextButton.icon(
                        onPressed: () => _showPlaceholderDialog('Add Review', 'Placeholder for adding a manual review.'),
                        icon: const Icon(LucideIcons.plus, size: 16),
                        label: const Text('Add'),
                        style: TextButton.styleFrom(
                          foregroundColor: AppColors.primaryDark,
                          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 12),
                   SizedBox(
                    height: 120,
                    child: _reviews.isEmpty 
                      ? Center(child: Text('No reviews for this product.', style: GoogleFonts.inter(color: AppColors.textMuted)))
                      : ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: _reviews.length,
                      itemBuilder: (context, index) {
                        final r = _reviews[index];
                        return Container(
                          width: 280,
                          margin: const EdgeInsets.only(right: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.cardBorder),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: List.generate(5, (starIndex) => Icon(
                                      LucideIcons.star, 
                                      size: 14, 
                                      color: starIndex < (r['rating'] ?? 0) ? const Color(0xFFF59E0B) : AppColors.textMuted.withValues(alpha: 0.3)
                                    )),
                                  ),
                                  const Icon(LucideIcons.messageSquare, size: 16, color: AppColors.textMuted)
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(r['reviewerName'] ?? 'Anonymous', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                              const SizedBox(height: 4),
                              Expanded(
                                child: Text(r['comment'] ?? '', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary, height: 1.4), maxLines: 2, overflow: TextOverflow.ellipsis),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
            ),
            ],
          ),
          if (_isLoading)
            Positioned(
              top: MediaQuery.of(context).padding.top + 56,
              left: 0,
              right: 0,
              child: const LinearProgressIndicator(
                backgroundColor: Colors.transparent,
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.accent),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primaryDark),
        const SizedBox(width: 8),
        Text(title, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
      ],
    );
  }

  Widget _buildActionCard({required String title, required String subtitle, required IconData icon, required Color color, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.15)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 10),
            Text(title, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            const SizedBox(height: 2),
            Text(subtitle, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
        Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ],
    );
  }

  Widget _buildTabText(String text) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Text(
        text,
        style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary, height: 1.6),
      ),
    );
  }

  Widget _buildSpecsContent() {
    final specs = _product['specs'] as Map<String, dynamic>? ?? {};
    if (specs.isEmpty) {
      return Center(child: Text('No specifications provided.', style: GoogleFonts.inter(color: AppColors.textMuted)));
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: specs.entries.map((e) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(flex: 2, child: Text(_formatKey(e.key), style: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted))),
                Expanded(flex: 3, child: Text(e.value.toString(), style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary), textAlign: TextAlign.right)),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  String _formatKey(String key) {
    if (key.isEmpty) return key;
    final text = key.replaceAllMapped(RegExp(r'[A-Z]'), (match) => ' ${match.group(0)}');
    return text[0].toUpperCase() + text.substring(1);
  }

  Color _parseColor(String? hexString, Color fallback) {
    if (hexString == null || hexString.isEmpty) return fallback;
    try {
      final buffer = StringBuffer();
      if (hexString.length == 6 || hexString.length == 7) buffer.write('ff');
      buffer.write(hexString.replaceFirst('#', ''));
      return Color(int.parse(buffer.toString(), radix: 16));
    } catch (_) {
      return fallback;
    }
  }
}
