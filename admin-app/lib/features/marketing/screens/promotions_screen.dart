import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'flash_sales_screen.dart';
import 'coupons_screen.dart';
import 'bogo_deals_screen.dart';
import 'product_bundles_screen.dart';
import 'general_offers_screen.dart';

class PromotionsScreen extends StatelessWidget {
  const PromotionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Promos & Discounts', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Campaign Types',
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 1.5),
          ),
          const SizedBox(height: 16),
          
          _buildPromoCard(
            context,
            title: 'Discount Coupons',
            subtitle: 'Create and manage reusable promo codes',
            icon: LucideIcons.ticket,
            color: const Color(0xFFF59E0B),
            screen: const CouponsScreen(),
          ),
          const SizedBox(height: 16),
          
          _buildPromoCard(
            context,
            title: 'Flash Sales',
            subtitle: 'Time-limited extreme discounts to drive urgent sales',
            icon: LucideIcons.zap,
            color: const Color(0xFFEF4444),
            screen: const FlashSalesScreen(),
          ),
          const SizedBox(height: 16),
          
          _buildPromoCard(
            context,
            title: 'BOGO Deals',
            subtitle: 'Buy X Get Y Free or discounted offers',
            icon: LucideIcons.copyPlus,
            color: const Color(0xFF3B82F6),
            screen: const BogoDealsScreen(),
          ),
          const SizedBox(height: 16),
          
          _buildPromoCard(
            context,
            title: 'Product Bundles',
            subtitle: 'Group products together for a discounted price',
            icon: LucideIcons.packagePlus,
            color: const Color(0xFF8B5CF6),
            screen: const ProductBundlesScreen(),
          ),
          const SizedBox(height: 16),
          
          _buildPromoCard(
            context,
            title: 'General Offers',
            subtitle: 'Standard percentage or fixed discounts on products',
            icon: LucideIcons.tag,
            color: const Color(0xFF10B981),
            screen: const GeneralOffersScreen(),
          ),
        ],
      ),
    );
  }

  Widget _buildPromoCard(BuildContext context, {required String title, required String subtitle, required IconData icon, required Color color, required Widget screen}) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        Navigator.push(context, MaterialPageRoute(builder: (_) => screen));
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.cardBorder),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.05),
              blurRadius: 16,
              offset: const Offset(0, 8),
            )
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 28, color: color),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                  ),
                ],
              ),
            ),
            Icon(LucideIcons.chevronRight, color: AppColors.textMuted.withValues(alpha: 0.5)),
          ],
        ),
      ),
    );
  }
}
