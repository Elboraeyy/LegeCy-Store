import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';
import 'package:admin_app/core/widgets/app_toast.dart';
import 'package:intl/intl.dart';

class MonthClosingScreen extends StatefulWidget {
  const MonthClosingScreen({super.key});

  @override
  State<MonthClosingScreen> createState() => _MonthClosingScreenState();
}

class _MonthClosingScreenState extends State<MonthClosingScreen> {
  bool _loading = true;
  Map<String, dynamic> _closing = {};
  bool _isPreview = true;
  int _pendingAuditCount = 0;
  int _month = DateTime.now().month;
  int _year = DateTime.now().year;
  bool _closing_in_progress = false;
  final _currencyFormat = NumberFormat('#,##0.00', 'en');

  @override
  void initState() {
    super.initState();
    _loadClosing();
  }

  Future<void> _loadClosing() async {
    setState(() => _loading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final res = await client.get('/api/admin/auth/finance/month-closing?month=$_month&year=$_year');
      if (mounted) {
        setState(() {
          _closing = Map<String, dynamic>.from(res['closing'] ?? {});
          _isPreview = res['isPreview'] ?? true;
          _pendingAuditCount = res['pendingAuditCount'] ?? 0;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _closeMonth() async {
    if (_closing_in_progress) return;
    setState(() => _closing_in_progress = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.post('/api/admin/auth/finance/month-closing', body: {
        'month': _month,
        'year': _year,
        ..._closing,
      });
      _loadClosing();
      if (mounted) {
        ScaffoldMessenger.of(context).showAppToast(AppToast.snackBar(
          content: Text('Month ${DateFormat('MMMM yyyy').format(DateTime(_year, _month))} closed successfully! ✓'),
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
    } finally {
      if (mounted) setState(() => _closing_in_progress = false);
    }
  }

  void _confirmCloseMonth() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(LucideIcons.alertTriangle, color: AppColors.warning),
            const SizedBox(width: 12),
            Text('Close Month', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w600)),
          ],
        ),
        content: Text(
          'This will distribute profits to all partners and lock this month\'s data. This action cannot be easily undone.\n\nAre you sure?',
          style: GoogleFonts.inter(color: AppColors.textSecondary, height: 1.5),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
            onPressed: () { Navigator.pop(ctx); _closeMonth(); },
            child: const Text('Close Month'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final status = _closing['status'] ?? 'DRAFT';
    final isClosed = status == 'CLOSED' || status == 'LOCKED';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        surfaceTintColor: Colors.transparent,
        title: Text('Month Closing', style: GoogleFonts.playfairDisplay(
          fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark,
        )),
        actions: [
          TextButton.icon(
            icon: const Icon(LucideIcons.calendar, size: 16),
            label: Text('${DateFormat('MMM').format(DateTime(_year, _month))} $_year'),
            onPressed: () {
              // Simple month navigation
              setState(() {
                if (_month == 1) { _month = 12; _year--; }
                else { _month--; }
              });
              _loadClosing();
            },
          ),
          IconButton(
            icon: const Icon(LucideIcons.chevronRight, size: 20),
            onPressed: () {
              setState(() {
                if (_month == 12) { _month = 1; _year++; }
                else { _month++; }
              });
              _loadClosing();
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : RefreshIndicator(
              onRefresh: _loadClosing,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                children: [
                  // Status badge
                  if (isClosed)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.lock, size: 18, color: AppColors.success),
                          const SizedBox(width: 8),
                          Text('Month Closed', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.success)),
                        ],
                      ),
                    )
                  else if (_pendingAuditCount > 0)
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(LucideIcons.alertTriangle, size: 18, color: AppColors.warning),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text('$_pendingAuditCount orders still need audit review',
                              style: GoogleFonts.inter(fontSize: 13, color: AppColors.warning),
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 16),

                  // Revenue section
                  _sectionTitle('REVENUE', LucideIcons.trendingUp, AppColors.success),
                  _dataRow('Total Revenue', _closing['totalRevenue']),
                  _dataRow('Discounts', _closing['totalDiscounts'], isNegative: true),
                  const SizedBox(height: 16),

                  // Costs section
                  _sectionTitle('COSTS', LucideIcons.trendingDown, AppColors.error),
                  _dataRow('COGS (Wholesale)', _closing['totalCOGS'], isNegative: true),
                  _dataRow('Shipping Costs', _closing['totalShippingCosts'], isNegative: true),
                  _dataRow('Packaging Costs', _closing['totalPackagingCosts'], isNegative: true),
                  _dataRow('Extra Expenses', _closing['totalExtraExpenses'], isNegative: true),
                  const Divider(height: 24),
                  _dataRow('Gross Profit', _closing['grossProfit'], isBold: true, color: AppColors.success),
                  const SizedBox(height: 16),

                  // Operating expenses
                  _sectionTitle('OPERATING EXPENSES', LucideIcons.receipt, AppColors.warning),
                  _dataRow('Direct Expenses', _closing['totalOperatingExpenses'], isNegative: true),
                  _dataRow('Amortized (this month)', _closing['totalAmortizedExpenses'], isNegative: true),
                  const Divider(height: 24),

                  // Net profit card
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          ((_closing['netProfit'] ?? 0).toDouble() >= 0 ? AppColors.success : AppColors.error),
                          ((_closing['netProfit'] ?? 0).toDouble() >= 0 ? const Color(0xFF047857) : const Color(0xFFC62828)),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      children: [
                        Text('NET PROFIT', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white70, letterSpacing: 1)),
                        const SizedBox(height: 8),
                        Text('EGP ${_currencyFormat.format((_closing['netProfit'] ?? 0).toDouble())}',
                          style: GoogleFonts.inter(fontSize: 32, fontWeight: FontWeight.w800, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Distribution
                  _sectionTitle('PROFIT DISTRIBUTION', LucideIcons.pieChart, AppColors.info),
                  _dataRow('Reinvestment (40%)', _closing['reinvestmentAmount'], color: AppColors.info),
                  _dataRow('Profit Shares (70% of 60%)', _closing['profitShareAmount'], color: AppColors.accent),
                  _dataRow('Salaries (30% of 60%)', _closing['salaryShareAmount'], color: const Color(0xFF8B5CF6)),
                  const SizedBox(height: 20),

                  // Partner breakdown
                  _sectionTitle('PARTNER SHARES', LucideIcons.users, AppColors.primaryDark),
                  ...(_closing['partnerDistributions'] as List? ?? []).map((p) {
                    final pd = Map<String, dynamic>.from(p);
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.cardBorder),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(
                              color: AppColors.accent.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(child: Text(
                              '${((pd['sharePercentage'] ?? 0).toDouble() * 100).toStringAsFixed(0)}%',
                              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.accent),
                            )),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(pd['partnerName'] ?? '', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                                Text('Profit: ${_currencyFormat.format((pd['profitShare'] ?? 0).toDouble())} + Salary: ${_currencyFormat.format((pd['salaryShare'] ?? 0).toDouble())}',
                                  style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                                ),
                              ],
                            ),
                          ),
                          Text('EGP ${_currencyFormat.format((pd['totalShare'] ?? 0).toDouble())}',
                            style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.success),
                          ),
                        ],
                      ),
                    );
                  }),
                  const SizedBox(height: 24),

                  // Close month button
                  if (_isPreview && !isClosed)
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton.icon(
                        icon: _closing_in_progress
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Icon(LucideIcons.lock, size: 20),
                        label: Text('Close Month', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryDark,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        onPressed: _closing_in_progress ? null : _confirmCloseMonth,
                      ),
                    ),
                ],
              ),
            ),
    );
  }

  Widget _sectionTitle(String title, IconData icon, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 8),
          Text(title, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 1)),
        ],
      ),
    );
  }

  Widget _dataRow(String label, dynamic value, {bool isNegative = false, bool isBold = false, Color? color}) {
    final v = (value ?? 0).toDouble();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 14, fontWeight: isBold ? FontWeight.w700 : FontWeight.w400, color: AppColors.textSecondary)),
          Text(
            '${isNegative ? "-" : ""}EGP ${_currencyFormat.format(v.abs())}',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
              color: color ?? (isNegative ? AppColors.error : AppColors.textPrimary),
            ),
          ),
        ],
      ),
    );
  }
}

