import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/features/auth/auth_provider.dart';
import 'package:url_launcher/url_launcher.dart';

import 'screens/reviews_screen.dart';
import 'screens/messages_screen.dart';
import '../marketing/screens/coupons_screen.dart';
import '../marketing/screens/promotions_screen.dart';
import '../marketing/screens/affiliates_screen.dart';
import '../settings/screens/store_config_screen.dart';
import '../settings/screens/staff_screen.dart';
import '../settings/screens/activity_log_screen.dart';
import '../settings/screens/notifications_settings_screen.dart';
import '../operations/screens/inventory_screen.dart';
import '../operations/screens/delivery_zones_screen.dart';
import '../operations/screens/procurement_screen.dart';
import 'screens/customers_screen.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final adminName = auth.adminName ?? 'Admin';
    final initial = adminName.isNotEmpty ? adminName[0].toUpperCase() : 'A';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // Elegant Header
          SliverAppBar(
            expandedHeight: 180,
            pinned: true,
            backgroundColor: AppColors.primaryDark,
            surfaceTintColor: Colors.transparent,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.primaryDark,
                      const Color(0xFF1E5C56),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Stack(
                  children: [
                    // Subtle background pattern or shapes
                    Positioned(
                      top: -40,
                      right: -40,
                      child: Container(
                        width: 150,
                        height: 150,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.accent.withValues(alpha: 0.1),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 20,
                      left: 20,
                      child: Row(
                        children: [
                          Container(
                            width: 64,
                            height: 64,
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.accent, width: 2),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.2),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                )
                              ],
                            ),
                            child: Center(
                              child: Text(
                                initial,
                                style: GoogleFonts.playfairDisplay(
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primaryDark,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                adminName,
                                style: GoogleFonts.inter(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.accent.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  'Super Admin',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.accentLight,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              titlePadding: const EdgeInsets.only(left: 20, bottom: 16),
            ),
          ),

          // Content
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 24, 16, 120),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _buildQuickStats(context),
                const SizedBox(height: 32),
                


                _buildSection(
                  title: 'Marketing & Growth',
                  icon: LucideIcons.trendingUp,
                  items: [
                    _MenuItem(title: 'Coupons', subtitle: 'Manage discount codes', icon: LucideIcons.ticket, color: const Color(0xFFF59E0B), screen: const CouponsScreen()),
                    _MenuItem(title: 'Promotions', subtitle: 'BOGO & flash sales', icon: LucideIcons.zap, color: const Color(0xFFEF4444), screen: const PromotionsScreen()),
                    _MenuItem(title: 'Affiliates', subtitle: 'Partner tracking', icon: LucideIcons.users, color: const Color(0xFF14B8A6), screen: const AffiliatesScreen()),
                  ],
                ),
                const SizedBox(height: 24),

                _buildSection(
                  title: 'Audience & Engagement',
                  icon: LucideIcons.heart,
                  items: [
                    _MenuItem(title: 'Customers', subtitle: 'Client CRM & history', icon: LucideIcons.userCheck, color: const Color(0xFF10B981), screen: const CustomersListScreen()),
                    _MenuItem(title: 'Reviews', subtitle: 'Moderate product reviews', icon: LucideIcons.star, color: const Color(0xFFF59E0B), screen: const ReviewsListScreen(), badge: '3'),
                    _MenuItem(title: 'Messages', subtitle: 'Contact form submissions', icon: LucideIcons.mail, color: const Color(0xFF6366F1), screen: const MessagesListScreen(), badge: 'New'),
                  ],
                ),
                const SizedBox(height: 24),

                _buildSection(
                  title: 'Operations',
                  icon: LucideIcons.truck,
                  items: [
                    _MenuItem(title: 'Inventory', subtitle: 'Stock control & alerts', icon: LucideIcons.package, color: const Color(0xFF64748B), screen: const InventoryScreen()),
                    _MenuItem(title: 'Delivery Zones', subtitle: 'Shipping rates & rules', icon: LucideIcons.map, color: const Color(0xFF0EA5E9), screen: const DeliveryZonesScreen()),
                    _MenuItem(title: 'Procurement', subtitle: 'Supplier orders', icon: LucideIcons.shoppingBag, color: const Color(0xFF8B5CF6), screen: const ProcurementScreen()),
                  ],
                ),
                const SizedBox(height: 24),

                _buildSection(
                  title: 'System Settings',
                  icon: LucideIcons.settings,
                  items: [
                    _MenuItem(title: 'Store Config', subtitle: 'Global settings & rules', icon: LucideIcons.settings, color: const Color(0xFF64748B), screen: const StoreConfigScreen()),
                    _MenuItem(title: 'Staff & Team', subtitle: 'Role-based access', icon: LucideIcons.shieldCheck, color: const Color(0xFF0F766E), screen: const StaffScreen()),
                    _MenuItem(title: 'Activity Log', subtitle: 'Audit trail of actions', icon: LucideIcons.clipboardList, color: const Color(0xFF64748B), screen: const ActivityLogScreen()),
                    _MenuItem(title: 'Notifications', subtitle: 'Push alerts setup', icon: LucideIcons.bellRing, color: const Color(0xFFD946EF), screen: const NotificationsSettingsScreen()),
                  ],
                ),
                const SizedBox(height: 32),

                // External Links
                _buildActionCard(
                  context,
                  title: 'Web Dashboard',
                  subtitle: 'Open legecy.store/admin',
                  icon: LucideIcons.globe,
                  color: AppColors.primaryDark,
                  onTap: () async {
                    final uri = Uri.parse('https://www.legecy.store/admin');
                    if (await canLaunchUrl(uri)) {
                      await launchUrl(uri, mode: LaunchMode.externalApplication);
                    }
                  },
                ),
                const SizedBox(height: 16),
                
                // Logout Button
                _buildActionCard(
                  context,
                  title: 'Sign Out',
                  subtitle: 'Securely end your session',
                  icon: LucideIcons.logOut,
                  color: AppColors.error,
                  onTap: () => _confirmLogout(context),
                  isDestructive: true,
                ),
                const SizedBox(height: 32),

                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppColors.textMuted.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text('Legacy Admin Hub', style: GoogleFonts.playfairDisplay(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                      const SizedBox(height: 4),
                      Text('Version 1.0.0 • Production', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                    ],
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickStats(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard('Pending Orders', '12', LucideIcons.clock, const Color(0xFFF59E0B)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard('Low Stock', '4', LucideIcons.alertTriangle, const Color(0xFFEF4444)),
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: AppColors.cardBorder.withValues(alpha: 0.5),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textSecondary),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
          ),
        ],
      ),
    );
  }

  Widget _buildSection({required String title, required IconData icon, required List<_MenuItem> items}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 12),
          child: Row(
            children: [
              Icon(icon, size: 16, color: AppColors.accent),
              const SizedBox(width: 8),
              Text(
                title.toUpperCase(),
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textSecondary,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.cardBorder),
            boxShadow: [
              BoxShadow(
                color: AppColors.cardBorder.withValues(alpha: 0.5),
                blurRadius: 10,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: Column(
            children: items.asMap().entries.map((entry) {
              final index = entry.key;
              final item = entry.value;
              return Column(
                children: [
                  _MenuItemWidget(item: item),
                  if (index < items.length - 1)
                    Divider(height: 1, indent: 64, color: AppColors.divider),
                ],
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildActionCard(BuildContext context, {required String title, required String subtitle, required IconData icon, required Color color, required VoidCallback onTap, bool isDestructive = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDestructive ? color.withValues(alpha: 0.05) : AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isDestructive ? color.withValues(alpha: 0.2) : AppColors.cardBorder),
          boxShadow: isDestructive ? [] : [
            BoxShadow(
              color: AppColors.cardBorder.withValues(alpha: 0.5),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 20, color: color),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: isDestructive ? color : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: isDestructive ? color.withValues(alpha: 0.8) : AppColors.textMuted,
                    ),
                  ),
                ],
              ),
            ),
            Icon(LucideIcons.chevronRight, size: 18, color: isDestructive ? color.withValues(alpha: 0.5) : AppColors.textMuted),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Row(
          children: [
            Icon(LucideIcons.alertCircle, color: AppColors.error),
            const SizedBox(width: 12),
            Text('Sign Out', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w600)),
          ],
        ),
        content: Text('Are you sure you want to end your secure session? You will need to log in again.', style: GoogleFonts.inter(color: AppColors.textSecondary, height: 1.5)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx), 
            style: TextButton.styleFrom(foregroundColor: AppColors.textMuted),
            child: Text('Cancel', style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<AuthProvider>().logout();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('Sign Out', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

class _MenuItem {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final Widget screen;
  final String? badge;

  _MenuItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.screen,
    this.badge,
  });
}

class _MenuItemWidget extends StatelessWidget {
  final _MenuItem item;

  const _MenuItemWidget({required this.item});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Navigator.push(context, MaterialPageRoute(builder: (_) => item.screen));
        },
        highlightColor: item.color.withValues(alpha: 0.05),
        splashColor: item.color.withValues(alpha: 0.1),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: item.color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(item.icon, size: 18, color: item.color),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          item.title,
                          style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                        ),
                        if (item.badge != null) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: item.color,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              item.badge!,
                              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                          ),
                        ]
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.subtitle,
                      style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
                    ),
                  ],
                ),
              ),
              Icon(LucideIcons.chevronRight, size: 16, color: AppColors.textMuted.withValues(alpha: 0.5)),
            ],
          ),
        ),
      ),
    );
  }
}
