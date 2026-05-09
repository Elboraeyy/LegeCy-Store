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
    _tabController.addListener(() {
      if (mounted) setState(() {});
    });
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
      floatingActionButton: _tabController.index == 0 ? FloatingActionButton(
        onPressed: () => _showStaffDialog(),
        backgroundColor: AppColors.primaryDark,
        child: const Icon(LucideIcons.plus, color: Colors.white),
      ) : null,
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
        separatorBuilder: (_, _) => const SizedBox(height: 10),
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
              boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2))],
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
                    ],
                  ),
                ),
                PopupMenuButton<String>(
                  icon: const Icon(LucideIcons.moreVertical, color: AppColors.textMuted, size: 20),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  onSelected: (v) {
                    if (v == 'edit') _showStaffDialog(member);
                    if (v == 'toggle') _toggleMemberStatus(member);
                    if (v == 'delete') _deleteMember(member);
                  },
                  itemBuilder: (_) => [
                    PopupMenuItem(value: 'edit', child: Row(children: [const Icon(LucideIcons.edit2, size: 16), const SizedBox(width: 10), Text('Edit Details', style: GoogleFonts.inter(fontSize: 13))])),
                    PopupMenuItem(value: 'toggle', child: Row(children: [Icon(isActive ? LucideIcons.userX : LucideIcons.userCheck, size: 16), const SizedBox(width: 10), Text(isActive ? 'Deactivate' : 'Activate', style: GoogleFonts.inter(fontSize: 13))])),
                    const PopupMenuDivider(),
                    PopupMenuItem(value: 'delete', child: Row(children: [const Icon(LucideIcons.trash2, size: 16, color: Colors.red), const SizedBox(width: 10), Text('Delete Staff', style: GoogleFonts.inter(fontSize: 13, color: Colors.red))])),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showStaffDialog([Map<String, dynamic>? member]) {
    final isEditing = member != null;
    final nameCtrl = TextEditingController(text: member?['name']);
    final emailCtrl = TextEditingController(text: member?['email']);
    final userCtrl = TextEditingController(text: member?['username']);
    final passCtrl = TextEditingController();
    final posCtrl = TextEditingController(text: member?['position']);
    final phoneCtrl = TextEditingController(text: member?['phone']);
    String? selectedRoleId = member?['role']?['id'] ?? (_roles.isNotEmpty ? _roles[0]['id'] : null);
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(builder: (ctx, setModalState) {
        return Container(
          padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
          decoration: const BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.textMuted.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(2)))),
                const SizedBox(height: 20),
                Text(isEditing ? 'Edit Staff Member' : 'New Staff Member', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                const SizedBox(height: 20),
                _buildInput('Full Name', nameCtrl, LucideIcons.user),
                const SizedBox(height: 16),
                _buildInput('Email Address', emailCtrl, LucideIcons.mail, keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _buildInput('Username', userCtrl, LucideIcons.atSign)),
                    const SizedBox(width: 16),
                    Expanded(child: _buildInput(isEditing ? 'New Password (Optional)' : 'Password', passCtrl, LucideIcons.key, obscureText: true)),
                  ],
                ),
                const SizedBox(height: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('System Role', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(12)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: selectedRoleId,
                          isExpanded: true,
                          items: _roles.map<DropdownMenuItem<String>>((r) => DropdownMenuItem(value: r['id'].toString(), child: Text(r['name']))).toList(),
                          onChanged: (v) => setModalState(() => selectedRoleId = v),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _buildInput('Position/Title', posCtrl, LucideIcons.briefcase)),
                    const SizedBox(width: 16),
                    Expanded(child: _buildInput('Phone Number', phoneCtrl, LucideIcons.phone, keyboardType: TextInputType.phone)),
                  ],
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity, height: 52,
                  child: ElevatedButton(
                    onPressed: isSaving ? null : () async {
                      if (nameCtrl.text.isEmpty || emailCtrl.text.isEmpty) return;
                      setModalState(() => isSaving = true);
                      try {
                        final token = context.read<AuthProvider>().token;
                        final client = ApiClient(token: token);
                        final body = {
                          'name': nameCtrl.text.trim(),
                          'email': emailCtrl.text.trim(),
                          'username': userCtrl.text.trim(),
                          'roleId': selectedRoleId,
                          'position': posCtrl.text.trim(),
                          'phone': phoneCtrl.text.trim(),
                        };
                        if (passCtrl.text.isNotEmpty) body['password'] = passCtrl.text;
                        
                        if (isEditing) {
                          await client.put('/api/admin/auth/staff/${member['id']}', body: body);
                        } else {
                          await client.post('/api/admin/auth/staff', body: body);
                        }
                        
                        if (!mounted) return;
                        if (ctx.mounted) Navigator.pop(ctx);
                        _loadStaff();
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(isEditing ? 'Updated successfully' : 'Created successfully'), backgroundColor: AppColors.success));
                      } catch (e) {
                        setModalState(() => isSaving = false);
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
                      }
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryDark, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), elevation: 0),
                    child: isSaving ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : Text(isEditing ? 'Save Changes' : 'Create Member', style: const TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _buildInput(String label, TextEditingController ctrl, IconData icon, {TextInputType? keyboardType, bool obscureText = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
        const SizedBox(height: 8),
        TextField(
          controller: ctrl,
          keyboardType: keyboardType,
          obscureText: obscureText,
          style: GoogleFonts.inter(fontSize: 14),
          decoration: InputDecoration(
            prefixIcon: Icon(icon, size: 18, color: AppColors.textMuted),
            filled: true, fillColor: AppColors.background,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }

  Future<void> _toggleMemberStatus(Map<String, dynamic> member) async {
    final bool current = member['isActive'] == true;
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.put('/api/admin/auth/staff/${member['id']}', body: {'isActive': !current});
      _loadStaff();
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
    }
  }

  Future<void> _deleteMember(Map<String, dynamic> member) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Member?'),
        content: Text('Are you sure you want to delete ${member['name']}? This action is permanent.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), style: ElevatedButton.styleFrom(backgroundColor: AppColors.error), child: const Text('Delete')),
        ],
      ),
    );
    if (ok != true) return;
    if (!mounted) return;
    
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.delete('/api/admin/auth/staff/${member['id']}');
      _loadStaff();
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
    }
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
      separatorBuilder: (_, _) => const SizedBox(height: 10),
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
}
