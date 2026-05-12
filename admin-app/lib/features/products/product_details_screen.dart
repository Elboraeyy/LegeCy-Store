import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:admin_app/core/theme/app_theme.dart';
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

  @override
  void initState() {
    super.initState();
    _product = Map<String, dynamic>.from(widget.product);
    _infoTabController = TabController(length: 3, vsync: this);
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
    final price = priceRaw is String ? num.tryParse(priceRaw)?.toStringAsFixed(0) : (priceRaw as num?)?.toStringAsFixed(0);
    
    final compRaw = _product['compareAtPrice'];
    final compareAt = compRaw is String ? num.tryParse(compRaw)?.toStringAsFixed(0) : (compRaw as num?)?.toStringAsFixed(0);

    final stockRaw = _product['totalStock'] ?? _product['stock'];
    final stock = (stockRaw is String ? int.tryParse(stockRaw) : stockRaw as int?) ?? 0;

    final String status = _product['status'] ?? 'draft';
    final Color statusColor = status == 'active' ? AppColors.success : (status == 'draft' ? AppColors.warning : AppColors.textMuted);

    final String? imageUrl = _product['imageUrl'];
    final List<dynamic> gallery = _product['images'] ?? [];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
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
                decoration: const BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
                ),
              ),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: imageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: imageUrl,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: AppColors.shimmer),
                      errorWidget: (_, __, ___) => Container(color: AppColors.shimmer, child: const Icon(LucideIcons.imageOff, size: 48, color: AppColors.textMuted)),
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
                        child: Text(
                          _product['name'] ?? 'Unnamed Product',
                          style: GoogleFonts.playfairDisplay(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.primaryDark, height: 1.2),
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
                          onTap: () => _showPlaceholderDialog('Add Stock', 'This is a placeholder for adding quantity to the product.'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildActionCard(
                          title: 'Discount',
                          subtitle: 'Apply offer',
                          icon: LucideIcons.tag,
                          color: const Color(0xFFF59E0B),
                          onTap: () => _showPlaceholderDialog('Apply Discount', 'This is a placeholder for setting up a discount or offer.'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildActionCard(
                          title: 'Badge',
                          subtitle: 'e.g. New',
                          icon: LucideIcons.sparkles,
                          color: const Color(0xFF8B5CF6),
                          onTap: () => _showPlaceholderDialog('Add Badge', 'This is a placeholder for adding a badge like "New" or "Hot".'),
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
                                placeholder: (_, __) => Container(color: AppColors.shimmer),
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
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: 3, // Dummy count
                      itemBuilder: (context, index) {
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
                                    children: List.generate(5, (index) => const Icon(LucideIcons.star, size: 14, color: Color(0xFFF59E0B))),
                                  ),
                                  GestureDetector(
                                    onTap: () => _showPlaceholderDialog('Edit Review', 'Placeholder to edit or moderate this review.'),
                                    child: const Icon(LucideIcons.edit2, size: 16, color: AppColors.textMuted),
                                  )
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text('Customer Name', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                              const SizedBox(height: 4),
                              Expanded(
                                child: Text('Great product! Exactly as described and very high quality.', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary, height: 1.4), maxLines: 2, overflow: TextOverflow.ellipsis),
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
}
