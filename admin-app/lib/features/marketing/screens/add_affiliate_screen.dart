import 'package:admin_app/core/widgets/app_toast.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class AddAffiliateScreen extends StatefulWidget {
  final Map<String, dynamic>? affiliate;
  const AddAffiliateScreen({super.key, this.affiliate});

  @override
  State<AddAffiliateScreen> createState() => _AddAffiliateScreenState();
}

class _AddAffiliateScreenState extends State<AddAffiliateScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  late TextEditingController _nameCtrl;
  late TextEditingController _codeCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _commissionCtrl;
  bool _isActive = true;

  @override
  void initState() {
    super.initState();
    final a = widget.affiliate;
    _nameCtrl = TextEditingController(text: a?['name'] ?? '');
    _codeCtrl = TextEditingController(text: a?['code'] ?? '');
    _emailCtrl = TextEditingController(text: a?['email'] ?? '');
    _phoneCtrl = TextEditingController(text: a?['phone'] ?? '');
    
    // Commission rate is stored as a decimal (e.g., 0.10 for 10%)
    final commissionRate = a?['commissionRate']?.toString() ?? '0.10';
    final commissionPercentage = (double.parse(commissionRate) * 100).toStringAsFixed(0);
    _commissionCtrl = TextEditingController(text: commissionPercentage);
    
    _isActive = a?['isActive'] ?? true;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _codeCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _commissionCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);

      final commissionPercentage = double.tryParse(_commissionCtrl.text) ?? 10.0;
      final commissionRate = commissionPercentage / 100.0;

      final body = {
        'name': _nameCtrl.text.trim(),
        'code': _codeCtrl.text.trim().toUpperCase(),
        'email': _emailCtrl.text.trim().isNotEmpty ? _emailCtrl.text.trim() : null,
        'phone': _phoneCtrl.text.trim().isNotEmpty ? _phoneCtrl.text.trim() : null,
        'commissionRate': commissionRate,
        'isActive': _isActive,
      };

      if (widget.affiliate != null) {
        await client.put('/api/admin/auth/affiliates/${widget.affiliate!['id']}', body: body);
      } else {
        await client.post('/api/admin/auth/affiliates', body: body);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(AppToast.snackBar(
          content: Text(widget.affiliate != null ? 'Affiliate updated' : 'Affiliate created', style: const TextStyle(color: Colors.white)),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ));
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(AppToast.snackBar(content: Text('Error: $e'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating));
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
        title: Text(widget.affiliate != null ? 'Edit Affiliate' : 'New Affiliate', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w600, color: AppColors.primaryDark)),
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
            _buildSectionTitle('Affiliate Details'),
            _buildCard(
              child: Column(
                children: [
                  _buildTextField(
                    controller: _nameCtrl,
                    label: 'Full Name / Company Name',
                    icon: LucideIcons.user,
                    validator: (v) => v!.isEmpty ? 'Name is required' : null,
                  ),
                  const Divider(height: 32, color: AppColors.background),
                  _buildTextField(
                    controller: _codeCtrl,
                    label: 'Affiliate Code (e.g. PARTNER20)',
                    icon: LucideIcons.hash,
                    textCapitalization: TextCapitalization.characters,
                    validator: (v) => v!.isEmpty ? 'Code is required' : null,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Contact Info
            _buildSectionTitle('Contact Information (Optional)'),
            _buildCard(
              child: Column(
                children: [
                  _buildTextField(
                    controller: _emailCtrl,
                    label: 'Email Address',
                    icon: LucideIcons.mail,
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const Divider(height: 32, color: AppColors.background),
                  _buildTextField(
                    controller: _phoneCtrl,
                    label: 'Phone Number',
                    icon: LucideIcons.phone,
                    keyboardType: TextInputType.phone,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Financial Info
            _buildSectionTitle('Financial & Status'),
            _buildCard(
              child: Column(
                children: [
                  _buildTextField(
                    controller: _commissionCtrl,
                    label: 'Commission Rate (%)',
                    icon: LucideIcons.percent,
                    keyboardType: TextInputType.number,
                    hint: '10',
                    validator: (v) => v!.isEmpty ? 'Commission rate is required' : null,
                  ),
                  const Divider(height: 32, color: AppColors.background),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Active Status', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                          Text('Can this affiliate earn commissions?', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                        ],
                      ),
                      Switch(
                        value: _isActive,
                        onChanged: (v) => setState(() => _isActive = v),
                        activeThumbColor: const Color(0xFF14B8A6),
                      ),
                    ],
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
                  backgroundColor: const Color(0xFF14B8A6),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: _isLoading
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(widget.affiliate != null ? 'Save Changes' : 'Create Affiliate', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
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
    TextInputType? keyboardType,
    TextCapitalization textCapitalization = TextCapitalization.none,
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
          textCapitalization: textCapitalization,
          validator: validator,
          style: GoogleFonts.inter(fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, size: 18, color: AppColors.textMuted),
            filled: true,
            fillColor: AppColors.background,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }
}
