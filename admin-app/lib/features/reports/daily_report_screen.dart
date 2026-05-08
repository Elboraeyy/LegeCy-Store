import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class DailyReportScreen extends StatefulWidget {
  const DailyReportScreen({super.key});
  @override
  State<DailyReportScreen> createState() => _DailyReportScreenState();
}

class _DailyReportScreenState extends State<DailyReportScreen> {
  Map<String, dynamic>? _data;
  bool _isLoading = true;
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final dateStr = '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';
      final data = await client.get('/api/admin/auth/daily?date=$dateStr');
      if (mounted) setState(() { _data = data; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(colorScheme: ColorScheme.dark(primary: AppColors.accent)),
        child: child!,
      ),
    );
    if (picked != null) { _selectedDate = picked; _load(); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Daily Report', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(icon: const Icon(LucideIcons.calendar), onPressed: _pickDate),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : _data == null
              ? Center(child: Text('No data', style: GoogleFonts.inter(color: AppColors.textMuted)))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Date header
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.primaryDark.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.calendarDays, size: 18, color: AppColors.primaryDark),
                              const SizedBox(width: 8),
                              Text(_data!['date'] ?? '', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.primaryDark)),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Stats row
                        Row(
                          children: [
                            Expanded(child: _statCard('Orders', '${_data!['totalOrders'] ?? 0}', LucideIcons.shoppingBag, AppColors.info)),
                            const SizedBox(width: 12),
                            Expanded(child: _statCard('Revenue', '${(_data!['totalRevenue'] as num?)?.toStringAsFixed(0) ?? '0'} EGP', LucideIcons.trendingUp, AppColors.success)),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Status breakdown
                        Text('STATUS BREAKDOWN', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 1.5)),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.cardBorder),
                          ),
                          child: Column(
                            children: (((_data!['statusBreakdown'] ?? []) as List).map((s) => Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(children: [
                                    Container(
                                      width: 8, height: 8,
                                      decoration: BoxDecoration(
                                        color: _statusColor((s['status'] ?? '').toString()),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Text((s['status'] ?? '').toString().toUpperCase(), style: GoogleFonts.inter(fontSize: 13)),
                                  ]),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: _statusColor((s['status'] ?? '').toString()).withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text('${s['count']}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: _statusColor((s['status'] ?? '').toString()))),
                                  ),
                                ],
                              ),
                            ))).toList(),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Top products
                        Text('TOP PRODUCTS', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 1.5)),
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.cardBorder),
                          ),
                          child: Column(
                            children: ((_data!['topProducts'] ?? []) as List).asMap().entries.map((entry) {
                              final i = entry.key;
                              final p = entry.value;
                              return Padding(
                                padding: EdgeInsets.only(bottom: i < ((_data!['topProducts'] as List).length - 1) ? 10 : 0),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 28, height: 28,
                                      decoration: BoxDecoration(
                                        color: AppColors.accent.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Center(child: Text('${i + 1}', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.accent))),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(child: Text(p['name'] ?? '', style: GoogleFonts.inter(fontSize: 13), overflow: TextOverflow.ellipsis)),
                                    Text('×${p['quantity'] ?? 0}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primaryDark)),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING': return AppColors.warning;
      case 'PROCESSING': return AppColors.info;
      case 'SHIPPED': return const Color(0xFF7C3AED);
      case 'DELIVERED': return AppColors.success;
      case 'CANCELLED': return AppColors.error;
      default: return AppColors.textMuted;
    }
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 10),
          Text(value, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
          const SizedBox(height: 2),
          Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
        ],
      ),
    );
  }
}
