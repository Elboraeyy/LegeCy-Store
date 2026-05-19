import 'package:admin_app/core/widgets/app_toast.dart';
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
  List<dynamic> _invoices = [];

  @override
  void initState() {
    super.initState();
    _loadAllData();
  }

  Future<void> _loadAllData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      
      final suppliersData = await client.get('/api/admin/auth/procurement');
      final invoicesData = await client.get('/api/admin/auth/procurement/invoices');
      
      if (mounted) {
        setState(() { 
          _suppliers = suppliersData['suppliers'] ?? []; 
          _invoices = invoicesData['invoices'] ?? [];
          _isLoading = false; 
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  // --- Supplier Methods ---

  Future<void> _deleteSupplier(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      backgroundColor: Colors.white, surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text('Delete Supplier', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
      content: Text('This supplier will be permanently removed. This will fail if there are linked invoices.', style: GoogleFonts.inter(color: AppColors.textSecondary)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted))),
        ElevatedButton(onPressed: () => Navigator.pop(context, true), style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0), child: const Text('Delete')),
      ],
    ));
    if (ok != true) return;
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.delete('/api/admin/auth/procurement/$id');
      if (!mounted) return;
      messenger.showSnackBar(AppToast.snackBar(content: Text('Supplier deleted'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating));
      _loadAllData();
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(AppToast.snackBar(content: Text('Error: $e'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating));
    }
  }

  void _showAddEditSupplierDialog({Map<String, dynamic>? supplier}) {
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
                        _loadAllData();
                      } catch (e) {
                        if (!context.mounted) return;
                        messenger.showSnackBar(AppToast.snackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
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

  // --- Invoice Methods ---

  Future<void> _deleteInvoice(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      backgroundColor: Colors.white, surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text('Delete Invoice', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
      content: Text('Are you sure you want to delete this purchase invoice?', style: GoogleFonts.inter(color: AppColors.textSecondary)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted))),
        ElevatedButton(onPressed: () => Navigator.pop(context, true), style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0), child: const Text('Delete')),
      ],
    ));
    if (ok != true) return;
    if (!mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.delete('/api/admin/auth/procurement/invoices/$id');
      if (!mounted) return;
      messenger.showSnackBar(AppToast.snackBar(content: Text('Invoice deleted'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating));
      _loadAllData();
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(AppToast.snackBar(content: Text('Error: $e'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating));
    }
  }

  void _showAddInvoiceDialog() {
    final numberCtrl = TextEditingController();
    final totalCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    String? selectedSupplierId;
    String status = 'DRAFT';
    String paymentStatus = 'UNPAID';

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
                Text('Record Purchase Invoice', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                const SizedBox(height: 20),
                
                Text('Supplier', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: selectedSupplierId,
                  items: _suppliers.map((s) => DropdownMenuItem<String>(value: s['id'], child: Text(s['name'] ?? ''))).toList(),
                  onChanged: (v) => setModalState(() => selectedSupplierId = v),
                  decoration: InputDecoration(filled: true, fillColor: AppColors.background, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
                  hint: const Text('Select Supplier'),
                ),
                
                const SizedBox(height: 16),
                _modalField('Invoice Number', numberCtrl, LucideIcons.hash),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(child: _modalField('Total Amount', totalCtrl, LucideIcons.coins, isNumber: true)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Status', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          initialValue: status,
                          items: ['DRAFT', 'POSTED'].map((r) => DropdownMenuItem(value: r, child: Text(r))).toList(),
                          onChanged: (v) => setModalState(() => status = v!),
                          decoration: InputDecoration(filled: true, fillColor: AppColors.background, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)),
                        ),
                      ],
                    ),
                  ),
                ]),
                const SizedBox(height: 12),
                _modalField('Notes', notesCtrl, LucideIcons.stickyNote),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity, height: 50,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (selectedSupplierId == null || numberCtrl.text.isEmpty) return;
                      final body = {
                        'invoiceNumber': numberCtrl.text.trim(),
                        'supplierId': selectedSupplierId,
                        'issueDate': DateTime.now().toIso8601String(),
                        'status': status,
                        'paymentStatus': paymentStatus,
                        'grandTotal': double.tryParse(totalCtrl.text) ?? 0,
                        'notes': notesCtrl.text.trim(),
                      };
                      final messenger = ScaffoldMessenger.of(context);
                      try {
                        final token = context.read<AuthProvider>().token;
                        final client = ApiClient(token: token);
                        await client.post('/api/admin/auth/procurement/invoices', body: body);
                        if (!context.mounted) return;
                        Navigator.pop(ctx);
                        _loadAllData();
                      } catch (e) {
                        if (!context.mounted) return;
                        messenger.showSnackBar(AppToast.snackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
                      }
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8B5CF6), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), elevation: 0),
                    child: const Text('Record Invoice', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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
          keyboardType: isNumber ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
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
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text('Procurement', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
          backgroundColor: AppColors.surface, surfaceTintColor: Colors.transparent, elevation: 0,
          leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(60),
            child: Container(
              height: 50,
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.cardBorder),
              ),
              child: TabBar(
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                indicator: BoxDecoration(
                  color: AppColors.primaryDark,
                  borderRadius: BorderRadius.circular(10),
                ),
                labelColor: Colors.white,
                unselectedLabelColor: AppColors.textMuted,
                labelStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
                unselectedLabelStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500),
                tabs: const [
                  Tab(text: 'Suppliers'),
                  Tab(text: 'Invoices'),
                  Tab(text: 'Performance'),
                ],
              ),
            ),
          ),
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
            : _error != null
                ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error), const SizedBox(height: 16), ElevatedButton(onPressed: _loadAllData, child: const Text('Retry'))]))
                : TabBarView(
                    children: [
                      _buildSuppliersList(),
                      _buildInvoicesList(),
                      _buildPerformanceTab(),
                    ],
                  ),
        floatingActionButton: Builder(
          builder: (context) {
            final tabIndex = DefaultTabController.of(context).index;
            if (tabIndex == 2) return const SizedBox.shrink();
            return FloatingActionButton.extended(
              onPressed: () { 
                HapticFeedback.lightImpact(); 
                if (DefaultTabController.of(context).index == 0) {
                  _showAddEditSupplierDialog();
                } else {
                  _showAddInvoiceDialog();
                }
              },
              backgroundColor: const Color(0xFF8B5CF6),
              icon: const Icon(LucideIcons.plus, color: Colors.white),
              label: Text(tabIndex == 0 ? 'New Supplier' : 'New Invoice', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.white)),
            );
          }
        ),
      ),
    );
  }

  Widget _buildPerformanceTab() {
    double totalSpend = 0;
    double unpaidTotal = 0;
    Map<String, double> supplierSpend = {};
    
    for (var inv in _invoices) {
      final total = (inv['grandTotal'] ?? 0).toDouble();
      totalSpend += total;
      if (inv['paymentStatus'] != 'PAID') unpaidTotal += total;
      
      final sName = inv['supplier']?['name'] ?? 'Unknown';
      supplierSpend[sName] = (supplierSpend[sName] ?? 0) + total;
    }

    final topSuppliers = supplierSpend.entries.toList()..sort((a, b) => b.value.compareTo(a.value));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            Expanded(child: _perfCard('Total Sourcing', 'EGP ${totalSpend.toStringAsFixed(0)}', LucideIcons.shoppingCart, const Color(0xFF8B5CF6))),
            const SizedBox(width: 12),
            Expanded(child: _perfCard('Total Debt', 'EGP ${unpaidTotal.toStringAsFixed(0)}', LucideIcons.alertCircle, AppColors.error)),
          ],
        ),
        const SizedBox(height: 20),
        Text('Spending by Supplier', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 1)),
        const SizedBox(height: 12),
        if (topSuppliers.isEmpty)
          const Center(child: Padding(padding: EdgeInsets.all(40), child: Text('No data available')))
        else
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.cardBorder)),
            child: Column(
              children: topSuppliers.take(5).map((e) {
                final percent = totalSpend > 0 ? (e.value / totalSpend) : 0.0;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(e.key, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                          Text('EGP ${e.value.toStringAsFixed(0)}', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                        ],
                      ),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(value: percent, backgroundColor: AppColors.background, color: const Color(0xFF8B5CF6), minHeight: 6, borderRadius: BorderRadius.circular(3)),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
      ],
    );
  }

  Widget _perfCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.cardBorder)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle), child: Icon(icon, size: 16, color: color)),
          const SizedBox(height: 12),
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
          const SizedBox(height: 4),
          Text(value, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
        ],
      ),
    );
  }

  Widget _buildSuppliersList() {
    if (_suppliers.isEmpty) {
      return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: const Color(0xFF8B5CF6).withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(LucideIcons.building, size: 48, color: Color(0xFF8B5CF6))),
        const SizedBox(height: 24),
        Text('No Suppliers Yet', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
      ]));
    }
    return RefreshIndicator(
      onRefresh: _loadAllData,
      color: AppColors.primaryDark,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        itemCount: _suppliers.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final supplier = _suppliers[index];
          final balance = supplier['accountBalance']?.toString() ?? '0';
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.cardBorder)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: const Color(0xFF8B5CF6).withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(LucideIcons.building, color: Color(0xFF8B5CF6), size: 20)),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(supplier['name'] ?? '', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                      Text(supplier['contactPerson'] ?? 'No contact person', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                    ])),
                    PopupMenuButton<String>(
                      icon: const Icon(LucideIcons.moreVertical, color: AppColors.textMuted),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      onSelected: (v) {
                        if (v == 'edit') {
                          _showAddEditSupplierDialog(supplier: supplier);
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
                    _buildStat('Phone', supplier['phone'] ?? 'N/A'),
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
    );
  }

  Widget _buildInvoicesList() {
    if (_invoices.isEmpty) {
      return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: const Color(0xFF8B5CF6).withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(LucideIcons.fileText, size: 48, color: Color(0xFF8B5CF6))),
        const SizedBox(height: 24),
        Text('No Invoices Yet', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
      ]));
    }
    return RefreshIndicator(
      onRefresh: _loadAllData,
      color: AppColors.primaryDark,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        itemCount: _invoices.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final inv = _invoices[index];
          final supplierName = inv['supplier']?['name'] ?? 'Unknown Supplier';
          final date = DateTime.parse(inv['issueDate']).toLocal();
          final status = inv['status'] ?? 'DRAFT';
          final payment = inv['paymentStatus'] ?? 'UNPAID';

          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.cardBorder)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: const Color(0xFF8B5CF6).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)), child: const Icon(LucideIcons.receipt, color: Color(0xFF8B5CF6), size: 20)),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(inv['invoiceNumber'] ?? '', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                      Text(supplierName, style: GoogleFonts.inter(fontSize: 12, color: AppColors.primaryDark, fontWeight: FontWeight.w600)),
                    ])),
                    PopupMenuButton<String>(
                      icon: const Icon(LucideIcons.moreVertical, color: AppColors.textMuted),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      onSelected: (v) {
                        if (v == 'delete') _deleteInvoice(inv['id']);
                      },
                      itemBuilder: (_) => [
                        const PopupMenuItem(value: 'delete', child: Row(children: [Icon(LucideIcons.trash2, size: 16, color: Colors.red), SizedBox(width: 10), Text('Delete', style: TextStyle(color: Colors.red))])),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('${date.day}/${date.month}/${date.year}', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                      Text('EGP ${inv['grandTotal']}', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    ]),
                    Row(children: [
                      _statusBadge(status),
                      const SizedBox(width: 8),
                      _paymentBadge(payment),
                    ]),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _statusBadge(String status) {
    final color = status == 'POSTED' ? AppColors.success : AppColors.warning;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(status, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: color)),
    );
  }

  Widget _paymentBadge(String status) {
    final color = status == 'PAID' ? AppColors.success : (status == 'PARTIAL' ? AppColors.warning : AppColors.error);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(status, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: color)),
    );
  }

  Widget _buildStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted)),
        const SizedBox(height: 2),
        Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
      ],
    );
  }
}

