import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/features/orders/orders_screen.dart';
import 'package:admin_app/features/products/products_screen.dart';
import 'package:admin_app/features/dashboard/dashboard_screen.dart';
import 'package:admin_app/features/reports/reports_screen.dart';
import 'package:admin_app/features/more/more_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 2; // Default: Home (center)

  final _screens = const [
    OrdersScreen(),
    ProductsScreen(),
    DashboardScreen(),
    ReportsScreen(),
    MoreScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.cardBorder, width: 0.5)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: SizedBox(
            height: 68,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _navItem(0, LucideIcons.shoppingBag, 'Orders'),
                _navItem(1, LucideIcons.package2, 'Products'),
                _homeButton(),
                _navItem(3, LucideIcons.barChart3, 'Reports'),
                _navItem(4, LucideIcons.menu, 'More'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _navItem(int index, IconData icon, String label) {
    final isActive = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      behavior: HitTestBehavior.opaque,
      child: SizedBox(
        width: 64,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
              decoration: BoxDecoration(
                color: isActive ? AppColors.primaryDark.withValues(alpha: 0.1) : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                size: 22,
                color: isActive ? AppColors.primaryDark : AppColors.textMuted,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                color: isActive ? AppColors.primaryDark : AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _homeButton() {
    final isActive = _currentIndex == 2;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = 2),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 52,
        height: 52,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isActive
                ? [AppColors.primaryDark, const Color(0xFF1B4332)]
                : [AppColors.primaryDark.withValues(alpha: 0.6), AppColors.primaryDark.withValues(alpha: 0.4)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: isActive
              ? [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4))]
              : [],
        ),
        child: Icon(
          LucideIcons.layoutDashboard,
          size: 24,
          color: isActive ? AppColors.accent : Colors.white.withValues(alpha: 0.8),
        ),
      ),
    );
  }
}
