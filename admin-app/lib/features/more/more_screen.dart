import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

// ── More Screen ──
class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('More', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primaryDark, AppColors.primaryDark.withValues(alpha: 0.85)],
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                Container(
                  width: 56, height: 56,
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.accent.withValues(alpha: 0.4), width: 2),
                  ),
                  child: Center(
                    child: Text(
                      (auth.adminName ?? 'A')[0].toUpperCase(),
                      style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.accent),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        auth.adminName ?? 'Admin',
                        style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Administrator',
                        style: GoogleFonts.inter(fontSize: 12, color: Colors.white.withValues(alpha: 0.6)),
                      ),
                    ],
                  ),
                ),
                Icon(LucideIcons.chevronRight, color: Colors.white.withValues(alpha: 0.4), size: 20),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Section: Communication
          _sectionTitle('COMMUNICATION'),
          const SizedBox(height: 8),
          _menuItem(context, LucideIcons.star, 'Reviews', 'Manage product reviews', const Color(0xFFF59E0B),
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ReviewsListScreen()))),
          _menuItem(context, LucideIcons.mail, 'Messages', 'Contact form messages', const Color(0xFF6366F1),
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MessagesListScreen()))),
          _menuItem(context, LucideIcons.bell, 'Restock Requests', 'Out-of-stock notifications', const Color(0xFFEC4899),
              () {}),
          const SizedBox(height: 20),

          // Section: Management
          _sectionTitle('MANAGEMENT'),
          const SizedBox(height: 8),
          _menuItem(context, LucideIcons.users, 'Customers', 'View customer data', const Color(0xFF14B8A6),
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CustomersListScreen()))),
          _menuItem(context, LucideIcons.clipboardList, 'Activity Log', 'Recent admin actions', const Color(0xFF64748B),
              () {}),
          const SizedBox(height: 20),

          // Section: Settings
          _sectionTitle('SETTINGS'),
          const SizedBox(height: 8),
          _menuItem(context, LucideIcons.bellRing, 'Notification Settings', 'Configure push alerts', const Color(0xFF0EA5E9),
              () {}),
          _menuItem(context, LucideIcons.globe, 'Open Web Dashboard', 'legecy.store/admin', const Color(0xFF8B5CF6),
              () {}),
          const SizedBox(height: 20),

          // Logout
          GestureDetector(
            onTap: () => _confirmLogout(context),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.error.withValues(alpha: 0.15)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.logOut, size: 18, color: AppColors.error),
                  const SizedBox(width: 10),
                  Text('Sign Out', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.error)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Version
          Center(
            child: Text('Legacy Admin v1.0', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted.withValues(alpha: 0.5))),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(title, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted, letterSpacing: 1.5)),
    );
  }

  Widget _menuItem(BuildContext context, IconData icon, String title, String subtitle, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: color),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                  Text(subtitle, style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                ],
              ),
            ),
            Icon(LucideIcons.chevronRight, size: 16, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Sign Out', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        content: Text('Are you sure you want to sign out?', style: GoogleFonts.inter(color: AppColors.textSecondary)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted))),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.read<AuthProvider>().logout();
            },
            child: Text('Sign Out', style: GoogleFonts.inter(color: AppColors.error, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

// ── Reviews List ──
class ReviewsListScreen extends StatefulWidget {
  const ReviewsListScreen({super.key});
  @override
  State<ReviewsListScreen> createState() => _ReviewsListScreenState();
}

class _ReviewsListScreenState extends State<ReviewsListScreen> {
  List<dynamic> _reviews = [];
  bool _isLoading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/reviews');
      if (mounted) setState(() { _reviews = data['reviews'] as List<dynamic>; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Reviews', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : _reviews.isEmpty
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(LucideIcons.star, size: 48, color: AppColors.textMuted.withValues(alpha: 0.3)),
                  const SizedBox(height: 12),
                  Text('No reviews yet', style: GoogleFonts.inter(color: AppColors.textMuted)),
                ]))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _reviews.length,
                    itemBuilder: (context, index) {
                      final r = _reviews[index];
                      final rating = (r['rating'] as num?) ?? 0;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.cardBorder),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(child: Text(r['productName'] ?? '-', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis)),
                                Row(children: List.generate(5, (i) => Icon(LucideIcons.star, size: 14, color: i < rating ? AppColors.accent : AppColors.textMuted.withValues(alpha: 0.3)))),
                              ],
                            ),
                            const SizedBox(height: 8),
                            if ((r['comment'] ?? '').toString().isNotEmpty)
                              Text(r['comment'], style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.4)),
                            const SizedBox(height: 8),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(r['reviewerName'] ?? 'Anonymous', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                                Text(_formatDate(r['createdAt']), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                              ],
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  String _formatDate(String? d) {
    if (d == null) return '';
    final dt = DateTime.tryParse(d);
    if (dt == null) return d;
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}

// ── Messages List ──
class MessagesListScreen extends StatefulWidget {
  const MessagesListScreen({super.key});
  @override
  State<MessagesListScreen> createState() => _MessagesListScreenState();
}

class _MessagesListScreenState extends State<MessagesListScreen> {
  List<dynamic> _messages = [];
  bool _isLoading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/messages');
      if (mounted) setState(() { _messages = data['messages'] as List<dynamic>; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Messages', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : _messages.isEmpty
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(LucideIcons.mailOpen, size: 48, color: AppColors.textMuted.withValues(alpha: 0.3)),
                  const SizedBox(height: 12),
                  Text('No messages', style: GoogleFonts.inter(color: AppColors.textMuted)),
                ]))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final m = _messages[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.cardBorder),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(LucideIcons.user, size: 14, color: AppColors.textMuted),
                                const SizedBox(width: 6),
                                Expanded(child: Text(m['name'] ?? '-', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600))),
                              ],
                            ),
                            if ((m['email'] ?? '').toString().isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(m['email'], style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                            ],
                            const SizedBox(height: 8),
                            Text(m['message'] ?? '', style: GoogleFonts.inter(fontSize: 13, color: AppColors.textSecondary, height: 1.4)),
                            const SizedBox(height: 8),
                            Text(_formatDate(m['createdAt']), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  String _formatDate(String? d) {
    if (d == null) return '';
    final dt = DateTime.tryParse(d);
    if (dt == null) return d;
    return '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}

// ── Customers List ──
class CustomersListScreen extends StatefulWidget {
  const CustomersListScreen({super.key});
  @override
  State<CustomersListScreen> createState() => _CustomersListScreenState();
}

class _CustomersListScreenState extends State<CustomersListScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Customers', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.users, size: 48, color: AppColors.textMuted.withValues(alpha: 0.3)),
            const SizedBox(height: 12),
            Text('Customer management', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Text('View full customer data on the web dashboard', style: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted)),
          ],
        ),
      ),
    );
  }
}
