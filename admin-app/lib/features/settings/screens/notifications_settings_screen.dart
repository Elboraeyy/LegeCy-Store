import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:admin_app/core/theme/app_theme.dart';

class NotificationsSettingsScreen extends StatefulWidget {
  const NotificationsSettingsScreen({super.key});

  @override
  State<NotificationsSettingsScreen> createState() => _NotificationsSettingsScreenState();
}

class _NotificationsSettingsScreenState extends State<NotificationsSettingsScreen> {
  // Toggle states for notification channels
  bool _orderPush = true;
  bool _orderSound = true;
  bool _lowStockPush = true;
  bool _lowStockEmail = false;
  bool _reviewPush = true;
  bool _messagePush = true;
  bool _financePush = false;
  bool _financeEmail = true;
  bool _teamPush = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Notifications', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        backgroundColor: AppColors.surface, surfaceTintColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: SizedBox(
                height: 36,
                child: ElevatedButton(
                  onPressed: () {
                    HapticFeedback.mediumImpact();
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text('Notification preferences saved', style: TextStyle(color: Colors.white)),
                      backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating,
                    ));
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryDark, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0, padding: const EdgeInsets.symmetric(horizontal: 16)),
                  child: Text('Save', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13)),
                ),
              ),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Orders
          _buildSectionTitle('Order Alerts'),
          _buildNotifCard(
            title: 'New Order Notifications',
            subtitle: 'Get notified when a new order is placed',
            icon: LucideIcons.shoppingBag,
            color: const Color(0xFF3B82F6),
            children: [
              _buildToggle('Push Notification', _orderPush, (v) => setState(() => _orderPush = v)),
              _buildToggle('Alert Sound', _orderSound, (v) => setState(() => _orderSound = v)),
            ],
          ),
          const SizedBox(height: 16),

          // Inventory
          _buildSectionTitle('Inventory Alerts'),
          _buildNotifCard(
            title: 'Low Stock Warnings',
            subtitle: 'Alert when products reach minimum stock level',
            icon: LucideIcons.alertTriangle,
            color: const Color(0xFFF59E0B),
            children: [
              _buildToggle('Push Notification', _lowStockPush, (v) => setState(() => _lowStockPush = v)),
              _buildToggle('Email Summary', _lowStockEmail, (v) => setState(() => _lowStockEmail = v)),
            ],
          ),
          const SizedBox(height: 16),

          // Reviews & Messages
          _buildSectionTitle('Customer Engagement'),
          _buildNotifCard(
            title: 'Reviews & Messages',
            subtitle: 'New reviews and contact form submissions',
            icon: LucideIcons.messageSquare,
            color: const Color(0xFF8B5CF6),
            children: [
              _buildToggle('New Review Alerts', _reviewPush, (v) => setState(() => _reviewPush = v)),
              _buildToggle('New Message Alerts', _messagePush, (v) => setState(() => _messagePush = v)),
            ],
          ),
          const SizedBox(height: 16),

          // Finance
          _buildSectionTitle('Financial'),
          _buildNotifCard(
            title: 'Financial Reports',
            subtitle: 'Daily/weekly summaries and payment alerts',
            icon: LucideIcons.dollarSign,
            color: const Color(0xFF10B981),
            children: [
              _buildToggle('Push Notification', _financePush, (v) => setState(() => _financePush = v)),
              _buildToggle('Email Report', _financeEmail, (v) => setState(() => _financeEmail = v)),
            ],
          ),
          const SizedBox(height: 16),

          // Team
          _buildSectionTitle('Team Activity'),
          _buildNotifCard(
            title: 'Team Updates',
            subtitle: 'Staff login, role changes, and actions',
            icon: LucideIcons.users,
            color: const Color(0xFF0F766E),
            children: [
              _buildToggle('Push Notification', _teamPush, (v) => setState(() => _teamPush = v)),
            ],
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 4),
      child: Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.textMuted, letterSpacing: 0.5)),
    );
  }

  Widget _buildNotifCard({required String title, required String subtitle, required IconData icon, required Color color, required List<Widget> children}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)), child: Icon(icon, size: 20, color: color)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              const SizedBox(height: 2),
              Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
            ])),
          ]),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  Widget _buildToggle(String label, bool value, ValueChanged<bool> onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: AppColors.accent,
          ),
        ],
      ),
    );
  }
}
