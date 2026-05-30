import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';
import 'package:admin_app/core/widgets/app_toast.dart';
import 'package:intl/intl.dart';

class ExpensesScreen extends StatefulWidget {
  const ExpensesScreen({super.key});

  @override
  State<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends State<ExpensesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _loading = true;
  List<Map<String, dynamic>> _expenses = [];
  List<Map<String, dynamic>> _amortized = [];
  Map<String, dynamic> _stats = {};
  List<Map<String, dynamic>> _categories = [];
  List<Map<String, dynamic>> _safes = [];
  int _month = DateTime.now().month;
  int _year = DateTime.now().year;
  final _currencyFormat = NumberFormat('#,##0.00', 'en');

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadExpenses();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadExpenses() async {
    setState(() => _loading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final res = await client.get('/api/admin/auth/finance/expenses?month=$_month&year=$_year');
      if (mounted) {
        setState(() {
          _expenses = List<Map<String, dynamic>>.from(res['expenses'] ?? []);
          _amortized = List<Map<String, dynamic>>.from(res['amortizedExpenses'] ?? []);
          _stats = Map<String, dynamic>.from(res['stats'] ?? {});
          _categories = List<Map<String, dynamic>>.from(res['categories'] ?? []);
          _safes = List<Map<String, dynamic>>.from(res['safes'] ?? []);
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showAddExpenseSheet() {
    final descCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    String? categoryId = _categories.isNotEmpty ? _categories.first['id'] : null;
    String? subcategoryId;
    String? safeId;
    bool isAmortized = false;
    final spreadCtrl = TextEditingController(text: '1');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, ss) {
          final selectedCat = _categories.firstWhere(
            (c) => c['id'] == categoryId,
            orElse: () => {'children': []},
          );
          final subcats = List<Map<String, dynamic>>.from(selectedCat['children'] ?? []);

          return Container(
            height: MediaQuery.of(ctx).size.height * 0.8,
            decoration: const BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 12, bottom: 8),
                  child: Container(
                    width: 40, height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.textMuted.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.error.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(LucideIcons.receipt, size: 20, color: AppColors.error),
                      ),
                      const SizedBox(width: 12),
                      Text('New Expense', style: GoogleFonts.playfairDisplay(
                        fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark,
                      )),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    children: [
                      TextField(
                        controller: descCtrl,
                        decoration: const InputDecoration(labelText: 'Description', hintText: 'e.g. Facebook Ads May'),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: amountCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Amount', prefixText: 'EGP '),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: categoryId,
                        decoration: const InputDecoration(labelText: 'Category'),
                        items: _categories.map((c) => DropdownMenuItem(
                          value: c['id'] as String,
                          child: Text(c['name']),
                        )).toList(),
                        onChanged: (v) => ss(() { categoryId = v; subcategoryId = null; }),
                      ),
                      if (subcats.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        DropdownButtonFormField<String>(
                          value: subcategoryId,
                          decoration: const InputDecoration(labelText: 'Subcategory (optional)'),
                          items: [
                            const DropdownMenuItem(value: null, child: Text('None')),
                            ...subcats.map((c) => DropdownMenuItem(
                              value: c['id'] as String,
                              child: Text(c['name']),
                            )),
                          ],
                          onChanged: (v) => ss(() => subcategoryId = v),
                        ),
                      ],
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        value: safeId,
                        decoration: const InputDecoration(labelText: 'Paid from (Safe)'),
                        items: [
                          const DropdownMenuItem(value: null, child: Text('Not specified')),
                          ..._safes.map((s) => DropdownMenuItem(
                            value: s['id'] as String,
                            child: Text(s['name']),
                          )),
                        ],
                        onChanged: (v) => ss(() => safeId = v),
                      ),
                      const SizedBox(height: 16),
                      // Amortization toggle
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: isAmortized ? AppColors.info.withValues(alpha: 0.3) : AppColors.cardBorder),
                        ),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                Icon(LucideIcons.calendarRange, size: 18, color: isAmortized ? AppColors.info : AppColors.textMuted),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Spread across months', style: GoogleFonts.inter(
                                        fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary,
                                      )),
                                      Text('Divide this expense over multiple months', style: GoogleFonts.inter(
                                        fontSize: 11, color: AppColors.textMuted,
                                      )),
                                    ],
                                  ),
                                ),
                                Switch.adaptive(
                                  value: isAmortized,
                                  activeTrackColor: AppColors.info,
                                  onChanged: (v) => ss(() => isAmortized = v),
                                ),
                              ],
                            ),
                            if (isAmortized) ...[
                              const SizedBox(height: 12),
                              TextField(
                                controller: spreadCtrl,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(
                                  labelText: 'Number of months',
                                  hintText: 'e.g. 6',
                                  isDense: true,
                                ),
                              ),
                              if (amountCtrl.text.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                Text(
                                  'Monthly: EGP ${_currencyFormat.format(((double.tryParse(amountCtrl.text) ?? 0) / (int.tryParse(spreadCtrl.text) ?? 1)))}',
                                  style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.info),
                                ),
                              ],
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                  child: SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      icon: const Icon(LucideIcons.plus, size: 20),
                      label: Text('Add Expense', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.error,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      onPressed: () async {
                        if (descCtrl.text.isEmpty || amountCtrl.text.isEmpty) return;
                        Navigator.pop(ctx);
                        try {
                          final token = context.read<AuthProvider>().token;
                          final client = ApiClient(token: token);
                          await client.post('/api/admin/auth/finance/expenses', body: {
                            'description': descCtrl.text,
                            'amount': double.tryParse(amountCtrl.text) ?? 0,
                            'categoryId': categoryId,
                            'subcategoryId': subcategoryId,
                            'safeId': safeId,
                            'isAmortized': isAmortized,
                            'spreadMonths': isAmortized ? (int.tryParse(spreadCtrl.text) ?? 1) : 1,
                          });
                          _loadExpenses();
                          if (mounted) {
                            ScaffoldMessenger.of(context).showAppToast(AppToast.snackBar(
                              content: const Text('Expense added'),
                              backgroundColor: AppColors.success,
                              behavior: SnackBarBehavior.floating,
                            ));
                          }
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showAppToast(AppToast.snackBar(
                              content: Text('Error: $e'),
                              backgroundColor: AppColors.error,
                              behavior: SnackBarBehavior.floating,
                            ));
                          }
                        }
                      },
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showAddCategoryDialog() {
    final nameCtrl = TextEditingController();
    String? parentId;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, ss) => AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text('New Category', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w600)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Category Name')),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: parentId,
                decoration: const InputDecoration(labelText: 'Parent (for subcategory)'),
                items: [
                  const DropdownMenuItem(value: null, child: Text('None (Top-level)')),
                  ..._categories.map((c) => DropdownMenuItem(value: c['id'] as String, child: Text(c['name']))),
                ],
                onChanged: (v) => ss(() => parentId = v),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                if (nameCtrl.text.isEmpty) return;
                Navigator.pop(ctx);
                try {
                  final token = context.read<AuthProvider>().token;
                  final client = ApiClient(token: token);
                  await client.post('/api/admin/auth/finance/expense-categories', body: {
                    'name': nameCtrl.text,
                    'parentId': parentId,
                  });
                  _loadExpenses();
                } catch (e) {
                  // ignore
                }
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final totalDirect = (_stats['totalDirectExpenses'] ?? 0).toDouble();
    final totalAmort = (_stats['totalAmortizedThisMonth'] ?? 0).toDouble();
    final totalAll = (_stats['totalExpensesThisMonth'] ?? 0).toDouble();
    final breakdown = List<Map<String, dynamic>>.from(_stats['categoryBreakdown'] ?? []);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        surfaceTintColor: Colors.transparent,
        title: Text('Expenses', style: GoogleFonts.playfairDisplay(
          fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark,
        )),
        actions: [
          IconButton(icon: const Icon(LucideIcons.folderPlus, size: 20), onPressed: _showAddCategoryDialog, tooltip: 'Add Category'),
          IconButton(icon: const Icon(LucideIcons.plus, size: 20), onPressed: _showAddExpenseSheet, tooltip: 'Add Expense'),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primaryDark,
          labelColor: AppColors.primaryDark,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600),
          tabs: const [
            Tab(text: 'Expenses'),
            Tab(text: 'Analytics'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : TabBarView(
              controller: _tabController,
              children: [
                // Tab 1: Expenses List
                RefreshIndicator(
                  onRefresh: _loadExpenses,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                    children: [
                      // Summary card
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [AppColors.error.withValues(alpha: 0.9), const Color(0xFFC62828)],
                          ),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('${DateFormat('MMMM yyyy').format(DateTime(_year, _month))}',
                              style: GoogleFonts.inter(fontSize: 13, color: Colors.white70),
                            ),
                            const SizedBox(height: 8),
                            Text('EGP ${_currencyFormat.format(totalAll)}',
                              style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w800, color: Colors.white),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                _miniStat('Direct', totalDirect, Colors.white),
                                const SizedBox(width: 16),
                                _miniStat('Amortized', totalAmort, Colors.white),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (_amortized.isNotEmpty) ...[
                        Text('AMORTIZED THIS MONTH', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 1)),
                        const SizedBox(height: 8),
                        ..._amortized.map((e) => _buildExpenseItem(e, isAmortized: true)),
                        const SizedBox(height: 16),
                      ],
                      Text('DIRECT EXPENSES', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 1)),
                      const SizedBox(height: 8),
                      if (_expenses.isEmpty)
                        Padding(
                          padding: const EdgeInsets.all(32),
                          child: Center(child: Text('No expenses this month', style: GoogleFonts.inter(color: AppColors.textMuted))),
                        )
                      else
                        ..._expenses.map((e) => _buildExpenseItem(e)),
                    ],
                  ),
                ),
                // Tab 2: Analytics
                ListView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                  children: [
                    Text('SPENDING BY CATEGORY', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 1)),
                    const SizedBox(height: 12),
                    if (breakdown.isEmpty)
                      Padding(
                        padding: const EdgeInsets.all(40),
                        child: Center(child: Text('No data yet', style: GoogleFonts.inter(color: AppColors.textMuted))),
                      )
                    else
                      ...breakdown.map((cat) {
                        final pct = totalDirect > 0 ? (cat['total'] ?? 0).toDouble() / totalDirect : 0.0;
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.cardBorder),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(cat['categoryName'] ?? '', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                                  Text('EGP ${_currencyFormat.format((cat['total'] ?? 0).toDouble())}',
                                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.error),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: pct.clamp(0.0, 1.0),
                                  backgroundColor: AppColors.cardBorder,
                                  valueColor: const AlwaysStoppedAnimation(AppColors.error),
                                  minHeight: 6,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text('${(pct * 100).toStringAsFixed(1)}% of total • ${cat['count']} expenses',
                                style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                              ),
                            ],
                          ),
                        );
                      }),
                  ],
                ),
              ],
            ),
    );
  }

  Widget _miniStat(String label, double value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 11, color: color.withValues(alpha: 0.7))),
        Text('EGP ${_currencyFormat.format(value)}', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: color)),
      ],
    );
  }

  Widget _buildExpenseItem(Map<String, dynamic> expense, {bool isAmortized = false}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isAmortized ? AppColors.info.withValues(alpha: 0.2) : AppColors.cardBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 38, height: 38,
            decoration: BoxDecoration(
              color: (isAmortized ? AppColors.info : AppColors.error).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              isAmortized ? LucideIcons.calendarRange : LucideIcons.minus,
              size: 16, color: isAmortized ? AppColors.info : AppColors.error,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(expense['description'] ?? '', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(
                  '${(expense['category'] as Map?)?['name'] ?? ''}${expense['safe'] != null ? ' • ${(expense['safe'] as Map)['name']}' : ''}',
                  style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                isAmortized
                    ? 'EGP ${_currencyFormat.format((expense['monthlyAmount'] ?? 0).toDouble())}/mo'
                    : 'EGP ${_currencyFormat.format((expense['amount'] ?? 0).toDouble())}',
                style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.error),
              ),
              if (isAmortized)
                Text('Total: ${_currencyFormat.format((expense['totalAmount'] ?? expense['amount'] ?? 0).toDouble())}',
                  style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted),
                ),
            ],
          ),
        ],
      ),
    );
  }
}



