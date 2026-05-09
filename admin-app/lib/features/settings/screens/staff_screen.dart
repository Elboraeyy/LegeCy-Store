import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class StaffScreen extends StatefulWidget {
  const StaffScreen({super.key});

  @override
  State<StaffScreen> createState() => _StaffScreenState();
}

class _StaffScreenState extends State<StaffScreen> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _staff = [];
  List<dynamic> _roles = [];
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadStaff();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadStaff() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/staff?includeInactive=true');
      if (mounted) setState(() { _staff = data['staff'] ?? []; _roles = data['roles'] ?? []; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Staff & Team', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        backgroundColor: AppColors.surface, surfaceTintColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.accent, indicatorWeight: 3,
          labelColor: AppColors.primaryDark, unselectedLabelColor: AppColors.textMuted,
          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14),
          tabs: [Tab(text: 'Members (${_staff.length})'), Tab(text: 'Roles (${_roles.length})')],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : _error != null
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error), const SizedBox(height: 16), ElevatedButton(onPressed: _loadStaff, child: const Text('Retry'))]))
              : TabBarView(controller: _tabController, children: [_buildMembersTab(), _buildRolesTab()]),
    );
  }

  Widget _buildMembersTab() {
    if (_staff.isEmpty) {
      return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: const Color(0xFF0F766E).withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(LucideIcons.users, size: 48, color: Color(0xFF0F766E))),
        const SizedBox(height: 24),
        Text('No Team Members', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
      ]));
    }

    return RefreshIndicator(
      onRefresh: _loadStaff,
      color: AppColors.primaryDark,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        itemCount: _staff.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final member = _staff[index];
          final isActive = member['isActive'] == true;
          final roleName = member['role']?['name'] ?? 'No Role';
          final initial = (member['name'] ?? 'A')[0].toUpperCase();

          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isActive ? AppColors.cardBorder : AppColors.warning.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    color: isActive ? const Color(0xFF0F766E).withValues(alpha: 0.1) : AppColors.background,
                    shape: BoxShape.circle,
                    border: Border.all(color: isActive ? const Color(0xFF0F766E) : AppColors.warning, width: 2),
                  ),
                  child: Center(child: Text(initial, style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700, color: isActive ? const Color(0xFF0F766E) : AppColors.warning))),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Expanded(child: Text(member['name'] ?? '', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary))),
                        if (!isActive) Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: AppColors.warning.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)), child: Text('INACTIVE', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: AppColors.warning))),
                      ]),
                      const SizedBox(height: 4),
                      Text(member['email'] ?? '', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                      const SizedBox(height: 6),
                      Row(children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(color: const Color(0xFF0F766E).withValues(alpha: 0.08), borderRadius: BorderRadius.circular(8)),
                          child: Text(roleName, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF0F766E))),
                        ),
                        if (member['position'] != null) ...[
                          const SizedBox(width: 8),
                          Text(member['position'], style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                        ],
                      ]),
                      if (member['lastLoginAt'] != null) ...[
                        const SizedBox(height: 6),
                        Row(children: [
                          const Icon(LucideIcons.clock, size: 12, color: AppColors.textMuted),
                          const SizedBox(width: 4),
                          Text('Last login: ${_formatDate(member['lastLoginAt'])}', style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted)),
                        ]),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildRolesTab() {
    if (_roles.isEmpty) {
      return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: const Color(0xFF0F766E).withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(LucideIcons.shieldCheck, size: 48, color: Color(0xFF0F766E))),
        const SizedBox(height: 24),
        Text('No Roles Defined', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
      ]));
    }

    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      itemCount: _roles.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final role = _roles[index];
        final memberCount = role['memberCount'] ?? 0;
        final permissions = role['permissions']?.toString().split(',').where((p) => p.isNotEmpty).toList() ?? [];

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.cardBorder)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: const Color(0xFF0F766E).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)), child: const Icon(LucideIcons.shieldCheck, size: 20, color: Color(0xFF0F766E))),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(role['name'] ?? '', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                  if (role['description'] != null) Text(role['description'], style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                ])),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(12)),
                  child: Text('$memberCount members', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                ),
              ]),
              if (permissions.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6, runSpacing: 6,
                  children: permissions.take(6).map((p) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8)),
                    child: Text(p.trim(), style: GoogleFonts.inter(fontSize: 10, color: AppColors.textSecondary)),
                  )).toList(),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'Never';
    try {
      final d = DateTime.parse(dateStr);
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) {
      return dateStr;
    }
  }
}
