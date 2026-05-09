import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';
import 'add_category_screen.dart';

class CategoriesScreen extends StatefulWidget {
  const CategoriesScreen({super.key});

  @override
  State<CategoriesScreen> createState() => _CategoriesScreenState();
}

class _CategoriesScreenState extends State<CategoriesScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _categories = [];
  List<dynamic> _filteredCategories = [];
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _searchController.addListener(_filterCategories);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/categories');
      
      if (mounted) {
        setState(() {
          _categories = data['categories'];
          _filteredCategories = _categories;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  void _filterCategories() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filteredCategories = _categories.where((c) {
        final name = c['name']?.toString().toLowerCase() ?? '';
        final nameAr = c['nameAr']?.toString().toLowerCase() ?? '';
        final slug = c['slug']?.toString().toLowerCase() ?? '';
        return name.contains(query) || nameAr.contains(query) || slug.contains(query);
      }).toList();
    });
  }

  Future<void> _deleteCategory(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Delete Category', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        content: Text('Are you sure you want to delete this category?', style: GoogleFonts.inter(color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted))),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (ok != true) return;
    if (!mounted) return;

    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.delete('/api/admin/auth/categories/$id');
      
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Category deleted'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating));
      _loadCategories();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating));
    }
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
              title: Text('Categories', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
              actions: [
                IconButton(
                  icon: const Icon(LucideIcons.plus, color: AppColors.primaryDark),
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const AddCategoryScreen())).then((v) {
                      if (v == true) _loadCategories();
                    });
                  },
                ),
              ],
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
                        hintText: 'Search categories...',
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
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error),
                        const SizedBox(height: 16),
                        Text(_error!, style: GoogleFonts.inter(color: AppColors.error)),
                        const SizedBox(height: 16),
                        ElevatedButton(onPressed: _loadCategories, child: const Text('Retry')),
                      ],
                    ),
                  )
                : _filteredCategories.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(color: AppColors.primaryDark.withValues(alpha: 0.05), shape: BoxShape.circle),
                              child: const Icon(LucideIcons.layoutGrid, size: 48, color: AppColors.primaryDark),
                            ),
                            const SizedBox(height: 24),
                            Text('No Categories Found', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                            const SizedBox(height: 8),
                            Text('Create your first category to organize products.', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadCategories,
                        color: AppColors.primaryDark,
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                          itemCount: _filteredCategories.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final category = _filteredCategories[index];
                            final productsCount = category['_count']?['products'] ?? 0;
                            final childrenCount = category['_count']?['children'] ?? 0;
                            
                            return Container(
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.cardBorder),
                                boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2))],
                              ),
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(16),
                                leading: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(color: const Color(0xFF3B82F6).withValues(alpha: 0.1), shape: BoxShape.circle),
                                  child: const Icon(LucideIcons.folder, color: Color(0xFF3B82F6)),
                                ),
                                title: Row(
                                  children: [
                                    Expanded(child: Text(category['name'] ?? '', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primaryDark))),
                                  ],
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    Text('Slug: ${category['slug']}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textSecondary)),
                                    if (category['parent'] != null) ...[
                                      const SizedBox(height: 4),
                                      Text('Parent: ${category['parent']['name']}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                                    ],
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8)),
                                          child: Row(
                                            children: [
                                              const Icon(LucideIcons.package, size: 12, color: AppColors.textSecondary),
                                              const SizedBox(width: 4),
                                              Text('$productsCount Products', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                                            ],
                                          ),
                                        ),
                                        if (childrenCount > 0) ...[
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8)),
                                            child: Row(
                                              children: [
                                                const Icon(LucideIcons.gitMerge, size: 12, color: AppColors.textSecondary),
                                                const SizedBox(width: 4),
                                                Text('$childrenCount Subcategories', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                                trailing: PopupMenuButton<String>(
                                  icon: const Icon(LucideIcons.moreVertical, color: AppColors.textMuted),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  onSelected: (v) {
                                    if (v == 'edit') {
                                      Navigator.push(context, MaterialPageRoute(builder: (_) => AddCategoryScreen(category: category))).then((val) {
                                        if (val == true) _loadCategories();
                                      });
                                    } else if (v == 'delete') {
                                      _deleteCategory(category['id']);
                                    }
                                  },
                                  itemBuilder: (_) => [
                                    const PopupMenuItem(value: 'edit', child: Row(children: [Icon(LucideIcons.edit, size: 16, color: AppColors.primaryDark), SizedBox(width: 10), Text('Edit Category')])),
                                    const PopupMenuDivider(),
                                    const PopupMenuItem(value: 'delete', child: Row(children: [Icon(LucideIcons.trash2, size: 16, color: Colors.red), SizedBox(width: 10), Text('Delete', style: TextStyle(color: Colors.red))])),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          HapticFeedback.lightImpact();
          Navigator.push(context, MaterialPageRoute(builder: (_) => const AddCategoryScreen())).then((v) {
            if (v == true) _loadCategories();
          });
        },
        backgroundColor: AppColors.primaryDark,
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: Text('New Category', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.white)),
      ),
    );
  }
}
