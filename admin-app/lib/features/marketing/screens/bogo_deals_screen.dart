import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class BogoDealsScreen extends StatefulWidget {
  const BogoDealsScreen({super.key});
  @override
  State<BogoDealsScreen> createState() => _BogoDealsScreenState();
}

class _BogoDealsScreenState extends State<BogoDealsScreen> {
  List<dynamic> _deals = [];
  bool _isLoading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/bogo');
      if (mounted) setState(() { _deals = data['deals'] as List<dynamic>; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleActive(String id, bool isActive) async {
    HapticFeedback.lightImpact();
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.put('/api/admin/auth/bogo/$id', body: { 'isActive': !isActive });
      _load();
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _deleteDeal(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('Delete Deal?', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        content: Text('Are you sure you want to delete this BOGO deal?', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted, fontWeight: FontWeight.w600))),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true) return;

    HapticFeedback.mediumImpact();
    setState(() => _isLoading = true);
    if (!mounted) return;
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.delete('/api/admin/auth/bogo/$id');
      _load();
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showCreateDialog() {
    // This is a simplified create dialog for BOGO
    final nameController = TextEditingController();
    final buyController = TextEditingController(text: '1');
    final getController = TextEditingController(text: '1');
    final discountController = TextEditingController(text: '100');
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('New BOGO Deal', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: InputDecoration(
                  labelText: 'Deal Name',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: buyController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Buy Qty',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextField(
                      controller: getController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Get Qty',
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: discountController,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'Discount % (e.g. 100 for FREE)',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted))),
          ElevatedButton(
            onPressed: () async {
              if (nameController.text.isEmpty) return;
              Navigator.pop(ctx);
              setState(() => _isLoading = true);
              try {
                final token = context.read<AuthProvider>().token;
                final client = ApiClient(token: token);
                await client.post('/api/admin/auth/bogo', body: {
                  'name': nameController.text,
                  'buyQuantity': buyController.text,
                  'getQuantity': getController.text,
                  'discountPercent': discountController.text,
                });
                _load();
              } catch (e) {
                if (mounted) setState(() => _isLoading = false);
                if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3B82F6),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('BOGO Deals', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        backgroundColor: AppColors.surface, surfaceTintColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF3B82F6)))
          : _deals.isEmpty
              ? Center(
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: const Color(0xFF3B82F6).withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(LucideIcons.copyPlus, size: 48, color: Color(0xFF3B82F6))),
                    const SizedBox(height: 24),
                    Text('No BOGO Offers', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                    const SizedBox(height: 8),
                    Text('Create a Buy One Get One deal.', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
                  ]),
                )
              : RefreshIndicator(
                  color: const Color(0xFF3B82F6),
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _deals.length,
                    itemBuilder: (context, index) {
                      final d = _deals[index];
                      final bool isActive = d['isActive'] == true;
                      
                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: isActive ? const Color(0xFF3B82F6).withValues(alpha: 0.5) : AppColors.cardBorder),
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
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        d['name'] ?? 'BOGO Deal',
                                        style: GoogleFonts.playfairDisplay(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.primaryDark),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Buy ${d['buyQuantity']} Get ${d['getQuantity']} (${d['discountPercent']}% Off)',
                                        style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF3B82F6)),
                                      ),
                                    ],
                                  ),
                                ),
                                Switch(
                                  value: isActive,
                                  onChanged: (v) => _toggleActive(d['id'], isActive),
                                  activeThumbColor: const Color(0xFF3B82F6),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Icon(LucideIcons.barChart3, size: 16, color: AppColors.textMuted),
                                const SizedBox(width: 8),
                                Text('Used ${d['currentUsage']} times', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textSecondary)),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Divider(color: AppColors.divider, height: 1),
                            const SizedBox(height: 12),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton.icon(
                                  onPressed: () => _deleteDeal(d['id']),
                                  icon: Icon(LucideIcons.trash2, size: 16, color: AppColors.error),
                                  label: Text('Delete', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.error)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          HapticFeedback.lightImpact();
          _showCreateDialog();
        },
        backgroundColor: const Color(0xFF3B82F6),
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: Text('New BOGO', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.white)),
      ),
    );
  }
}
