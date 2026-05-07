import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';
import 'package:admin_app/core/config/api_config.dart';

class AddProductScreen extends StatefulWidget {
  final Map<String, dynamic>? product;
  const AddProductScreen({super.key, this.product});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final _formKey = GlobalKey<FormState>();
  
  final _nameController = TextEditingController();
  final _nameArController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _descriptionArController = TextEditingController();
  final _priceController = TextEditingController();
  final _skuController = TextEditingController();
  
  String? _selectedCategoryId;
  String _status = 'active';
  File? _imageFile;
  String? _imageUrl;
  
  List<dynamic> _categories = [];
  bool _isLoadingCategories = true;
  bool _isSaving = false;

  bool get _isEditing => widget.product != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _nameController.text = widget.product!['name'] ?? '';
      _nameArController.text = widget.product!['nameAr'] ?? '';
      _descriptionController.text = widget.product!['description'] ?? '';
      _descriptionArController.text = widget.product!['descriptionAr'] ?? '';
      _priceController.text = (widget.product!['price'] as num?)?.toString() ?? '';
      _skuController.text = widget.product!['sku'] ?? '';
      _status = widget.product!['status'] ?? 'active';
      _selectedCategoryId = widget.product!['categoryId']?.toString();
      _imageUrl = widget.product!['imageUrl'];
    }
    _loadCategories();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (pickedFile != null) {
      setState(() { _imageFile = File(pickedFile.path); });
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _nameArController.dispose();
    _descriptionController.dispose();
    _descriptionArController.dispose();
    _priceController.dispose();
    _skuController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get(ApiConfig.categoriesEndpoint);
      if (mounted) {
        setState(() {
          _categories = data['categories'] as List<dynamic>;
          if (!_isEditing && _categories.isNotEmpty && _selectedCategoryId == null) {
            _selectedCategoryId = _categories.first['id']?.toString();
          }
          _isLoadingCategories = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _isLoadingCategories = false; });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load categories: $e')));
      }
    }
  }

  Future<void> _saveProduct() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a category')));
      return;
    }

    setState(() { _isSaving = true; });

    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      
      if (_imageFile != null) {
        final uploadData = await client.uploadMultipart(
          ApiConfig.uploadEndpoint,
          filePath: _imageFile!.path,
          fileField: 'file',
          fields: {'folder': 'products'},
        );
        _imageUrl = uploadData['url'];
      }
      
      final body = {
        'name': _nameController.text.trim(),
        'nameAr': _nameArController.text.trim(),
        'description': _descriptionController.text.trim(),
        'descriptionAr': _descriptionArController.text.trim(),
        'categoryId': _selectedCategoryId,
        'status': _status,
        'price': double.tryParse(_priceController.text) ?? 0,
        'sku': _skuController.text.trim(),
        if (_imageUrl != null) 'imageUrl': _imageUrl,
      };

      if (_isEditing) {
        await client.put('${ApiConfig.authProductsEndpoint}/${widget.product!['id']}', body: body);
      } else {
        await client.post(ApiConfig.authProductsEndpoint, body: body);
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing ? 'Product updated successfully' : 'Product added successfully', style: const TextStyle(color: Colors.white)), 
            backgroundColor: AppColors.success
          )
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to save product: $e'), backgroundColor: AppColors.error));
      }
    } finally {
      if (mounted) {
        setState(() { _isSaving = false; });
      }
    }
  }

  Future<void> _deleteProduct() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Product'),
        content: const Text('Are you sure you want to delete this product? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true), 
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isSaving = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.delete('${ApiConfig.authProductsEndpoint}/${widget.product!['id']}');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Product deleted successfully'), backgroundColor: AppColors.success));
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to delete product: $e'), backgroundColor: AppColors.error));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Widget _buildTextField(String label, TextEditingController controller, {bool required = true, bool isNumber = false, int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        keyboardType: isNumber ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
        maxLines: maxLines,
        style: GoogleFonts.inter(fontSize: 14),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: GoogleFonts.inter(color: AppColors.textMuted),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryDark)),
          filled: true,
          fillColor: AppColors.background,
        ),
        validator: required ? (v) => v == null || v.isEmpty ? 'Required field' : null : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Product' : 'Add New Product', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        actions: [
          if (_isEditing)
            IconButton(
              icon: const Icon(LucideIcons.trash2, color: AppColors.error),
              onPressed: _isSaving ? null : _deleteProduct,
            ),
        ],
      ),
      body: _isLoadingCategories
        ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
        : SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  GestureDetector(
                    onTap: _pickImage,
                    child: Container(
                      height: 200,
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: _imageFile != null
                          ? Image.file(_imageFile!, fit: BoxFit.cover, width: double.infinity)
                          : _imageUrl != null
                            ? CachedNetworkImage(
                                imageUrl: _imageUrl!, 
                                fit: BoxFit.cover, 
                                width: double.infinity,
                                errorWidget: (context, url, error) => const Icon(LucideIcons.image, color: AppColors.textMuted),
                              )
                            : Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(LucideIcons.imagePlus, size: 48, color: AppColors.textMuted.withValues(alpha: 0.5)),
                                  const SizedBox(height: 12),
                                  Text('Tap to add product image', style: GoogleFonts.inter(color: AppColors.textMuted)),
                                ],
                              ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Basic Details', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 16),
                        _buildTextField('Product Name (English)', _nameController),
                        _buildTextField('Product Name (Arabic)', _nameArController, required: false),
                        _buildTextField('SKU (Unique code)', _skuController),
                        _buildTextField('Price (EGP)', _priceController, isNumber: true),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Description & Organization', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 16),
                        _buildTextField('Description (English)', _descriptionController, maxLines: 3, required: false),
                        _buildTextField('Description (Arabic)', _descriptionArController, maxLines: 3, required: false),
                        
                        const SizedBox(height: 8),
                        Text('Category', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          initialValue: _selectedCategoryId,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            filled: true,
                            fillColor: AppColors.background,
                          ),
                          items: _categories.map((c) => DropdownMenuItem<String>(
                            value: c['id']?.toString(),
                            child: Text(c['name'], style: GoogleFonts.inter(fontSize: 14)),
                          )).toList(),
                          onChanged: (v) => setState(() => _selectedCategoryId = v),
                        ),
                        
                        const SizedBox(height: 24),
                        Text('Status', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          initialValue: _status,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.cardBorder)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            filled: true,
                            fillColor: AppColors.background,
                          ),
                          items: const [
                            DropdownMenuItem(value: 'active', child: Text('Active (Visible to customers)')),
                            DropdownMenuItem(value: 'draft', child: Text('Draft (Hidden)')),
                          ],
                          onChanged: (v) => setState(() => _status = v!),
                        ),
                      ],
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                  
                  ElevatedButton(
                    onPressed: _isSaving ? null : _saveProduct,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryDark,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: _isSaving
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : Text(_isEditing ? 'Update Product' : 'Save Product', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
    );
  }
}
