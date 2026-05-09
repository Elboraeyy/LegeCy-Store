import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class ActivityLogScreen extends StatefulWidget {
  const ActivityLogScreen({super.key});

  @override
  State<ActivityLogScreen> createState() => _ActivityLogScreenState();
}

class _ActivityLogScreenState extends State<ActivityLogScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _logs = [];
  int _total = 0;

  @override
  void initState() {
    super.initState();
    _loadLogs();
  }

  Future<void> _loadLogs() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/activity-log?limit=100');
      if (mounted) setState(() { _logs = data['logs'] ?? []; _total = data['total'] ?? 0; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  IconData _actionIcon(String action) {
    final a = action.toLowerCase();
    if (a.contains('create') || a.contains('add')) return LucideIcons.plus;
    if (a.contains('update') || a.contains('edit')) return LucideIcons.edit;
    if (a.contains('delete') || a.contains('remove')) return LucideIcons.trash2;
    if (a.contains('login')) return LucideIcons.logIn;
    if (a.contains('logout')) return LucideIcons.logOut;
    if (a.contains('approve')) return LucideIcons.checkCircle2;
    if (a.contains('reject')) return LucideIcons.xCircle;
    if (a.contains('status')) return LucideIcons.refreshCw;
    return LucideIcons.activity;
  }

  Color _actionColor(String action) {
    final a = action.toLowerCase();
    if (a.contains('create') || a.contains('add')) return const Color(0xFF10B981);
    if (a.contains('delete') || a.contains('remove')) return AppColors.error;
    if (a.contains('login')) return const Color(0xFF3B82F6);
    if (a.contains('reject')) return AppColors.error;
    return const Color(0xFF64748B);
  }

  String _formatTime(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final d = DateTime.parse(dateStr);
      final now = DateTime.now();
      final diff = now.difference(d);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) {
      return dateStr;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Activity Log', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        backgroundColor: AppColors.surface, surfaceTintColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(child: Text('$_total total', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600))),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : _error != null
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error), const SizedBox(height: 16), ElevatedButton(onPressed: _loadLogs, child: const Text('Retry'))]))
              : _logs.isEmpty
                  ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: const Color(0xFF64748B).withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(LucideIcons.clipboardList, size: 48, color: Color(0xFF64748B))),
                      const SizedBox(height: 24),
                      Text('No Activity Yet', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                      const SizedBox(height: 8),
                      Text('Actions will appear here as they happen.', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
                    ]))
                  : RefreshIndicator(
                      onRefresh: _loadLogs,
                      color: AppColors.primaryDark,
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                        itemCount: _logs.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 1),
                        itemBuilder: (context, index) {
                          final log = _logs[index];
                          final action = log['action'] ?? '';
                          final color = _actionColor(action);

                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(index == 0 ? 16 : index == _logs.length - 1 ? 16 : 0),
                              border: index == 0 || index == _logs.length - 1 ? Border.all(color: AppColors.cardBorder) : null,
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  width: 36, height: 36,
                                  decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
                                  child: Icon(_actionIcon(action), size: 16, color: color),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      RichText(
                                        text: TextSpan(
                                          style: GoogleFonts.inter(fontSize: 13, color: AppColors.textPrimary),
                                          children: [
                                            TextSpan(text: log['adminName'] ?? 'System', style: const TextStyle(fontWeight: FontWeight.w700)),
                                            TextSpan(text: ' $action'),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Row(children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(6)),
                                          child: Text(log['entityType'] ?? '', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(_formatTime(log['createdAt']), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                                      ]),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
