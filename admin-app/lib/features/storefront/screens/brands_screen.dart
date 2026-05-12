import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class BrandsScreen extends StatefulWidget {
  const BrandsScreen({super.key});

  @override
  State<BrandsScreen> createState() => _BrandsScreenState();
}

class _BrandsScreenState extends State<BrandsScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _brands = [];
  List<dynamic> _filteredBrands = [];
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadBrands();
    _searchController.addListener(_filterBrands);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _filterBrands() {
    final q = _searchController.text.toLowerCase();
    setState(() {
      _filteredBrands = _brands.where((b) {
        final name = b['name']?.toString().toLowerCase() ?? '';
        final slug = b['slug']?.toString().toLowerCase() ?? '';
        return name.contains(q) || slug.contains(q);
      }).toList();
    });
  }

  Future<void> _loadBrands() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/brands');
      if (mounted) {
        setState(() {
          _brands = data['brands'] ?? [];
          _filteredBrands = _brands;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _deleteBrand(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      backgroundColor: Colors.white, surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text('Delete Brand', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
      content: Text('Are you sure? Brands with products cannot be deleted.', style: GoogleFonts.inter(color: AppColors.textSecondary)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted))),
        ElevatedButton(onPressed: () => Navigator.pop(context, true), style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0), child: const Text('Delete')),
      ],
    ));
    if (ok != true) return;
    if (!mounted) return;
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.delete('/api/admin/auth/brands/$id');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Brand deleted'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating));
      _loadBrands();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating));
    }
  }

  void _showAddEdit({Map<String, dynamic>? brand}) {
    final nameCtrl = TextEditingController(text: brand?['name'] ?? '');
    final nameArCtrl = TextEditingController(text: brand?['nameAr'] ?? '');
    final slugCtrl = TextEditingController(text: brand?['slug'] ?? '');

    showModalBottomSheet(
      context: context, isScrollControlled: true, backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
        decoration: const BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.textMuted.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 16),
          const SizedBox(height: 16),
          Text(brand != null ? 'Edit Brand' : 'New Brand', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
          const SizedBox(height: 20),
          Focus(
            onFocusChange: (f) { if (!f && slugCtrl.text.isEmpty && nameCtrl.text.isNotEmpty) slugCtrl.text = nameCtrl.text.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-').replaceAll(RegExp(r'(^-|-$)'), ''); },
            child: _field('Brand Name', nameCtrl, LucideIcons.tag),
          ),
          const SizedBox(height: 12),
          _field('URL Slug', slugCtrl, LucideIcons.link),
          const SizedBox(height: 24),
          SizedBox(width: double.infinity, height: 50, child: ElevatedButton(
            onPressed: () async {
              if (nameCtrl.text.isEmpty || slugCtrl.text.trim().isEmpty) return;
              final body = {
                'name': nameCtrl.text.trim(),
                'nameAr': brand?['nameAr'], // Keep existing if edit
                'slug': slugCtrl.text.trim(),
              };
              final messenger = ScaffoldMessenger.of(context);
              try {
                final token = context.read<AuthProvider>().token;
                final client = ApiClient(token: token);
                if (brand != null) { await client.put('/api/admin/auth/brands/${brand['id']}', body: body); }
                else { await client.post('/api/admin/auth/brands', body: body); }
                if (!context.mounted) return;
                Navigator.pop(ctx);
                _loadBrands();
              } catch (e) {
                if (!context.mounted) return;
                messenger.showSnackBar(SnackBar(content: Text('$e'), backgroundColor: AppColors.error));
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryDark, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), elevation: 0),
            child: Text(brand != null ? 'Save Changes' : 'Create Brand', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
          )),
        ])),
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl, IconData icon) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
      const SizedBox(height: 8),
      TextField(controller: ctrl, style: GoogleFonts.inter(fontSize: 14), decoration: InputDecoration(prefixIcon: Icon(icon, size: 18, color: AppColors.textMuted), filled: true, fillColor: AppColors.background, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none), contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14))),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              pinned: true,
              backgroundColor: AppColors.surface,
              surfaceTintColor: Colors.transparent,
              expandedHeight: 130,
              shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(bottom: Radius.circular(20))),
              leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
              title: Text('Brands', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(70),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: TextField(
                      controller: _searchController,
                      style: GoogleFonts.inter(fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Search brands...',
                        hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted),
                        prefixIcon: const Icon(LucideIcons.search, size: 18, color: AppColors.textMuted),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(icon: const Icon(LucideIcons.x, size: 16, color: AppColors.textMuted), onPressed: () => _searchController.clear())
                            : null,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ];
        },
        body: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
            : _error != null
                ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error), const SizedBox(height: 16), ElevatedButton(onPressed: _loadBrands, child: const Text('Retry'))]))
                : _filteredBrands.isEmpty
                    ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: AppColors.primaryDark.withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(LucideIcons.tag, size: 48, color: AppColors.primaryDark)),
                        const SizedBox(height: 24),
                        Text('No Brands Found', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                        const SizedBox(height: 8),
                        Text('Try searching for something else.', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
                      ]))
                    : RefreshIndicator(
                        onRefresh: _loadBrands, color: AppColors.primaryDark,
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                          itemCount: _filteredBrands.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final brand = _filteredBrands[index];
                            final productCount = brand['_count']?['products'] ?? 0;
                            return Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.cardBorder)),
                              child: Row(children: [
                                Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: const Color(0xFF8B5CF6).withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(LucideIcons.tag, color: Color(0xFF8B5CF6))),
                                const SizedBox(width: 12),
                                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text(brand['name'] ?? '', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                                  const SizedBox(height: 2),
                                  Text('$productCount products • /${brand['slug']}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                                ])),
                                PopupMenuButton<String>(
                                  icon: const Icon(LucideIcons.moreVertical, color: AppColors.textMuted),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  onSelected: (v) { if (v == 'edit') {
                                    _showAddEdit(brand: brand);
                                  } else if (v == 'delete') {
                                    _deleteBrand(brand['id']);
                                  } },
                                  itemBuilder: (_) => [
                                    const PopupMenuItem(value: 'edit', child: Row(children: [Icon(LucideIcons.edit, size: 16), SizedBox(width: 10), Text('Edit')])),
                                    const PopupMenuDivider(),
                                    const PopupMenuItem(value: 'delete', child: Row(children: [Icon(LucideIcons.trash2, size: 16, color: Colors.red), SizedBox(width: 10), Text('Delete', style: TextStyle(color: Colors.red))])),
                                  ],
                                ),
                              ]),
                            );
                          },
                        ),
                      ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () { HapticFeedback.lightImpact(); _showAddEdit(); },
        backgroundColor: AppColors.primaryDark,
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: Text('New Brand', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.white)),
      ),
    );
  }
}
