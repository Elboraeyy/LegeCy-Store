import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class ProductBundlesScreen extends StatefulWidget {
  const ProductBundlesScreen({super.key});
  @override
  State<ProductBundlesScreen> createState() => _ProductBundlesScreenState();
}

class _ProductBundlesScreenState extends State<ProductBundlesScreen> {
  List<dynamic> _bundles = [];
  bool _isLoading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/bundles');
      if (mounted) setState(() { _bundles = data['bundles'] as List<dynamic>; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleActive(String id, bool isActive) async {
    HapticFeedback.lightImpact();
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.put('/api/admin/auth/bundles/$id', body: { 'isActive': !isActive });
      _load();
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _deleteBundle(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('Delete Bundle?', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        content: Text('Are you sure you want to delete this bundle?', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted, fontWeight: FontWeight.w600))),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    if (!mounted) return;

    HapticFeedback.mediumImpact();
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.delete('/api/admin/auth/bundles/$id');
      _load();
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showCreateDialog() {
    final nameController = TextEditingController();
    final bundlePriceController = TextEditingController();
    final origPriceController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('New Bundle', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: InputDecoration(
                  labelText: 'Bundle Name',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: origPriceController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Orig Price',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextField(
                      controller: bundlePriceController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Bundle Price',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted))),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.isEmpty || bundlePriceController.text.isEmpty) return;
              Navigator.pop(ctx);
              setState(() => _isLoading = true);
              try {
                final token = context.read<AuthProvider>().token;
                final client = ApiClient(token: token);
                await client.post('/api/admin/auth/bundles', body: {
                  'name': nameController.text,
                  'originalPrice': origPriceController.text.isNotEmpty ? origPriceController.text : bundlePriceController.text,
                  'bundlePrice': bundlePriceController.text,
                });
                _load();
              } catch (e) {
                if (mounted) setState(() => _isLoading = false);
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF8B5CF6),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(LucideIcons.packagePlus, color: Color(0xFF8B5CF6)),
            const SizedBox(width: 8),
            Text('Product Bundles', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
          ],
        ),
        backgroundColor: AppColors.surface, surfaceTintColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6)))
          : _bundles.isEmpty
              ? Center(
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: const Color(0xFF8B5CF6).withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(LucideIcons.packagePlus, size: 48, color: Color(0xFF8B5CF6))),
                    const SizedBox(height: 24),
                    Text('No Product Bundles', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                    const SizedBox(height: 8),
                    Text('Combine products to increase AOV.', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
                  ]),
                )
              : RefreshIndicator(
                  color: const Color(0xFF8B5CF6),
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _bundles.length,
                    itemBuilder: (context, index) {
                      final b = _bundles[index];
                      final bool isActive = b['isActive'] == true;
                      
                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: isActive ? const Color(0xFF8B5CF6).withValues(alpha: 0.5) : AppColors.cardBorder),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.cardBorder.withValues(alpha: 0.5),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            )
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        b['name'] ?? 'Bundle',
                                        style: GoogleFonts.playfairDisplay(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.primaryDark),
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          Text(
                                            'EGP ${b['bundlePrice']}',
                                            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF8B5CF6)),
                                          ),
                                          if (b['originalPrice'] != null && b['originalPrice'].toString() != b['bundlePrice'].toString()) ...[
                                            const SizedBox(width: 8),
                                            Text(
                                              'EGP ${b['originalPrice']}',
                                              style: GoogleFonts.inter(fontSize: 12, decoration: TextDecoration.lineThrough, color: AppColors.textMuted),
                                            ),
                                          ]
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                Switch(
                                  value: isActive,
                                  onChanged: (v) => _toggleActive(b['id'], isActive),
                                  activeThumbColor: const Color(0xFF8B5CF6),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Icon(LucideIcons.barChart3, size: 16, color: AppColors.textMuted),
                                const SizedBox(width: 8),
                                Text('Sold ${b['currentSales']} times', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Divider(color: AppColors.divider, height: 1),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton.icon(
                                  onPressed: () => _deleteBundle(b['id']),
                                  icon: Icon(LucideIcons.trash2, size: 16, color: AppColors.error),
                                  label: Text('Delete', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.error)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          HapticFeedback.lightImpact();
          _showCreateDialog();
        },
        backgroundColor: const Color(0xFF8B5CF6),
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: Text('New Bundle', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.white)),
      ),
    );
  }
}
