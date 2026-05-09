import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class ProcurementScreen extends StatefulWidget {
  const ProcurementScreen({super.key});

  @override
  State<ProcurementScreen> createState() => _ProcurementScreenState();
}

class _ProcurementScreenState extends State<ProcurementScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _suppliers = [];

  @override
  void initState() {
    super.initState();
    _loadSuppliers();
  }

  Future<void> _loadSuppliers() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/procurement');
      if (mounted) setState(() { _suppliers = data['suppliers'] ?? []; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _deleteSupplier(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      backgroundColor: Colors.white, surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text('Delete Supplier', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
      content: Text('This supplier will be permanently removed. This will fail if there are linked invoices or products.', style: GoogleFonts.inter(color: AppColors.textSecondary)),
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
      await client.delete('/api/admin/auth/procurement/$id');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Supplier deleted'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating));
      _loadSuppliers();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating));
    }
  }

  void _showAddEditDialog({Map<String, dynamic>? supplier}) {
    final nameCtrl = TextEditingController(text: supplier?['name'] ?? '');
    final contactCtrl = TextEditingController(text: supplier?['contactPerson'] ?? '');
    final emailCtrl = TextEditingController(text: supplier?['email'] ?? '');
    final phoneCtrl = TextEditingController(text: supplier?['phone'] ?? '');
    String paymentTerms = supplier?['paymentTerms'] ?? 'NET30';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(builder: (ctx, setModalState) {
        return Container(
          padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
          decoration: const BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.textMuted.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(2)))),
                const SizedBox(height: 16),
                Text(supplier != null ? 'Edit Supplier' : 'New Supplier', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                const SizedBox(height: 20),
                _modalField('Company Name', nameCtrl, LucideIcons.building),
                const SizedBox(height: 12),
                _modalField('Contact Person', contactCtrl, LucideIcons.user),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(child: _modalField('Email', emailCtrl, LucideIcons.mail)),
                  const SizedBox(width: 12),
                  Expanded(child: _modalField('Phone', phoneCtrl, LucideIcons.phone, isNumber: true)),
                ]),
                const SizedBox(height: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Payment Terms', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: paymentTerms,
                      items: ['COD', 'NET15', 'NET30', 'NET60'].map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                      onChanged: (v) => setModalState(() => paymentTerms = v!),
                      style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
                      decoration: InputDecoration(filled: true, fillColor: AppColors.background, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none), contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12)),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity, height: 50,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (nameCtrl.text.isEmpty) return;
                      final body = {
                        'name': nameCtrl.text.trim(),
                        'contactPerson': contactCtrl.text.trim(),
                        'email': emailCtrl.text.trim(),
                        'phone': phoneCtrl.text.trim(),
                        'paymentTerms': paymentTerms,
                      };
                      final messenger = ScaffoldMessenger.of(context);
                      try {
                        final token = context.read<AuthProvider>().token;
                        final client = ApiClient(token: token);
                        if (supplier != null) {
                          await client.put('/api/admin/auth/procurement/${supplier['id']}', body: body);
                        } else {
                          await client.post('/api/admin/auth/procurement', body: body);
                        }
                        if (!context.mounted) return;
                        Navigator.pop(ctx);
                        _loadSuppliers();
                      } catch (e) {
                        if (!context.mounted) return;
                        messenger.showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
                      }
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8B5CF6), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), elevation: 0),
                    child: Text(supplier != null ? 'Save Changes' : 'Create Supplier', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _modalField(String label, TextEditingController ctrl, IconData icon, {bool isNumber = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
        const SizedBox(height: 8),
        TextField(
          controller: ctrl,
          keyboardType: isNumber ? TextInputType.phone : TextInputType.text,
          style: GoogleFonts.inter(fontSize: 14),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, size: 18, color: AppColors.textMuted),
            filled: true, fillColor: AppColors.background,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Procurement', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        backgroundColor: AppColors.surface, surfaceTintColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : _error != null
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error), const SizedBox(height: 16), ElevatedButton(onPressed: _loadSuppliers, child: const Text('Retry'))]))
              : _suppliers.isEmpty
                  ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: const Color(0xFF8B5CF6).withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(LucideIcons.shoppingBag, size: 48, color: Color(0xFF8B5CF6))),
                      const SizedBox(height: 24),
                      Text('No Suppliers Yet', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                      const SizedBox(height: 8),
                      Text('Your supplier list is empty.', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
                    ]))
                  : RefreshIndicator(
                      onRefresh: _loadSuppliers,
                      color: AppColors.primaryDark,
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                        itemCount: _suppliers.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final supplier = _suppliers[index];
                          final balance = supplier['accountBalance']?.toString() ?? '0';
                          final invoiceCount = supplier['invoiceCount'] ?? 0;
                          final productCount = supplier['productCount'] ?? 0;

                          return Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppColors.cardBorder),
                              boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2))],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(12),
                                      decoration: BoxDecoration(color: const Color(0xFF8B5CF6).withValues(alpha: 0.1), shape: BoxShape.circle),
                                      child: const Icon(LucideIcons.building, color: Color(0xFF8B5CF6)),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(supplier['name'] ?? '', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                                          if (supplier['contactPerson'] != null)
                                            Text(supplier['contactPerson'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                                        ],
                                      ),
                                    ),
                                    if (supplier['phone'] != null)
                                      Icon(LucideIcons.phone, size: 16, color: AppColors.textMuted.withValues(alpha: 0.5)),
                                    PopupMenuButton<String>(
                                      icon: const Icon(LucideIcons.moreVertical, color: AppColors.textMuted),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                      onSelected: (v) {
                                        if (v == 'edit') {
                                          _showAddEditDialog(supplier: supplier);
                                        } else if (v == 'delete') {
                                          _deleteSupplier(supplier['id']);
                                        }
                                      },
                                      itemBuilder: (_) => [
                                        const PopupMenuItem(value: 'edit', child: Row(children: [Icon(LucideIcons.edit, size: 16), SizedBox(width: 10), Text('Edit')])),
                                        const PopupMenuDivider(),
                                        const PopupMenuItem(value: 'delete', child: Row(children: [Icon(LucideIcons.trash2, size: 16, color: Colors.red), SizedBox(width: 10), Text('Delete', style: TextStyle(color: Colors.red))])),
                                      ],
                                    ),
                                  ],
                                ),
                                const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Divider(height: 1, color: AppColors.cardBorder)),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    _buildStat('Balance', 'EGP $balance'),
                                    _buildStat('Invoices', '$invoiceCount'),
                                    _buildStat('Products', '$productCount'),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8)),
                                      child: Text(supplier['paymentTerms'] ?? 'N/A', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
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
        onPressed: () { HapticFeedback.lightImpact(); _showAddEditDialog(); },
        backgroundColor: const Color(0xFF8B5CF6),
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: Text('New Supplier', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.white)),
      ),
    );
  }

  Widget _buildStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted)),
        const SizedBox(height: 2),
        Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ],
    );
  }
}
