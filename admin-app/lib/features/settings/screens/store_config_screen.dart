import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class StoreConfigScreen extends StatefulWidget {
  const StoreConfigScreen({super.key});

  @override
  State<StoreConfigScreen> createState() => _StoreConfigScreenState();
}

class _StoreConfigScreenState extends State<StoreConfigScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _configs = [];

  // Controllers for common settings
  final _announcementCtrl = TextEditingController();
  final _shippingFeeCtrl = TextEditingController();
  final _freeShippingThresholdCtrl = TextEditingController();
  final _storeNameCtrl = TextEditingController();
  final _supportPhoneCtrl = TextEditingController();

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadConfigs();
  }

  @override
  void dispose() {
    _announcementCtrl.dispose();
    _shippingFeeCtrl.dispose();
    _freeShippingThresholdCtrl.dispose();
    _storeNameCtrl.dispose();
    _supportPhoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadConfigs() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/settings');
      
      if (mounted) {
        setState(() {
          _configs = data['configs'] as List<dynamic>;
          _mapConfigsToControllers();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  void _mapConfigsToControllers() {
    for (var config in _configs) {
      final key = config['key'];
      final value = config['value'];
      
      switch (key) {
        case 'global_announcement':
          _announcementCtrl.text = value.toString();
          break;
        case 'shipping_fee':
          _shippingFeeCtrl.text = value.toString();
          break;
        case 'free_shipping_threshold':
          _freeShippingThresholdCtrl.text = value.toString();
          break;
        case 'store_name':
          _storeNameCtrl.text = value.toString();
          break;
        case 'support_phone':
          _supportPhoneCtrl.text = value.toString();
          break;
      }
    }
  }

  Future<void> _saveConfig(String key, dynamic value, String description) async {
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      
      await client.put('/api/admin/auth/settings', body: {
        'key': key,
        'value': value,
        'description': description,
      });
    } catch (e) {
      throw Exception('Failed to save $key: $e');
    }
  }

  Future<void> _saveAll() async {
    HapticFeedback.mediumImpact();
    setState(() => _isSaving = true);
    
    try {
      await Future.wait([
        _saveConfig('store_name', _storeNameCtrl.text, 'Store Name Displayed in App/Web'),
        _saveConfig('global_announcement', _announcementCtrl.text, 'Text shown in the top announcement bar'),
        if (_shippingFeeCtrl.text.isNotEmpty) _saveConfig('shipping_fee', double.parse(_shippingFeeCtrl.text), 'Default Flat Shipping Fee'),
        if (_freeShippingThresholdCtrl.text.isNotEmpty) _saveConfig('free_shipping_threshold', double.parse(_freeShippingThresholdCtrl.text), 'Minimum order value for free shipping'),
        _saveConfig('support_phone', _supportPhoneCtrl.text, 'Customer Support Phone Number'),
      ]);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: const Text('Store settings updated successfully', style: TextStyle(color: Colors.white)),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString(), style: const TextStyle(color: Colors.white)),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Store Config', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
        actions: [
          if (!_isLoading)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: SizedBox(
                  height: 36,
                  child: ElevatedButton(
                    onPressed: _isSaving ? null : _saveAll,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryDark,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    child: _isSaving
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text('Save', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                  ),
                ),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: AppColors.error)))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text('Global Settings', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 1.5)),
                    const SizedBox(height: 16),

                    // Store Info
                    _buildConfigCard(
                      title: 'Store Information',
                      icon: LucideIcons.store,
                      color: const Color(0xFF3B82F6),
                      children: [
                        _buildInputField(
                          label: 'Store Name',
                          controller: _storeNameCtrl,
                          icon: LucideIcons.type,
                          hint: 'LegaCy Store',
                        ),
                        const SizedBox(height: 16),
                        _buildInputField(
                          label: 'Support Phone Number',
                          controller: _supportPhoneCtrl,
                          icon: LucideIcons.phone,
                          keyboardType: TextInputType.phone,
                          hint: '+20 123 456 7890',
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Operations
                    _buildConfigCard(
                      title: 'Shipping & Operations',
                      icon: LucideIcons.truck,
                      color: const Color(0xFF10B981),
                      children: [
                        _buildInputField(
                          label: 'Default Shipping Fee (EGP)',
                          controller: _shippingFeeCtrl,
                          icon: LucideIcons.coins,
                          keyboardType: TextInputType.number,
                          hint: '50',
                        ),
                        const SizedBox(height: 16),
                        _buildInputField(
                          label: 'Free Shipping Threshold (EGP)',
                          controller: _freeShippingThresholdCtrl,
                          icon: LucideIcons.gift,
                          keyboardType: TextInputType.number,
                          hint: '1000',
                          helperText: 'Orders above this amount get free shipping',
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Marketing
                    _buildConfigCard(
                      title: 'Marketing & UI',
                      icon: LucideIcons.megaphone,
                      color: const Color(0xFFF59E0B),
                      children: [
                        _buildInputField(
                          label: 'Top Announcement Bar Text',
                          controller: _announcementCtrl,
                          icon: LucideIcons.bellRing,
                          hint: 'Special Offer: Free Shipping on all orders!',
                          maxLines: 2,
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 40),
                  ],
                ),
    );
  }

  Widget _buildConfigCard({required String title, required IconData icon, required Color color, required List<Widget> children}) {
    return Container(
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
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, size: 20, color: color),
              ),
              const SizedBox(width: 12),
              Text(title, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            ],
          ),
          const SizedBox(height: 24),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInputField({required String label, required TextEditingController controller, required IconData icon, String? hint, TextInputType? keyboardType, int maxLines = 1, String? helperText}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          style: GoogleFonts.inter(fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted.withValues(alpha: 0.5)),
            prefixIcon: maxLines == 1 ? Icon(icon, size: 18, color: AppColors.textMuted) : null,
            filled: true,
            fillColor: AppColors.background,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: maxLines == 1 ? 0 : 16),
          ),
        ),
        if (helperText != null) ...[
          const SizedBox(height: 6),
          Text(helperText, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
        ]
      ],
    );
  }
}
