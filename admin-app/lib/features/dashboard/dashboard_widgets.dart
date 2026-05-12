import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:admin_app/core/theme/app_theme.dart';

// ── Shimmer Loading Placeholder ──
class DashboardShimmer extends StatelessWidget {
  const DashboardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _shimmerBox(height: 110)),
            const SizedBox(width: 12),
            Expanded(child: _shimmerBox(height: 110)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _shimmerBox(height: 110)),
            const SizedBox(width: 12),
            Expanded(child: _shimmerBox(height: 110)),
          ],
        ),
        const SizedBox(height: 24),
        _shimmerBox(height: 80),
        const SizedBox(height: 24),
        _shimmerBox(height: 200),
        const SizedBox(height: 24),
        _shimmerBox(height: 100),
        const SizedBox(height: 12),
        _shimmerBox(height: 100),
      ],
    );
  }

  Widget _shimmerBox({required double height}) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppColors.shimmer.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(20),
      ),
    );
  }
}

// ── Enhanced Stat Card with Trend ──
class StatCardWithTrend extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final int? changePercent;
  final String? subtitle;

  const StatCardWithTrend({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.changePercent,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, size: 20, color: color),
              ),
              if (changePercent != null)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: changePercent! >= 0
                        ? AppColors.success.withValues(alpha: 0.1)
                        : AppColors.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        changePercent! >= 0
                            ? LucideIcons.trendingUp
                            : LucideIcons.trendingDown,
                        size: 12,
                        color: changePercent! >= 0
                            ? AppColors.success
                            : AppColors.error,
                      ),
                      const SizedBox(width: 3),
                      Text(
                        '${changePercent!.abs()}%',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: changePercent! >= 0
                              ? AppColors.success
                              : AppColors.error,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 14),
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
          if (subtitle != null) ...[
            const SizedBox(height: 2),
            Text(
              subtitle!,
              style: GoogleFonts.inter(fontSize: 9, color: AppColors.textMuted),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Revenue Chart ──
class RevenueChart extends StatelessWidget {
  final List<Map<String, dynamic>> data;

  const RevenueChart({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    if (data.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Center(
          child: Text(
            'No chart data available',
            style: GoogleFonts.inter(color: AppColors.textMuted),
          ),
        ),
      );
    }

    final maxRevenue = data.fold<double>(0, (max, e) {
      final v = (e['revenue'] as num?)?.toDouble() ?? 0;
      return v > max ? v : max;
    });
    final double ceiling = maxRevenue > 0 ? maxRevenue * 1.2 : 1000.0;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 16),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'REVENUE TREND',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textMuted,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Last 7 days',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppColors.textMuted,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  LucideIcons.trendingUp,
                  size: 16,
                  color: AppColors.accent,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 180,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: ceiling,
                barTouchData: BarTouchData(
                  touchTooltipData: BarTouchTooltipData(
                    tooltipBorderRadius: BorderRadius.circular(8),
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      return BarTooltipItem(
                        '${rod.toY.toStringAsFixed(0)} EGP',
                        GoogleFonts.inter(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      );
                    },
                  ),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        final idx = value.toInt();
                        if (idx < 0 || idx >= data.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            data[idx]['day'] ?? '',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              color: AppColors.textMuted,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: ceiling / 4,
                  getDrawingHorizontalLine: (value) =>
                      FlLine(color: AppColors.cardBorder, strokeWidth: 1),
                ),
                borderData: FlBorderData(show: false),
                barGroups: data.asMap().entries.map((e) {
                  final revenue = (e.value['revenue'] as num?)?.toDouble() ?? 0;
                  final isToday = e.key == data.length - 1;
                  return BarChartGroupData(
                    x: e.key,
                    barRods: [
                      BarChartRodData(
                        toY: revenue,
                        color: isToday
                            ? AppColors.accent
                            : AppColors.primaryDark.withValues(alpha: 0.6),
                        width: 20,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(8),
                        ),
                        backDrawRodData: BackgroundBarChartRodData(
                          show: true,
                          toY: ceiling,
                          color: AppColors.primaryDark.withValues(alpha: 0.03),
                        ),
                      ),
                    ],
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Order Pipeline ──
class OrderPipeline extends StatelessWidget {
  final int pending;
  final int processing;
  final int shipped;
  final int delivered;

  const OrderPipeline({
    super.key,
    required this.pending,
    required this.processing,
    required this.shipped,
    required this.delivered,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primaryDark, Color(0xFF1E5C56)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryDark.withValues(alpha: 0.2),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'ORDER PIPELINE',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.white.withValues(alpha: 0.6),
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _pipelineItem('Pending', pending, AppColors.warning),
              _divider(),
              _pipelineItem('Processing', processing, AppColors.info),
              _divider(),
              _pipelineItem('Shipped', shipped, const Color(0xFF7C3AED)),
              _divider(),
              _pipelineItem('Delivered', delivered, AppColors.success),
            ],
          ),
        ],
      ),
    );
  }

  Widget _pipelineItem(String label, int count, Color color) {
    return Expanded(
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '$count',
              style: GoogleFonts.inter(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: Colors.white70,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _divider() {
    return Container(
      width: 1,
      height: 50,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      color: Colors.white.withValues(alpha: 0.15),
    );
  }
}

// ── Quick Action Button ──
class QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  final String? badge;

  const QuickActionButton({
    super.key,
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
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
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, size: 20, color: color),
                ),
                if (badge != null)
                  Positioned(
                    top: -4,
                    right: -6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 5,
                        vertical: 1,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.error,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        badge!,
                        style: GoogleFonts.inter(
                          fontSize: 8,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 28,
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
}

// ── Top Product Item ──
class TopProductItem extends StatelessWidget {
  final int rank;
  final String name;
  final int totalSold;
  final int orderCount;

  const TopProductItem({
    super.key,
    required this.rank,
    required this.name,
    required this.totalSold,
    required this.orderCount,
  });

  @override
  Widget build(BuildContext context) {
    final rankColors = [
      AppColors.accent,
      const Color(0xFF94A3B8),
      const Color(0xFFCD7F32),
    ];
    final rankColor = rank <= 3 ? rankColors[rank - 1] : AppColors.textMuted;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: rankColor.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '#$rank',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: rankColor,
                ),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              name,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '$totalSold sold',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryDark,
                ),
              ),
              Text(
                '$orderCount orders',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Section Header ──
class DashboardSectionHeader extends StatelessWidget {
  final String title;
  final String? trailing;
  final VoidCallback? onTap;

  const DashboardSectionHeader({
    super.key,
    required this.title,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.textMuted,
              letterSpacing: 1.5,
            ),
          ),
          if (trailing != null)
            GestureDetector(
              onTap: onTap,
              child: Text(
                trailing!,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: AppColors.accent,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Monthly Overview Card ──
class MonthlyOverviewCard extends StatelessWidget {
  final double monthlyRevenue;
  final int totalOrders;
  final int totalCustomers;
  final int newCustomersToday;

  const MonthlyOverviewCard({
    super.key,
    required this.monthlyRevenue,
    required this.totalOrders,
    required this.totalCustomers,
    required this.newCustomersToday,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
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
          Text(
            'MONTHLY SNAPSHOT',
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: AppColors.textMuted,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _item(
                'Revenue',
                '${_formatNumber(monthlyRevenue)} EGP',
                AppColors.success,
              ),
              _div(),
              _item('Orders', '$totalOrders', AppColors.info),
              _div(),
              _item('Customers', '$totalCustomers', const Color(0xFF8B5CF6)),
            ],
          ),
          if (newCustomersToday > 0) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    LucideIcons.userPlus,
                    size: 14,
                    color: AppColors.success,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '+$newCustomersToday new customers today',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.success,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _item(String label, String value, Color color) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 10,
              color: AppColors.textMuted,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _div() => Container(width: 1, height: 40, color: AppColors.cardBorder);

  static String _formatNumber(double n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toStringAsFixed(0);
  }
}

// ── Alert Badge Row ──
class AlertBadgesRow extends StatelessWidget {
  final int lowStock;
  final int pendingMessages;
  final int stockRequests;
  final int recentReviews;

  const AlertBadgesRow({
    super.key,
    required this.lowStock,
    required this.pendingMessages,
    required this.stockRequests,
    required this.recentReviews,
  });

  @override
  Widget build(BuildContext context) {
    final items = <_AlertItem>[];
    if (lowStock > 0) {
      items.add(
        _AlertItem(
          'Low Stock',
          '$lowStock items',
          LucideIcons.alertTriangle,
          AppColors.error,
        ),
      );
    }
    if (pendingMessages > 0) {
      items.add(
        _AlertItem(
          'Messages',
          '$pendingMessages unread',
          LucideIcons.mail,
          const Color(0xFF6366F1),
        ),
      );
    }
    if (stockRequests > 0) {
      items.add(
        _AlertItem(
          'Restock',
          '$stockRequests waiting',
          LucideIcons.bellRing,
          const Color(0xFF0EA5E9),
        ),
      );
    }
    if (recentReviews > 0) {
      items.add(
        _AlertItem(
          'Reviews',
          '$recentReviews new',
          LucideIcons.star,
          const Color(0xFFF59E0B),
        ),
      );
    }

    if (items.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'ALERTS & NOTIFICATIONS',
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: AppColors.textMuted,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 70,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: items.length,
            separatorBuilder: (_, _) => const SizedBox(width: 10),
            itemBuilder: (_, i) {
              final item = items[i];
              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: item.color.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: item.color.withValues(alpha: 0.15)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(item.icon, size: 20, color: item.color),
                    const SizedBox(width: 10),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.label,
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: item.color,
                          ),
                        ),
                        Text(
                          item.value,
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: item.color.withValues(alpha: 0.7),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _AlertItem {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  _AlertItem(this.label, this.value, this.icon, this.color);
}
