import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:admin_app/core/theme/app_theme.dart';

class ProductBundlesScreen extends StatelessWidget {
  const ProductBundlesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Product Bundles', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        backgroundColor: AppColors.surface, surfaceTintColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
      ),
      body: Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: const Color(0xFF8B5CF6).withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(LucideIcons.packagePlus, size: 48, color: Color(0xFF8B5CF6))),
          const SizedBox(height: 24),
          Text('No Product Bundles', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
          const SizedBox(height: 8),
          Text('Combine products to increase AOV.', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
        ]),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          HapticFeedback.lightImpact();
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Coming soon')));
        },
        backgroundColor: const Color(0xFF8B5CF6),
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: Text('New Bundle', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.white)),
      ),
    );
  }
}
