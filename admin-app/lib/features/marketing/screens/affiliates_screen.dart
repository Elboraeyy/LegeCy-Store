import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';
import 'add_affiliate_screen.dart';

class AffiliatesScreen extends StatefulWidget {
  const AffiliatesScreen({super.key});

  @override
  State<AffiliatesScreen> createState() => _AffiliatesScreenState();
}

class _AffiliatesScreenState extends State<AffiliatesScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _affiliates = [];
  List<dynamic> _filteredAffiliates = [];
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadAffiliates();
    _searchController.addListener(_filterAffiliates);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAffiliates() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/affiliates');
      
      if (mounted) {
        setState(() {
          _affiliates = data['affiliates'];
          _filteredAffiliates = _affiliates;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  void _filterAffiliates() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filteredAffiliates = _affiliates.where((a) {
        final name = a['name']?.toString().toLowerCase() ?? '';
        final code = a['code']?.toString().toLowerCase() ?? '';
        final email = a['email']?.toString().toLowerCase() ?? '';
        return name.contains(query) || code.contains(query) || email.contains(query);
      }).toList();
    });
  }

  Future<void> _toggleStatus(String id, bool currentStatus) async {
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.put('/api/admin/auth/affiliates/$id', body: {'isActive': !currentStatus});
      _loadAffiliates();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
    }
  }

  Future<void> _deleteAffiliate(String id) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Delete Affiliate', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        content: Text('Are you sure you want to delete this affiliate?', style: GoogleFonts.inter(color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted))),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (ok != true) return;
    if (!mounted) return;

    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.delete('/api/admin/auth/affiliates/$id');
      
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Affiliate deleted/deactivated'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating));
      _loadAffiliates();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              pinned: true,
              backgroundColor: AppColors.surface,
              surfaceTintColor: Colors.transparent,
              expandedHeight: 130,
              shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(bottom: Radius.circular(20))),
              leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
              title: Text('Affiliates', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
              actions: [
                IconButton(
                  icon: const Icon(LucideIcons.plus, color: AppColors.primaryDark),
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const AddAffiliateScreen())).then((v) {
                      if (v == true) _loadAffiliates();
                    });
                  },
                ),
              ],
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(70),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.cardBorder),
                    ),
                    child: TextField(
                      controller: _searchController,
                      style: GoogleFonts.inter(fontSize: 14),
                      decoration: InputDecoration(
                        hintText: 'Search affiliates...',
                        hintStyle: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted),
                        prefixIcon: const Icon(LucideIcons.search, size: 18, color: AppColors.textMuted),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(icon: const Icon(LucideIcons.x, size: 16, color: AppColors.textMuted), onPressed: () => _searchController.clear())
                            : null,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ];
        },
        body: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error),
                        const SizedBox(height: 16),
                        Text(_error!, style: GoogleFonts.inter(color: AppColors.error)),
                        const SizedBox(height: 16),
                        ElevatedButton(onPressed: _loadAffiliates, child: const Text('Retry')),
                      ],
                    ),
                  )
                : _filteredAffiliates.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(color: const Color(0xFF14B8A6).withValues(alpha: 0.1), shape: BoxShape.circle),
                              child: const Icon(LucideIcons.users, size: 48, color: Color(0xFF14B8A6)),
                            ),
                            const SizedBox(height: 24),
                            Text('No Affiliates Found', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                            const SizedBox(height: 8),
                            Text('Partner with influencers to drive sales.', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadAffiliates,
                        color: AppColors.primaryDark,
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                          itemCount: _filteredAffiliates.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final affiliate = _filteredAffiliates[index];
                            final isActive = affiliate['isActive'] == true;
                            final commissionRate = affiliate['commissionRate']?.toString() ?? '0';
                            final commissionPercentage = (double.parse(commissionRate) * 100).toStringAsFixed(0);
                            final walletBalance = affiliate['walletBalance']?.toString() ?? '0';
                            final transactionsCount = affiliate['_count']?['transactions'] ?? 0;
                            
                            return Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: AppColors.cardBorder),
                                boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(color: const Color(0xFF14B8A6).withValues(alpha: 0.1), shape: BoxShape.circle),
                                        child: const Icon(LucideIcons.userCheck, color: Color(0xFF14B8A6)),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(affiliate['name'] ?? '', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                                            const SizedBox(height: 4),
                                            Text(affiliate['code'] ?? '', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF14B8A6))),
                                          ],
                                        ),
                                      ),
                                      PopupMenuButton<String>(
                                        icon: const Icon(LucideIcons.moreVertical, color: AppColors.textMuted),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                        onSelected: (v) {
                                          if (v == 'edit') {
                                            Navigator.push(context, MaterialPageRoute(builder: (_) => AddAffiliateScreen(affiliate: affiliate))).then((val) {
                                              if (val == true) _loadAffiliates();
                                            });
                                          } else if (v == 'toggle') {
                                            _toggleStatus(affiliate['id'], isActive);
                                          } else if (v == 'delete') {
                                            _deleteAffiliate(affiliate['id']);
                                          }
                                        },
                                        itemBuilder: (_) => [
                                          const PopupMenuItem(value: 'edit', child: Row(children: [Icon(LucideIcons.edit, size: 16, color: AppColors.primaryDark), SizedBox(width: 10), Text('Edit')])),
                                          PopupMenuItem(value: 'toggle', child: Row(children: [Icon(isActive ? LucideIcons.ban : LucideIcons.checkCircle2, size: 16, color: isActive ? AppColors.warning : AppColors.success), const SizedBox(width: 10), Text(isActive ? 'Deactivate' : 'Activate')])),
                                          const PopupMenuDivider(),
                                          const PopupMenuItem(value: 'delete', child: Row(children: [Icon(LucideIcons.trash2, size: 16, color: Colors.red), SizedBox(width: 10), Text('Delete', style: TextStyle(color: Colors.red))])),
                                        ],
                                      ),
                                    ],
                                  ),
                                  const Padding(padding: EdgeInsets.symmetric(vertical: 12), child: Divider(height: 1, color: AppColors.cardBorder)),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      _buildStat('Commission', '$commissionPercentage%'),
                                      _buildStat('Wallet Balance', 'EGP $walletBalance'),
                                      _buildStat('Transactions', '$transactionsCount'),
                                    ],
                                  ),
                                  if (!isActive) ...[
                                    const SizedBox(height: 12),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(color: AppColors.warning.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                                      child: Text('INACTIVE', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.warning, letterSpacing: 1)),
                                    ),
                                  ]
                                ],
                              ),
                            );
                          },
                        ),
                      ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          HapticFeedback.lightImpact();
          Navigator.push(context, MaterialPageRoute(builder: (_) => const AddAffiliateScreen())).then((v) {
            if (v == true) _loadAffiliates();
          });
        },
        backgroundColor: const Color(0xFF14B8A6),
        icon: const Icon(LucideIcons.userPlus, color: Colors.white),
        label: Text('New Affiliate', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.white)),
      ),
    );
  }

  Widget _buildStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
      ],
    );
  }
}
