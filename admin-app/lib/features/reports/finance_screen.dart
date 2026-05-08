import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class FinanceScreen extends StatefulWidget {
  const FinanceScreen({super.key});
  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen> {
  Map<String, dynamic>? _data;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() { super.initState(); _loadFinance(); }

  Future<void> _loadFinance() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/finance');
      if (mounted) setState(() { _data = data; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Finance', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: RefreshIndicator(
        color: AppColors.primaryDark,
        onRefresh: _loadFinance,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(LucideIcons.wifiOff, size: 48, color: AppColors.error.withValues(alpha: 0.5)),
                        const SizedBox(height: 12),
                        Text('Failed to load', style: GoogleFonts.inter(color: AppColors.error)),
                        TextButton(onPressed: _loadFinance, child: const Text('Retry')),
                      ],
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      Row(
                        children: [
                          _financeStat('Revenue', _data!['overview']['totalRevenue'].toString(), LucideIcons.trendingUp, AppColors.success),
                          const SizedBox(width: 12),
                          _financeStat('Expenses', _data!['overview']['totalExpenses'].toString(), LucideIcons.trendingDown, AppColors.error),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: [AppColors.primaryDark, AppColors.primaryDark.withValues(alpha: 0.8)]),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Net Profit', style: GoogleFonts.inter(color: Colors.white70, fontSize: 13)),
                            const SizedBox(height: 8),
                            Text(
                              '${_data!['overview']['netProfit']} EGP',
                              style: GoogleFonts.playfairDisplay(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                      Text('RECENT EXPENSES', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 1.5)),
                      const SizedBox(height: 12),
                      if ((_data!['recentExpenses'] as List).isEmpty)
                        Padding(
                          padding: const EdgeInsets.all(32),
                          child: Center(child: Text('No recent expenses', style: GoogleFonts.inter(color: AppColors.textMuted))),
                        )
                      else
                        ...(_data!['recentExpenses'] as List).map((expense) {
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.card,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.cardBorder),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(color: AppColors.error.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                                  child: const Icon(LucideIcons.receipt, color: AppColors.error, size: 20),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(expense['title'] ?? 'Expense', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                                      Text(expense['category'] ?? '', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                                    ],
                                  ),
                                ),
                                Text('${expense['amount']} EGP', style: GoogleFonts.inter(fontWeight: FontWeight.w700, color: AppColors.error)),
                              ],
                            ),
                          );
                        }),
                    ],
                  ),
      ),
    );
  }

  Widget _financeStat(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.cardBorder)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(height: 12),
            Text('$value EGP', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700)),
            Text(label, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
          ],
        ),
      ),
    );
  }
}
