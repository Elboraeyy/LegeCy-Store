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

class _AddProductScreenState extends State<AddProductScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  late TabController _tabController;

  // Controllers
  final _nameCtrl = TextEditingController();
  final _nameArCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _descArCtrl = TextEditingController();
  final _detailCtrl = TextEditingController();
  final _detailArCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _compareCtrl = TextEditingController();
  final _costCtrl = TextEditingController();
  final _skuCtrl = TextEditingController();
  final _stockCtrl = TextEditingController();
  final _slugCtrl = TextEditingController();
  final _metaTitleCtrl = TextEditingController();
  final _metaTitleArCtrl = TextEditingController();
  final _metaDescCtrl = TextEditingController();
  final _metaDescArCtrl = TextEditingController();
  final _dialSizeCtrl = TextEditingController();
  final _dialColorCtrl = TextEditingController();
  final _caseColorCtrl = TextEditingController();
  final _strapMatCtrl = TextEditingController();
  final _strapColCtrl = TextEditingController();
  final _movementCtrl = TextEditingController();
  final _glassCtrl = TextEditingController();
  final _waterCtrl = TextEditingController();

  String? _catId, _brandId, _matId, _suppId;
  String _status = 'active';
  bool _newArrivals = true, _forYou = true;
  File? _imageFile;
  String? _imageUrl;
  List<String> _gallery = [];
  List<dynamic> _cats = [], _brands = [], _mats = [], _supps = [];
  bool _loadingOpts = true, _saving = false;

  bool get _isEdit => widget.product != null && widget.product!['id'] != null;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    if (widget.product != null) _prefill(widget.product!);
    _loadOptions();
  }

  void _prefill(Map<String, dynamic> p) {
    _nameCtrl.text = p['name'] ?? '';
    _nameArCtrl.text = p['nameAr'] ?? '';
    _descCtrl.text = p['description'] ?? '';
    _descArCtrl.text = p['descriptionAr'] ?? '';
    _detailCtrl.text = p['detailedDescription'] ?? '';
    _detailArCtrl.text = p['detailedDescriptionAr'] ?? '';
    if (p['variants'] != null && (p['variants'] as List).isNotEmpty) {
      final v = p['variants'][0];
      _priceCtrl.text = v['price']?.toString() ?? '';
      _skuCtrl.text = v['sku'] ?? '';
      _costCtrl.text = v['costPrice']?.toString() ?? '';
    } else {
      _priceCtrl.text = p['price']?.toString() ?? '';
      _skuCtrl.text = p['sku'] ?? '';
      _costCtrl.text = p['costPrice']?.toString() ?? '';
    }
    _compareCtrl.text = p['compareAtPrice']?.toString() ?? '';
    _stockCtrl.text = p['stock']?.toString() ?? '';
    _status = p['status'] ?? 'active';
    _catId = p['categoryId']?.toString();
    _brandId = p['brandId']?.toString();
    _matId = p['materialId']?.toString();
    _suppId = p['supplierId']?.toString();
    _imageUrl = p['imageUrl'];
    if (p['images'] != null) _gallery = (p['images'] as List).map((i) => i['url'].toString()).toList();
    _newArrivals = p['showInNewArrivals'] ?? true;
    _forYou = p['showInForYou'] ?? true;
    _slugCtrl.text = p['slug'] ?? '';
    _metaTitleCtrl.text = p['metaTitle'] ?? '';
    _metaTitleArCtrl.text = p['metaTitleAr'] ?? '';
    _metaDescCtrl.text = p['metaDescription'] ?? '';
    _metaDescArCtrl.text = p['metaDescriptionAr'] ?? '';
    if (p['specs'] != null) {
      final s = p['specs'];
      _dialSizeCtrl.text = s['dialSize'] ?? '';
      _dialColorCtrl.text = s['dialColor'] ?? '';
      _caseColorCtrl.text = s['caseColor'] ?? '';
      _strapMatCtrl.text = s['strapMaterial'] ?? '';
      _strapColCtrl.text = s['strapColor'] ?? '';
      _movementCtrl.text = s['movement'] ?? '';
      _glassCtrl.text = s['glass'] ?? '';
      _waterCtrl.text = s['waterResistance'] ?? '';
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    for (final c in [_nameCtrl,_nameArCtrl,_descCtrl,_descArCtrl,_detailCtrl,_detailArCtrl,_priceCtrl,_compareCtrl,_costCtrl,_skuCtrl,_stockCtrl,_slugCtrl,_metaTitleCtrl,_metaTitleArCtrl,_metaDescCtrl,_metaDescArCtrl,_dialSizeCtrl,_dialColorCtrl,_caseColorCtrl,_strapMatCtrl,_strapColCtrl,_movementCtrl,_glassCtrl,_waterCtrl]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _loadOptions() async {
    try {
      final client = ApiClient(token: context.read<AuthProvider>().token);
      final data = await client.get('${ApiConfig.authProductsEndpoint}/options');
      if (mounted) setState(() { _cats = data['categories']; _brands = data['brands']; _mats = data['materials']; _supps = data['suppliers']; _loadingOpts = false; });
    } catch (_) { if (mounted) setState(() => _loadingOpts = false); }
  }

  Future<void> _pickImage(bool gallery) async {
    final f = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (f == null) return;
    if (!gallery) { setState(() => _imageFile = File(f.path)); return; }
    setState(() => _saving = true);
    try {
      if (!mounted) return;
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final res = await client.uploadMultipart(ApiConfig.uploadEndpoint, filePath: f.path, fileField: 'file', fields: {'folder': 'products/gallery'});
      if (mounted) setState(() => _gallery.add(res['url']));
    } catch (e) { if (mounted) _snack('Upload failed: $e'); }
    finally { if (mounted) setState(() => _saving = false); }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) { _snack('Please fill required fields'); return; }
    setState(() => _saving = true);
    try {
      final client = ApiClient(token: context.read<AuthProvider>().token);
      if (_imageFile != null) {
        final res = await client.uploadMultipart(ApiConfig.uploadEndpoint, filePath: _imageFile!.path, fileField: 'file', fields: {'folder': 'products'});
        _imageUrl = res['url'];
      }
      final specs = <String, String>{};
      void addSpec(String k, TextEditingController c) { if (c.text.trim().isNotEmpty) specs[k] = c.text.trim(); }
      addSpec('dialSize', _dialSizeCtrl); addSpec('dialColor', _dialColorCtrl); addSpec('caseColor', _caseColorCtrl);
      addSpec('strapMaterial', _strapMatCtrl); addSpec('strapColor', _strapColCtrl); addSpec('movement', _movementCtrl);
      addSpec('glass', _glassCtrl); addSpec('waterResistance', _waterCtrl);

      final body = <String, dynamic>{
        'name': _nameCtrl.text.trim(), 'status': _status, 'price': double.tryParse(_priceCtrl.text) ?? 0,
        'sku': _skuCtrl.text.trim(), 'gallery': _gallery, 'showInNewArrivals': _newArrivals, 'showInForYou': _forYou, 'specs': specs,
      };
      void addOpt(String k, String v) { if (v.isNotEmpty) body[k] = v; }
      void addOptN(String k, String v) { if (v.isNotEmpty) body[k] = double.tryParse(v); }
      addOpt('nameAr', _nameArCtrl.text.trim()); addOpt('description', _descCtrl.text.trim());
      addOpt('descriptionAr', _descArCtrl.text.trim()); addOpt('detailedDescription', _detailCtrl.text.trim());
      addOpt('detailedDescriptionAr', _detailArCtrl.text.trim()); addOptN('compareAtPrice', _compareCtrl.text);
      addOptN('costPrice', _costCtrl.text); addOpt('slug', _slugCtrl.text.trim());
      addOpt('metaTitle', _metaTitleCtrl.text.trim()); addOpt('metaTitleAr', _metaTitleArCtrl.text.trim());
      addOpt('metaDescription', _metaDescCtrl.text.trim()); addOpt('metaDescriptionAr', _metaDescArCtrl.text.trim());
      if (_catId != null) body['categoryId'] = _catId;
      if (_brandId != null) body['brandId'] = _brandId;
      if (_matId != null) body['materialId'] = _matId;
      if (_suppId != null) body['supplierId'] = _suppId;
      if (_imageUrl != null) body['imageUrl'] = _imageUrl;
      if (_stockCtrl.text.isNotEmpty) body['stock'] = int.tryParse(_stockCtrl.text);

      if (_isEdit) { await client.put('${ApiConfig.authProductsEndpoint}/${widget.product!['id']}', body: body); }
      else { await client.post(ApiConfig.authProductsEndpoint, body: body); }
      if (mounted) { _snack(_isEdit ? 'Product updated' : 'Product created', ok: true); Navigator.pop(context, true); }
    } catch (e) { if (mounted) _snack('Save failed: $e'); }
    finally { if (mounted) setState(() => _saving = false); }
  }

  void _snack(String m, {bool ok = false}) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(
    content: Text(m, style: const TextStyle(color: Colors.white)),
    backgroundColor: ok ? AppColors.success : AppColors.error,
    behavior: SnackBarBehavior.floating,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  ));

  // ── UI Helpers ──
  Widget _field(String label, TextEditingController c, {bool req = false, bool num = false, int lines = 1, IconData? icon}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        controller: c,
        keyboardType: num ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
        maxLines: lines,
        style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted),
          prefixIcon: icon != null ? Icon(icon, size: 18, color: AppColors.textMuted) : null,
          filled: true, fillColor: AppColors.background,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.cardBorder)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.cardBorder)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.primaryDark, width: 1.5)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
        validator: req ? (v) => (v == null || v.isEmpty) ? 'Required' : null : null,
      ),
    );
  }

  Widget _section(String title, IconData icon, List<Widget> children) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.03), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 12),
            child: Row(children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                child: Icon(icon, size: 16, color: AppColors.accent),
              ),
              const SizedBox(width: 12),
              Text(title, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
            ]),
          ),
          const Divider(height: 1),
          Padding(padding: const EdgeInsets.all(18), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children)),
        ],
      ),
    );
  }

  Widget _dropdown(String label, IconData icon, List<dynamic> items, String? value, ValueChanged<String?> onChanged) {
    final valid = items.any((i) => i['id']?.toString() == value);
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: DropdownButtonFormField<String>(
        initialValue: valid ? value : null,
        decoration: InputDecoration(
          labelText: label, labelStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted),
          prefixIcon: Icon(icon, size: 18, color: AppColors.textMuted),
          filled: true, fillColor: AppColors.background,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.cardBorder)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.cardBorder)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
        items: items.map((i) => DropdownMenuItem(value: i['id']?.toString(), child: Text(i['name'], style: GoogleFonts.inter(fontSize: 14)))).toList(),
        onChanged: onChanged,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_isEdit ? 'Edit Product' : 'New Product', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
            if (_isEdit) Text(_nameCtrl.text, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted), overflow: TextOverflow.ellipsis),
          ],
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: TabBar(
            controller: _tabController,
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            labelColor: AppColors.accent,
            unselectedLabelColor: AppColors.textMuted,
            labelStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700),
            unselectedLabelStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500),
            indicatorColor: AppColors.accent,
            indicatorSize: TabBarIndicatorSize.label,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            tabs: const [
              Tab(icon: Icon(LucideIcons.fileText, size: 16), text: 'Basic'),
              Tab(icon: Icon(LucideIcons.camera, size: 16), text: 'Media'),
              Tab(icon: Icon(LucideIcons.dollarSign, size: 16), text: 'Pricing'),
              Tab(icon: Icon(LucideIcons.globe, size: 16), text: 'SEO'),
            ],
          ),
        ),
      ),
      body: _loadingOpts
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : Form(
              key: _formKey,
              child: TabBarView(controller: _tabController, children: [_tab1(), _tab2(), _tab3(), _tab4()]),
            ),
      bottomNavigationBar: Container(
        padding: EdgeInsets.fromLTRB(16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: const Border(top: BorderSide(color: AppColors.cardBorder)),
          boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.05), blurRadius: 16, offset: const Offset(0, -4))],
        ),
        child: ElevatedButton(
          onPressed: _saving ? null : _save,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primaryDark, foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 0,
          ),
          child: _saving
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : Text(_isEdit ? 'Update Product' : 'Create Product', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
        ),
      ),
    );
  }

  // ── Tab 1: Basic Info ──
  Widget _tab1() => ListView(padding: const EdgeInsets.all(16), children: [
    _section('Product Details', LucideIcons.package, [
      _field('Product Name (English)', _nameCtrl, req: true, icon: LucideIcons.type),
      _field('Product Name (Arabic)', _nameArCtrl, icon: LucideIcons.languages),
      _field('Short Description', _descCtrl, lines: 3, icon: LucideIcons.alignLeft),
      _field('Short Description (Arabic)', _descArCtrl, lines: 3, icon: LucideIcons.alignRight),
      _field('Detailed Description', _detailCtrl, lines: 5),
      _field('Detailed Description (Arabic)', _detailArCtrl, lines: 5),
    ]),
  ]);

  // ── Tab 2: Media & Specs ──
  Widget _tab2() => ListView(padding: const EdgeInsets.all(16), children: [
    _section('Main Image', LucideIcons.image, [
      GestureDetector(
        onTap: () => _pickImage(false),
        child: Container(
          height: 200,
          decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.cardBorder)),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: _imageFile != null
                ? Image.file(_imageFile!, fit: BoxFit.cover, width: double.infinity)
                : _imageUrl != null
                    ? CachedNetworkImage(imageUrl: _imageUrl!, fit: BoxFit.cover, width: double.infinity)
                    : Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.08), shape: BoxShape.circle),
                          child: Icon(LucideIcons.imagePlus, size: 32, color: AppColors.accent.withValues(alpha: 0.5)),
                        ),
                        const SizedBox(height: 12),
                        Text('Tap to upload', style: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted)),
                      ]),
          ),
        ),
      ),
    ]),
    _section('Gallery', LucideIcons.image, [
      SizedBox(
        height: 90,
        child: ListView.builder(
          scrollDirection: Axis.horizontal,
          itemCount: _gallery.length + 1,
          itemBuilder: (_, i) {
            if (i == _gallery.length) {
              return GestureDetector(
                onTap: () => _pickImage(true),
                child: Container(
                  width: 90, margin: const EdgeInsets.only(right: 8),
                  decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.cardBorder)),
                  child: const Center(child: Icon(LucideIcons.plus, color: AppColors.accent)),
                ),
              );
            }
            return Stack(children: [
              Container(
                width: 90, margin: const EdgeInsets.only(right: 8),
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.cardBorder)),
                child: ClipRRect(borderRadius: BorderRadius.circular(14), child: CachedNetworkImage(imageUrl: _gallery[i], fit: BoxFit.cover)),
              ),
              Positioned(top: 4, right: 12, child: GestureDetector(
                onTap: () => setState(() => _gallery.removeAt(i)),
                child: Container(padding: const EdgeInsets.all(4), decoration: BoxDecoration(color: Colors.white, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 4)]),
                  child: const Icon(LucideIcons.x, size: 12, color: Colors.red)),
              )),
            ]);
          },
        ),
      ),
    ]),
    _section('Specifications', LucideIcons.settings, [
      _field('Dial Size', _dialSizeCtrl, icon: LucideIcons.ruler),
      _field('Dial Color', _dialColorCtrl, icon: LucideIcons.palette),
      _field('Case Color', _caseColorCtrl, icon: LucideIcons.box),
      _field('Strap Material', _strapMatCtrl, icon: LucideIcons.link),
      _field('Strap Color', _strapColCtrl, icon: LucideIcons.palette),
      _field('Movement', _movementCtrl, icon: LucideIcons.cog),
      _field('Glass Type', _glassCtrl, icon: LucideIcons.glasses),
      _field('Water Resistance', _waterCtrl, icon: LucideIcons.droplets),
    ]),
  ]);

  // ── Tab 3: Pricing & Merchandising ──
  Widget _tab3() => ListView(padding: const EdgeInsets.all(16), children: [
    _section('Pricing', LucideIcons.dollarSign, [
      _field('Sale Price (EGP)', _priceCtrl, req: true, num: true, icon: LucideIcons.tag),
      _field('Compare At Price', _compareCtrl, num: true, icon: LucideIcons.arrowUpDown),
      _field('Cost Price', _costCtrl, num: true, icon: LucideIcons.receipt),
      _field('SKU', _skuCtrl, req: true, icon: LucideIcons.hash),
      _field('Stock Quantity', _stockCtrl, num: true, icon: LucideIcons.warehouse),
    ]),
    _section('Organization', LucideIcons.folderTree, [
      _dropdown('Category', LucideIcons.layoutGrid, _cats, _catId, (v) => setState(() => _catId = v)),
      _dropdown('Brand', LucideIcons.award, _brands, _brandId, (v) => setState(() => _brandId = v)),
      _dropdown('Material', LucideIcons.gem, _mats, _matId, (v) => setState(() => _matId = v)),
      _dropdown('Supplier', LucideIcons.truck, _supps, _suppId, (v) => setState(() => _suppId = v)),
      const SizedBox(height: 8),
      Text('Visibility', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
      const SizedBox(height: 8),
      DropdownButtonFormField<String>(
        initialValue: _status,
        decoration: InputDecoration(
          prefixIcon: const Icon(LucideIcons.eye, size: 18, color: AppColors.textMuted),
          filled: true, fillColor: AppColors.background,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.cardBorder)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.cardBorder)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
        items: const [DropdownMenuItem(value: 'active', child: Text('Active')), DropdownMenuItem(value: 'draft', child: Text('Draft'))],
        onChanged: (v) => setState(() => _status = v!),
      ),
    ]),
    _section('Merchandising', LucideIcons.sparkles, [
      _switch('Show in New Arrivals', 'Featured on the homepage', _newArrivals, (v) => setState(() => _newArrivals = v)),
      _switch('Show in "For You"', 'Personalized recommendations', _forYou, (v) => setState(() => _forYou = v)),
    ]),
  ]);

  // ── Tab 4: SEO ──
  Widget _tab4() => ListView(padding: const EdgeInsets.all(16), children: [
    _section('SEO & Metadata', LucideIcons.search, [
      _field('URL Slug', _slugCtrl, icon: LucideIcons.link2),
      _field('Meta Title (EN)', _metaTitleCtrl, icon: LucideIcons.heading1),
      _field('Meta Title (AR)', _metaTitleArCtrl, icon: LucideIcons.heading1),
      _field('Meta Description (EN)', _metaDescCtrl, lines: 3, icon: LucideIcons.fileText),
      _field('Meta Description (AR)', _metaDescArCtrl, lines: 3, icon: LucideIcons.fileText),
    ]),
  ]);

  Widget _switch(String title, String sub, bool val, ValueChanged<bool> onChanged) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(14)),
      child: SwitchListTile(
        title: Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
        subtitle: Text(sub, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
        value: val, onChanged: onChanged,
        activeTrackColor: AppColors.accent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    );
  }
}
