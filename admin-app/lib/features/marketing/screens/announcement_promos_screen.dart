import 'package:admin_app/core/widgets/app_toast.dart';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class AnnouncementPromosScreen extends StatefulWidget {
  const AnnouncementPromosScreen({super.key});
  @override
  State<AnnouncementPromosScreen> createState() => _AnnouncementPromosScreenState();
}

class _AnnouncementPromosScreenState extends State<AnnouncementPromosScreen> {
  bool _isLoading = true;
  bool _enabled = false;
  final TextEditingController _textController = TextEditingController();
  final TextEditingController _bgColorController = TextEditingController(text: '#12403C');
  final TextEditingController _textColorController = TextEditingController(text: '#f6e5c6');

  @override
  void initState() { super.initState(); _loadSettings(); }

  Future<void> _loadSettings() async {
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/config/settings?keys=header_settings');
      if (mounted) {
        if (data['header_settings'] != null) {
          final Map<String, dynamic> config = jsonDecode(data['header_settings']);
          setState(() {
            _enabled = config['announcementEnabled'] ?? false;
            _textController.text = config['announcementText'] ?? '';
            _bgColorController.text = config['announcementBgColor'] ?? '#12403C';
            _textColorController.text = config['announcementTextColor'] ?? '#f6e5c6';
          });
        }
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveSettings() async {
    HapticFeedback.mediumImpact();
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      
      final config = {
        'announcementEnabled': _enabled,
        'announcementText': _textController.text,
        'announcementBgColor': _bgColorController.text,
        'announcementTextColor': _textColorController.text,
      };

      await client.put('/api/admin/config/settings', body: {
        'settings': [
          {'key': 'header_settings', 'value': jsonEncode(config)},
        ]
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showAppToast(AppToast.snackBar(content: Text('Announcement settings saved'), backgroundColor: AppColors.success));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showAppToast(AppToast.snackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Color _parseColor(String hex) {
    hex = hex.replaceAll('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    if (hex.length != 8) return AppColors.primaryDark;
    return Color(int.parse(hex, radix: 16));
  }

  @override
  Widget build(BuildContext context) {
    const color = Color(0xFFEC4899);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(LucideIcons.megaphone, color: color),
            const SizedBox(width: 8),
            Text('Announcement Bar', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
          ],
        ),
        backgroundColor: AppColors.surface, surfaceTintColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: color))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.cardBorder),
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
                                Text('Enable Announcement', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                                const SizedBox(height: 4),
                                Text('Show a banner at the top of your website', style: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted)),
                              ],
                            ),
                          ),
                          Switch(
                            value: _enabled,
                            onChanged: (v) => setState(() => _enabled = v),
                            activeTrackColor: color,
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Divider(color: AppColors.divider, height: 1),
                      const SizedBox(height: 24),
                      Text('Announcement Text', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _textController,
                        onChanged: (_) => setState(() {}),
                        decoration: InputDecoration(
                          hintText: 'e.g. Free shipping on orders over 2000 EGP!',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.cardBorder)),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: color, width: 2)),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Background Color', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: _bgColorController,
                                  onChanged: (_) => setState(() {}),
                                  decoration: InputDecoration(
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.cardBorder)),
                                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: color, width: 2)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Text Color', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                                const SizedBox(height: 8),
                                TextField(
                                  controller: _textColorController,
                                  onChanged: (_) => setState(() {}),
                                  decoration: InputDecoration(
                                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.cardBorder)),
                                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: color, width: 2)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Text('Live Preview', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                        decoration: BoxDecoration(
                          color: _parseColor(_bgColorController.text),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _textController.text.isEmpty ? 'Your announcement text here...' : _textController.text,
                          textAlign: TextAlign.center,
                          style: GoogleFonts.inter(
                            color: _parseColor(_textColorController.text),
                            fontWeight: FontWeight.w600,
                            fontSize: 12,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _saveSettings,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: color,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: Text('Save Settings', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

