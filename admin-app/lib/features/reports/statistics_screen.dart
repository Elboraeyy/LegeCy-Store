import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';
import 'package:admin_app/features/reports/stats_widgets.dart';

class StatisticsScreen extends StatefulWidget {
  const StatisticsScreen({super.key});
  @override
  State<StatisticsScreen> createState() => _StatisticsScreenState();
}

class _StatisticsScreenState extends State<StatisticsScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/statistics');
      if (mounted) setState(() { _data = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primaryDark,
        onRefresh: _load,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverAppBar(
              pinned: true,
              backgroundColor: AppColors.background,
              surfaceTintColor: Colors.transparent,
              expandedHeight: 100,
              leading: IconButton(
                icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark),
                onPressed: () => Navigator.pop(context),
              ),
              flexibleSpace: FlexibleSpaceBar(
                titlePadding: const EdgeInsets.only(left: 56, bottom: 16),
                title: Text('Statistics', style: GoogleFonts.playfairDisplay(
                  fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
              ),
              actions: [
                IconButton(
                  icon: const Icon(LucideIcons.refreshCw, size: 20, color: AppColors.primaryDark),
                  onPressed: () { HapticFeedback.lightImpact(); _load(); },
                ),
                const SizedBox(width: 8),
              ],
            ),
            if (_loading)
              const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: AppColors.primaryDark)))
            else if (_error != null)
              SliverFillRemaining(child: _buildError())
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                sliver: SliverList(delegate: SliverChildListDelegate(_buildContent())),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildError() {
    return Center(child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(LucideIcons.wifiOff, size: 48, color: AppColors.error.withValues(alpha: 0.5)),
        const SizedBox(height: 12),
        Text('Failed to load statistics', style: GoogleFonts.inter(color: AppColors.error, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Text(_error ?? '', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted), textAlign: TextAlign.center),
        const SizedBox(height: 16),
        ElevatedButton.icon(onPressed: _load, icon: const Icon(LucideIcons.refreshCw, size: 16), label: const Text('Retry')),
      ],
    ));
  }

  List<Widget> _buildContent() {
    final o = _data!['overview'] as Map<String, dynamic>;
    final g = _data!['growth'] as Map<String, dynamic>;
    final status = _data!['statusDistribution'] as Map<String, dynamic>;
    final trend = (_data!['revenueTrend'] as List?) ?? [];
    final topProducts = (_data!['topProducts'] as List?) ?? [];
    final topCustomers = (_data!['topCustomers'] as List?) ?? [];
    final topCities = (_data!['topCities'] as List?) ?? [];
    final sources = (_data!['orderSources'] as List?) ?? [];
    final payments = (_data!['paymentMethods'] as List?) ?? [];
    final hourly = (_data!['hourlyDistribution'] as List?) ?? [];

    return [
      // ── Hero Summary ──
      _buildHeroSummary(o, g),
      const SizedBox(height: 16),

      // ── KPI Grid ──
      Row(children: [
        Expanded(child: KpiCard(label: "Today's Orders", value: '${o['todayOrders']}', icon: LucideIcons.shoppingBag, color: AppColors.info, growth: (g['ordersGrowth'] as num?)?.toDouble())),
        const SizedBox(width: 10),
        Expanded(child: KpiCard(label: "Today's Revenue", value: '${_fmtNum(o['todayRevenue'])} EGP', icon: LucideIcons.trendingUp, color: AppColors.success, growth: (g['revenueGrowth'] as num?)?.toDouble())),
      ]),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(child: KpiCard(label: 'Avg Order Value', value: '${_fmtNum(o['averageOrderValue'])} EGP', icon: LucideIcons.calculator, color: const Color(0xFF8B5CF6))),
        const SizedBox(width: 10),
        Expanded(child: KpiCard(label: 'Total Customers', value: '${o['totalCustomers']}', icon: LucideIcons.users, color: const Color(0xFF0EA5E9))),
      ]),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(child: KpiCard(label: 'Pending Orders', value: '${status['pending'] ?? 0}', icon: LucideIcons.clock, color: AppColors.warning)),
        const SizedBox(width: 10),
        Expanded(child: KpiCard(label: 'Low Stock', value: '${o['lowStockCount']}', icon: LucideIcons.alertTriangle, color: AppColors.error)),
      ]),
      const SizedBox(height: 20),

      // ── Revenue Chart ──
      RevenueChart(data: trend),
      const SizedBox(height: 16),

      // ── Orders Chart ──
      OrdersBarChart(data: trend),
      const SizedBox(height: 16),

      // ── Status Pie ──
      StatusPieChart(data: status),
      const SizedBox(height: 16),

      // ── Monthly Comparison ──
      _buildMonthlyComparison(o, g),
      const SizedBox(height: 16),

      // ── Top Products ──
      RankedListCard(title: 'TOP PRODUCTS', icon: LucideIcons.package2, color: AppColors.accent,
        items: topProducts, getName: (i) => i['name'] ?? '', getValue: (i) => '×${i['quantity'] ?? 0}'),
      const SizedBox(height: 16),

      // ── Top Customers ──
      RankedListCard(title: 'TOP CUSTOMERS', icon: LucideIcons.users, color: const Color(0xFF0EA5E9),
        items: topCustomers, getName: (i) => i['name'] ?? 'Guest', getValue: (i) => '${i['orders']} orders'),
      const SizedBox(height: 16),

      // ── Top Cities ──
      BreakdownCard(title: 'TOP CITIES', icon: LucideIcons.mapPin, color: const Color(0xFF7C3AED),
        items: topCities, getLabel: (i) => i['city'] ?? 'Unknown', getCount: (i) => (i['orders'] as num?)?.toInt() ?? 0),
      const SizedBox(height: 16),

      // ── Order Sources ──
      BreakdownCard(title: 'ORDER SOURCES', icon: LucideIcons.globe, color: const Color(0xFF10B981),
        items: sources, getLabel: (i) => (i['source'] ?? 'unknown').toString().toUpperCase(), getCount: (i) => (i['count'] as num?)?.toInt() ?? 0),
      const SizedBox(height: 16),

      // ── Payment Methods ──
      BreakdownCard(title: 'PAYMENT METHODS', icon: LucideIcons.creditCard, color: const Color(0xFFF59E0B),
        items: payments, getLabel: (i) => (i['method'] ?? 'unknown').toString().toUpperCase(), getCount: (i) => (i['count'] as num?)?.toInt() ?? 0),
      const SizedBox(height: 16),

      // ── Peak Hours ──
      if (hourly.isNotEmpty) _buildPeakHours(hourly),
      const SizedBox(height: 16),

      // ── Repeat Customers ──
      _buildRepeatCustomers(o),
      const SizedBox(height: 40),
    ];
  }

  Widget _buildHeroSummary(Map<String, dynamic> o, Map<String, dynamic> g) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF12403C), Color(0xFF1A5C56)], begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: AppColors.accent, borderRadius: BorderRadius.circular(14)),
            child: const Icon(LucideIcons.barChart3, color: Color(0xFF12403C), size: 22)),
          const SizedBox(width: 14),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Total Revenue', style: GoogleFonts.inter(fontSize: 12, color: Colors.white60, fontWeight: FontWeight.w500)),
            Text('${_fmtNum(o['totalRevenue'])} EGP', style: GoogleFonts.playfairDisplay(fontSize: 26, fontWeight: FontWeight.w700, color: Colors.white)),
          ]),
        ]),
        const SizedBox(height: 16),
        Container(height: 1, color: Colors.white.withValues(alpha: 0.1)),
        const SizedBox(height: 16),
        Row(children: [
          _heroMini('Total Orders', '${o['totalOrders']}'),
          Container(width: 1, height: 36, color: Colors.white.withValues(alpha: 0.1)),
          _heroMini('Products', '${o['totalProducts']}'),
          Container(width: 1, height: 36, color: Colors.white.withValues(alpha: 0.1)),
          _heroMini('This Month', '${_fmtNum(o['thisMonth']?['revenue'] ?? 0)}'),
        ]),
      ]),
    );
  }

  Widget _heroMini(String label, String value) {
    return Expanded(child: Column(children: [
      Text(value, style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
      const SizedBox(height: 2),
      Text(label, style: GoogleFonts.inter(fontSize: 10, color: Colors.white54)),
    ]));
  }

  Widget _buildMonthlyComparison(Map<String, dynamic> o, Map<String, dynamic> g) {
    final thisM = o['thisMonth'] as Map<String, dynamic>? ?? {};
    final lastM = o['lastMonth'] as Map<String, dynamic>? ?? {};
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.cardBorder)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SectionHeader(title: 'MONTHLY COMPARISON', icon: LucideIcons.calendar, color: const Color(0xFF6366F1)),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(child: _monthCol('This Month', '${_fmtNum(thisM['revenue'] ?? 0)} EGP', '${thisM['orders'] ?? 0} orders', AppColors.success)),
          const SizedBox(width: 12),
          Expanded(child: _monthCol('Last Month', '${_fmtNum(lastM['revenue'] ?? 0)} EGP', '${lastM['orders'] ?? 0} orders', AppColors.textMuted)),
        ]),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: ((g['monthlyRevenueGrowth'] as num?) ?? 0) >= 0
                ? AppColors.success.withValues(alpha: 0.08)
                : AppColors.error.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(((g['monthlyRevenueGrowth'] as num?) ?? 0) >= 0 ? LucideIcons.trendingUp : LucideIcons.trendingDown, size: 16,
              color: ((g['monthlyRevenueGrowth'] as num?) ?? 0) >= 0 ? AppColors.success : AppColors.error),
            const SizedBox(width: 8),
            Text('${((g['monthlyRevenueGrowth'] as num?) ?? 0).toStringAsFixed(1)}% revenue growth',
              style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600,
                color: ((g['monthlyRevenueGrowth'] as num?) ?? 0) >= 0 ? AppColors.success : AppColors.error)),
          ]),
        ),
      ]),
    );
  }

  Widget _monthCol(String label, String rev, String orders, Color color) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted, fontWeight: FontWeight.w600)),
      const SizedBox(height: 6),
      Text(rev, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: color)),
      Text(orders, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
    ]);
  }

  Widget _buildPeakHours(List<dynamic> hourly) {
    final sorted = List<dynamic>.from(hourly)..sort((a, b) => (b['orders'] as num).compareTo(a['orders'] as num));
    final top3 = sorted.take(3).toList();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.cardBorder)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SectionHeader(title: 'PEAK HOURS', icon: LucideIcons.clock, color: const Color(0xFFF59E0B)),
        const SizedBox(height: 14),
        ...top3.map((h) {
          final hour = (h['hour'] as num).toInt();
          final label = hour == 0 ? '12 AM' : hour < 12 ? '$hour AM' : hour == 12 ? '12 PM' : '${hour - 12} PM';
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: const Color(0xFFF59E0B).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFFF59E0B))),
              ),
              const SizedBox(width: 12),
              Expanded(child: Text('${h['orders']} orders', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500))),
            ]),
          );
        }),
      ]),
    );
  }

  Widget _buildRepeatCustomers(Map<String, dynamic> o) {
    final rate = (o['repeatCustomerRate'] as num?)?.toInt() ?? 0;
    final count = (o['repeatCustomerCount'] as num?)?.toInt() ?? 0;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.cardBorder)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        SectionHeader(title: 'CUSTOMER LOYALTY', icon: LucideIcons.heart, color: AppColors.error),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('$rate%', style: GoogleFonts.inter(fontSize: 32, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
            Text('Repeat Customer Rate', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(color: AppColors.primaryDark.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(12)),
            child: Column(children: [
              Text('$count', style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
              Text('Repeat\nBuyers', textAlign: TextAlign.center, style: GoogleFonts.inter(fontSize: 9, color: AppColors.textMuted)),
            ]),
          ),
        ]),
      ]),
    );
  }

  String _fmtNum(dynamic v) {
    if (v == null) return '0';
    final n = (v is num) ? v.toDouble() : double.tryParse(v.toString()) ?? 0;
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toStringAsFixed(0);
  }
}
