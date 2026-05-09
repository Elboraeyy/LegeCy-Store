import 'package:flutter/material.dart';
// import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class AddCategoryScreen extends StatefulWidget {
  final Map<String, dynamic>? category;
  const AddCategoryScreen({super.key, this.category});

  @override
  State<AddCategoryScreen> createState() => _AddCategoryScreenState();
}

class _AddCategoryScreenState extends State<AddCategoryScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _isLoadingParents = true;

  late TextEditingController _nameCtrl;
  late TextEditingController _nameArCtrl;
  late TextEditingController _slugCtrl;
  late TextEditingController _descCtrl;
  late TextEditingController _descArCtrl;
  late TextEditingController _sortOrderCtrl;

  String? _selectedParentId;
  List<dynamic> _parentCategories = [];

  @override
  void initState() {
    super.initState();
    final c = widget.category;
    _nameCtrl = TextEditingController(text: c?['name'] ?? '');
    _nameArCtrl = TextEditingController(text: c?['nameAr'] ?? '');
    _slugCtrl = TextEditingController(text: c?['slug'] ?? '');
    _descCtrl = TextEditingController(text: c?['description'] ?? '');
    _descArCtrl = TextEditingController(text: c?['descriptionAr'] ?? '');
    _sortOrderCtrl = TextEditingController(text: c?['sortOrder']?.toString() ?? '0');
    _selectedParentId = c?['parentId'];
    
    _loadParentCategories();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _nameArCtrl.dispose();
    _slugCtrl.dispose();
    _descCtrl.dispose();
    _descArCtrl.dispose();
    _sortOrderCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadParentCategories() async {
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/categories');
      
      if (mounted) {
        setState(() {
          // Filter out the current category to prevent self-parenting
          _parentCategories = (data['categories'] as List<dynamic>).where((c) => c['id'] != widget.category?['id']).toList();
          _isLoadingParents = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoadingParents = false);
    }
  }

  void _generateSlug() {
    if (_nameCtrl.text.isNotEmpty && _slugCtrl.text.isEmpty) {
      setState(() {
        _slugCtrl.text = _nameCtrl.text.toLowerCase().replaceAll(RegExp(r'[^a-z0-9]+'), '-').replaceAll(RegExp(r'(^-|-$)'), '');
      });
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);

      final body = {
        'name': _nameCtrl.text.trim(),
        'nameAr': _nameArCtrl.text.trim().isNotEmpty ? _nameArCtrl.text.trim() : null,
        'slug': _slugCtrl.text.trim(),
        'description': _descCtrl.text.trim().isNotEmpty ? _descCtrl.text.trim() : null,
        'descriptionAr': _descArCtrl.text.trim().isNotEmpty ? _descArCtrl.text.trim() : null,
        'sortOrder': int.tryParse(_sortOrderCtrl.text) ?? 0,
        'parentId': _selectedParentId,
      };

      if (widget.category != null) {
        await client.put('/api/admin/auth/categories/${widget.category!['id']}', body: body);
      } else {
        await client.post('/api/admin/auth/categories', body: body);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(widget.category != null ? 'Category updated' : 'Category created', style: const TextStyle(color: Colors.white)),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ));
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating));
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.category != null ? 'Edit Category' : 'New Category', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w600, color: AppColors.primaryDark)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Basic Info
            _buildSectionTitle('Basic Details'),
            _buildCard(
              child: Column(
                children: [
                  Focus(
                    onFocusChange: (hasFocus) { if (!hasFocus) _generateSlug(); },
                    child: _buildTextField(
                      controller: _nameCtrl,
                      label: 'Name (English)',
                      icon: LucideIcons.type,
                      validator: (v) => v!.isEmpty ? 'Name is required' : null,
                    ),
                  ),
                  const Divider(height: 32, color: AppColors.background),
                  _buildTextField(
                    controller: _nameArCtrl,
                    label: 'Name (Arabic)',
                    icon: LucideIcons.languages,
                  ),
                  const Divider(height: 32, color: AppColors.background),
                  _buildTextField(
                    controller: _slugCtrl,
                    label: 'URL Slug',
                    icon: LucideIcons.link,
                    hint: 'e.g. smart-tvs',
                    validator: (v) => v!.isEmpty ? 'Slug is required' : null,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Descriptions
            _buildSectionTitle('Descriptions (Optional)'),
            _buildCard(
              child: Column(
                children: [
                  _buildTextField(
                    controller: _descCtrl,
                    label: 'Description (English)',
                    icon: LucideIcons.alignLeft,
                    maxLines: 3,
                  ),
                  const Divider(height: 32, color: AppColors.background),
                  _buildTextField(
                    controller: _descArCtrl,
                    label: 'Description (Arabic)',
                    icon: LucideIcons.alignRight,
                    maxLines: 3,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Organization
            _buildSectionTitle('Organization'),
            _buildCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Parent Category', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  _isLoadingParents
                      ? const CircularProgressIndicator()
                      : DropdownButtonFormField<String?>(
                          initialValue: _selectedParentId,
                          isExpanded: true,
                          items: [
                            const DropdownMenuItem(value: null, child: Text('None (Root Category)')),
                            ..._parentCategories.map((c) => DropdownMenuItem(value: c['id'] as String, child: Text(c['name'] ?? 'Unknown'))),
                          ],
                          onChanged: (v) => setState(() => _selectedParentId = v),
                          decoration: InputDecoration(
                            filled: true,
                            fillColor: AppColors.background,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          ),
                        ),
                  const Divider(height: 32, color: AppColors.background),
                  _buildTextField(
                    controller: _sortOrderCtrl,
                    label: 'Sort Order',
                    icon: LucideIcons.arrowUpDown,
                    keyboardType: TextInputType.number,
                    hint: '0',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),

            // Save Button
            SizedBox(
              height: 54,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryDark,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: _isLoading
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(widget.category != null ? 'Save Changes' : 'Create Category', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 4),
      child: Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 0.5)),
    );
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: child,
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    String? hint,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          validator: validator,
          style: GoogleFonts.inter(fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: maxLines == 1 ? Icon(icon, size: 18, color: AppColors.textMuted) : null,
            filled: true,
            fillColor: AppColors.background,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: maxLines == 1 ? 14 : 16),
          ),
        ),
      ],
    );
  }
}
