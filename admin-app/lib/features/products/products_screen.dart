import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

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
      String path = '/api/admin/auth/products?status=$_statusFilter';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Products', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onSubmitted: (_) => _loadProducts(),
                    style: GoogleFonts.inter(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Search products...',
                      hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted),
                      prefixIcon: const Icon(LucideIcons.search, size: 18),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.cardBorder)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.cardBorder)),
                      filled: true,
                      fillColor: AppColors.background,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                PopupMenuButton<String>(
                  onSelected: (val) { _statusFilter = val; _loadProducts(); },
                  icon: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: Icon(LucideIcons.slidersHorizontal, size: 18, color: AppColors.textMuted),
                  ),
                  itemBuilder: (context) => [
                    const PopupMenuItem(value: 'all', child: Text('All')),
                    const PopupMenuItem(value: 'active', child: Text('Active')),
                    const PopupMenuItem(value: 'draft', child: Text('Draft')),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        color: AppColors.primaryDark,
        onRefresh: _loadProducts,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
            : _error != null
                ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(LucideIcons.wifiOff, size: 48, color: AppColors.error.withValues(alpha: 0.5)),
                    const SizedBox(height: 12),
                    Text('Failed to load', style: GoogleFonts.inter(color: AppColors.error)),
                    TextButton(onPressed: _loadProducts, child: const Text('Retry')),
                  ]))
                : _products.isEmpty
                    ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(LucideIcons.packageSearch, size: 48, color: AppColors.textMuted.withValues(alpha: 0.4)),
                        const SizedBox(height: 16),
                        Text('No products found', style: GoogleFonts.inter(fontSize: 16, color: AppColors.textMuted)),
                      ]))
                    : _buildGrid(),
      ),
    );
  }

  Widget _buildGrid() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.72,
      ),
      itemCount: _products.length,
      itemBuilder: (context, index) {
        final product = _products[index];
        final isActive = product['status'] == 'active';
        return GestureDetector(
          onTap: () {},
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image
                Expanded(
                  flex: 3,
                  child: ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        Container(
                          color: AppColors.shimmer,
                          child: product['imageUrl'] != null
                              ? Image.network(product['imageUrl'], fit: BoxFit.cover,
                                  errorBuilder: (_, e, st) => Center(child: Icon(LucideIcons.image, color: AppColors.textMuted)))
                              : Center(child: Icon(LucideIcons.image, color: AppColors.textMuted, size: 32)),
                        ),
                        Positioned(
                          top: 8,
                          right: 8,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: isActive ? AppColors.success.withValues(alpha: 0.9) : AppColors.warning.withValues(alpha: 0.9),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              isActive ? 'Active' : 'Draft',
                              style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Info
                Expanded(
                  flex: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          product['name'] ?? '',
                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${(product['price'] as num?)?.toStringAsFixed(0) ?? '0'} EGP',
                              style: GoogleFonts.playfairDisplay(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.primaryDark),
                            ),
                            Text(
                              '${product['variantCount'] ?? 0} var',
                              style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
