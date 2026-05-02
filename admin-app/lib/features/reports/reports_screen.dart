import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Reports', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _ReportTile(
            icon: LucideIcons.calendarDays,
            title: 'Daily Report',
            subtitle: 'Today\'s order summary & revenue',
            color: const Color(0xFF0EA5E9),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DailyReportScreen())),
          ),
          const SizedBox(height: 12),
          _ReportTile(
            icon: LucideIcons.barChart3,
            title: 'Analytics',
            subtitle: 'Sales trends, top products & customers',
            color: const Color(0xFF8B5CF6),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AnalyticsScreen())),
          ),
          const SizedBox(height: 12),
          _ReportTile(
            icon: LucideIcons.wallet,
            title: 'Finance Overview',
            subtitle: 'Revenue, expenses & profit summary',
            color: const Color(0xFF10B981),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FinanceScreen())),
          ),
        ],
      ),
    );
  }
}

class _ReportTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _ReportTile({required this.icon, required this.title, required this.subtitle, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: 26),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                  const SizedBox(height: 4),
                  Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                ],
              ),
            ),
            Icon(LucideIcons.chevronRight, size: 20, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}

// ── Daily Report ──
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
          IconButton(
            icon: const Icon(LucideIcons.calendar),
            onPressed: _pickDate,
          ),
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
                        ...(((_data!['statusBreakdown'] ?? []) as List).map((s) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text((s['status'] ?? '').toString().toUpperCase(), style: GoogleFonts.inter(fontSize: 13)),
                              Text('${s['count']}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        ))),
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
                                      width: 24, height: 24,
                                      decoration: BoxDecoration(
                                        color: AppColors.accent.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Center(child: Text('${i + 1}', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.accent))),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(child: Text(p['name'] ?? '', style: GoogleFonts.inter(fontSize: 13), overflow: TextOverflow.ellipsis)),
                                    Text('×${p['quantity'] ?? 0}', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
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

// ── Analytics ──
class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});
  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  Map<String, dynamic>? _data;
  bool _isLoading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/analytics');
      if (mounted) setState(() { _data = data; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Analytics', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
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
                        // Overall stats
                        Row(
                          children: [
                            _stat('Total Orders', '${_data!['totalOrders'] ?? 0}', LucideIcons.shoppingCart, AppColors.info),
                            const SizedBox(width: 12),
                            _stat('Total Revenue', (_data!['totalRevenue'] as num?)?.toStringAsFixed(0) ?? '0', LucideIcons.dollarSign, AppColors.success),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // 7-day stats
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [AppColors.primaryDark.withValues(alpha: 0.08), AppColors.accent.withValues(alpha: 0.05)],
                            ),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.accent.withValues(alpha: 0.1)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('LAST 7 DAYS', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.accent, letterSpacing: 1.5)),
                              const SizedBox(height: 10),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceAround,
                                children: [
                                  Column(children: [
                                    Text('${_data!['last7Days']?['orders'] ?? 0}', style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w700)),
                                    Text('Orders', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                                  ]),
                                  Container(width: 1, height: 40, color: AppColors.cardBorder),
                                  Column(children: [
                                    Text((_data!['last7Days']?['revenue'] as num?)?.toStringAsFixed(0) ?? '0', style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w700)),
                                    Text('Revenue (EGP)', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                                  ]),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Top Products
                        _sectionTitle('TOP PRODUCTS'),
                        const SizedBox(height: 10),
                        ...(((_data!['topProducts'] ?? []) as List).take(5).toList().asMap().entries.map((e) => _listItem('#${e.key + 1}', e.value['name'] ?? '', '×${e.value['quantity'] ?? 0}'))),
                        const SizedBox(height: 20),

                        // Top Customers
                        _sectionTitle('TOP CUSTOMERS'),
                        const SizedBox(height: 10),
                        ...(((_data!['topCustomers'] ?? []) as List).take(5).toList().asMap().entries.map((e) => _listItem('#${e.key + 1}', e.value['name'] ?? 'Guest', '${e.value['orders']} orders'))),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _stat(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.cardBorder)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 10),
          Text(value, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700)),
          Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
        ]),
      ),
    );
  }

  Widget _sectionTitle(String t) => Text(t, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 1.5));

  Widget _listItem(String rank, String name, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.cardBorder)),
      child: Row(
        children: [
          Text(rank, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.accent)),
          const SizedBox(width: 12),
          Expanded(child: Text(name, style: GoogleFonts.inter(fontSize: 13), overflow: TextOverflow.ellipsis)),
          Text(value, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
        ],
      ),
    );
  }
}

// ── Finance ──
class FinanceScreen extends StatelessWidget {
  const FinanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Finance', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.wallet, size: 64, color: AppColors.accent.withValues(alpha: 0.4)),
              const SizedBox(height: 20),
              Text('Finance Dashboard', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Text(
                'For detailed financial reports, expenses, and profit analysis, please use the web dashboard.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted, height: 1.5),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.globe, size: 16, color: AppColors.accent),
                    const SizedBox(width: 8),
                    Text('legecy.store/admin/finance', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.accent)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
