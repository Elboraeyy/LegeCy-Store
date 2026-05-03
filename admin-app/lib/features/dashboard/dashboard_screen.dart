import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';
import 'package:admin_app/features/reports/reports_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _stats;
  List<dynamic> _recentOrders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);

      final results = await Future.wait([
        client.get('/api/admin/auth/dashboard'),
        client.get('/api/admin/auth/orders?limit=5'),
      ]);

      if (mounted) {
        setState(() {
          _stats = results[0];
          _recentOrders = (results[1]['orders'] as List<dynamic>?) ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primaryDark,
        onRefresh: _loadData,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            // App Bar
            SliverAppBar(
              pinned: true,
              backgroundColor: AppColors.background,
              surfaceTintColor: Colors.transparent,
              expandedHeight: 110,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.vertical(
                  bottom: Radius.circular(30),
                ),
              ),
              flexibleSpace: FlexibleSpaceBar(
                titlePadding: const EdgeInsets.only(left: 20, bottom: 20, right: 20),
                title: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome back,',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: AppColors.textMuted,
                            fontWeight: FontWeight.w500,
                            letterSpacing: 1.5,
                            height: 1.0,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          auth.adminName ?? 'Admin',
                          style: GoogleFonts.playfairDisplay(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primaryDark,
                            height: 1.1,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              actions: [
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: IconButton(
                    icon: Stack(
                      children: [
                        const Icon(LucideIcons.bell, size: 24, color: AppColors.primaryDark),
                        Positioned(
                          right: 0,
                          top: 0,
                          child: Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                              color: const Color(0xFFD4AF37),
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.background, width: 1.5),
                            ),
                          ),
                        ),
                      ],
                    ),
                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const _NotificationsPage())),
                  ),
                ),
              ],
            ),

            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  if (_isLoading)
                    const SizedBox(height: 200, child: Center(child: CircularProgressIndicator(color: AppColors.primaryDark)))
                  else ...[
                    // Stats Grid (2×2)
                    Row(
                      children: [
                        Expanded(child: _statCard("Today's Orders", '${_stats?['todayOrders'] ?? 0}', LucideIcons.shoppingBag, AppColors.info)),
                        const SizedBox(width: 12),
                        Expanded(child: _statCard('Revenue', '${(_stats?['todayRevenue'] as num?)?.toStringAsFixed(0) ?? '0'} EGP', LucideIcons.trendingUp, AppColors.success)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(child: _statCard('Pending', '${_stats?['pendingOrders'] ?? 0}', LucideIcons.clock, AppColors.warning)),
                        const SizedBox(width: 12),
                        Expanded(child: _statCard('Low Stock', '${_stats?['lowStockCount'] ?? 0}', LucideIcons.alertTriangle, AppColors.error)),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Quick Actions
                    Text('QUICK ACTIONS', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 1.5)),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 86,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          _quickAction(LucideIcons.calendarDays, 'Daily\nReport', const Color(0xFF0EA5E9),
                              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DailyReportScreen()))),
                          _quickAction(LucideIcons.star, 'Reviews', const Color(0xFFF59E0B), () {}),
                          _quickAction(LucideIcons.mail, 'Messages', const Color(0xFF6366F1), () {}),
                          _quickAction(LucideIcons.barChart3, 'Analytics', const Color(0xFF8B5CF6),
                              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AnalyticsScreen()))),
                          _quickAction(LucideIcons.plusCircle, 'New\nProduct', const Color(0xFF10B981), () {}),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Recent Orders
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('RECENT ORDERS', style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 1.5)),
                        Text('${_recentOrders.length} orders', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ..._recentOrders.map((order) => _recentOrderCard(order)),
                    const SizedBox(height: 140), // Bottom padding for floating NavBar
                  ],
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryDark.withValues(alpha: 0.04),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(height: 16),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AppColors.textMuted,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _quickAction(IconData icon, String label, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        width: 80,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.cardBorder),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.06),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 20, color: color),
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 24, // Fixed height for text to prevent overflow
              child: Text(
                label,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                  height: 1.1,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _recentOrderCard(Map<String, dynamic> order) {
    final status = (order['status'] ?? '').toString();
    Color statusColor;
    switch (status.toUpperCase()) {
      case 'PENDING': statusColor = AppColors.warning; break;
      case 'PROCESSING': statusColor = AppColors.info; break;
      case 'SHIPPED': statusColor = const Color(0xFF7C3AED); break;
      case 'DELIVERED': statusColor = AppColors.success; break;
      case 'CANCELLED': statusColor = AppColors.error; break;
      default: statusColor = AppColors.textMuted;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryDark.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                '#${order['orderNumber'] ?? ''}',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: statusColor,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  order['displayName'] ?? 'Guest',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${order['itemCount'] ?? 0} items · ${(order['totalPrice'] as num?)?.toStringAsFixed(0) ?? '0'} EGP',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              status.toUpperCase(),
              style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w700, color: statusColor, letterSpacing: 0.5),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Notifications Page ──
class _NotificationsPage extends StatelessWidget {
  const _NotificationsPage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Notifications', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(LucideIcons.bellOff, size: 48, color: AppColors.accent.withValues(alpha: 0.5)),
              ),
              const SizedBox(height: 20),
              Text('No new notifications', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Text(
                'Push notifications for new orders, reviews, and messages will appear here.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted, height: 1.5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
