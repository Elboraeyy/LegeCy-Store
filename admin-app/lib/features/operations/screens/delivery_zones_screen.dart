import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';

class DeliveryZonesScreen extends StatefulWidget {
  const DeliveryZonesScreen({super.key});

  @override
  State<DeliveryZonesScreen> createState() => _DeliveryZonesScreenState();
}

class _DeliveryZonesScreenState extends State<DeliveryZonesScreen> {
  bool _isLoading = true;
  String? _error;
  List<dynamic> _zones = [];

  @override
  void initState() {
    super.initState();
    _loadZones();
  }

  Future<void> _loadZones() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/delivery-zones');
      if (mounted) setState(() { _zones = data['zones'] ?? []; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _deleteZone(String id) async {
    final ok = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      backgroundColor: Colors.white, surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: Text('Delete Zone', style: GoogleFonts.playfairDisplay(fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
      content: Text('This zone will be permanently removed.', style: GoogleFonts.inter(color: AppColors.textSecondary)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Cancel', style: GoogleFonts.inter(color: AppColors.textMuted))),
        ElevatedButton(onPressed: () => Navigator.pop(context, true), style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), elevation: 0), child: const Text('Delete')),
      ],
    ));
    if (ok != true) return;
    if (!mounted) return;
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.delete('/api/admin/auth/delivery-zones/$id');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Zone deleted'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating));
      _loadZones();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating));
    }
  }

  Future<void> _toggleZone(String id, bool current) async {
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.put('/api/admin/auth/delivery-zones/$id', body: {'isActive': !current});
      _loadZones();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
    }
  }

  void _showAddEditDialog({Map<String, dynamic>? zone}) {
    final nameCtrl = TextEditingController(text: zone?['name'] ?? '');
    final citiesCtrl = TextEditingController(text: (zone?['cities'] as List?)?.join(', ') ?? '');
    final rateCtrl = TextEditingController(text: zone?['baseRate']?.toString() ?? '50');
    final returnRateCtrl = TextEditingController(text: zone?['returnRate']?.toString() ?? '0');
    final daysCtrl = TextEditingController(text: zone?['avgDeliveryDays']?.toString() ?? '3');
    String riskLevel = zone?['riskLevel'] ?? 'normal';

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
                const SizedBox(height: 16),
                Text(zone != null ? 'Edit Zone' : 'New Delivery Zone', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                const SizedBox(height: 20),
                _modalField('Zone Name', nameCtrl, LucideIcons.mapPin),
                const SizedBox(height: 12),
                _modalField('Cities (comma separated)', citiesCtrl, LucideIcons.map),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(child: _modalField('Shipping Fee', rateCtrl, LucideIcons.coins, isNumber: true)),
                  const SizedBox(width: 12),
                  Expanded(child: _modalField('Return Fee', returnRateCtrl, LucideIcons.undo, isNumber: true)),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(child: _modalField('Delivery Days', daysCtrl, LucideIcons.clock, isNumber: true)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Risk Level', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          initialValue: riskLevel,
                          items: ['normal', 'medium', 'high'].map((r) => DropdownMenuItem(value: r, child: Text(r.toUpperCase()))).toList(),
                          onChanged: (v) => setModalState(() => riskLevel = v!),
                          style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary),
                          decoration: InputDecoration(filled: true, fillColor: AppColors.background, border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none), contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12)),
                        ),
                      ],
                    ),
                  ),
                ]),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity, height: 50,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (nameCtrl.text.isEmpty) return;
                      final cities = citiesCtrl.text.split(',').map((c) => c.trim()).where((c) => c.isNotEmpty).toList();
                      final body = {
                        'name': nameCtrl.text.trim(),
                        'cities': cities,
                        'baseRate': double.tryParse(rateCtrl.text) ?? 50,
                        'returnRate': double.tryParse(returnRateCtrl.text) ?? 0,
                        'avgDeliveryDays': int.tryParse(daysCtrl.text) ?? 3,
                        'riskLevel': riskLevel,
                      };
                      final messenger = ScaffoldMessenger.of(context);
                      try {
                        final token = context.read<AuthProvider>().token;
                        final client = ApiClient(token: token);
                        if (zone != null) {
                          await client.put('/api/admin/auth/delivery-zones/${zone['id']}', body: body);
                        } else {
                          await client.post('/api/admin/auth/delivery-zones', body: body);
                        }
                        if (!context.mounted) return;
                        Navigator.pop(ctx);
                        _loadZones();
                      } catch (e) {
                        if (!context.mounted) return;
                        messenger.showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
                      }
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryDark, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), elevation: 0),
                    child: Text(zone != null ? 'Save Changes' : 'Create Zone', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _modalField(String label, TextEditingController ctrl, IconData icon, {bool isNumber = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
        const SizedBox(height: 8),
        TextField(
          controller: ctrl,
          keyboardType: isNumber ? TextInputType.number : TextInputType.text,
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

  Color _riskColor(String risk) {
    switch (risk) {
      case 'high': return AppColors.error;
      case 'medium': return AppColors.warning;
      default: return AppColors.success;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Delivery Zones', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        backgroundColor: AppColors.surface, surfaceTintColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : _error != null
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error), const SizedBox(height: 16), ElevatedButton(onPressed: _loadZones, child: const Text('Retry'))]))
              : _zones.isEmpty
                  ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Container(padding: const EdgeInsets.all(24), decoration: BoxDecoration(color: const Color(0xFF0EA5E9).withValues(alpha: 0.1), shape: BoxShape.circle), child: const Icon(LucideIcons.map, size: 48, color: Color(0xFF0EA5E9))),
                      const SizedBox(height: 24),
                      Text('No Delivery Zones', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                      const SizedBox(height: 8),
                      Text('Add your first shipping zone.', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted)),
                    ]))
                  : RefreshIndicator(
                      onRefresh: _loadZones,
                      color: AppColors.primaryDark,
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                        itemCount: _zones.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final zone = _zones[index];
                          final isActive = zone['isActive'] == true;
                          final cities = (zone['cities'] as List?)?.join(', ') ?? '';
                          final risk = zone['riskLevel'] ?? 'normal';

                          return Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: isActive ? AppColors.cardBorder : AppColors.warning.withValues(alpha: 0.3)),
                              boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2))],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(color: const Color(0xFF0EA5E9).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                                      child: const Icon(LucideIcons.mapPin, color: Color(0xFF0EA5E9), size: 20),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(children: [
                                            Text(zone['name'] ?? '', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                                            const SizedBox(width: 8),
                                            if (!isActive) Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: AppColors.warning.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)), child: Text('INACTIVE', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w800, color: AppColors.warning))),
                                          ]),
                                          if (cities.isNotEmpty) ...[
                                            const SizedBox(height: 2),
                                            Text(cities, style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis),
                                          ],
                                        ],
                                      ),
                                    ),
                                    PopupMenuButton<String>(
                                      icon: const Icon(LucideIcons.moreVertical, color: AppColors.textMuted),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                      onSelected: (v) {
                                        if (v == 'edit') {
                                          _showAddEditDialog(zone: zone);
                                        } else if (v == 'toggle') {
                                          _toggleZone(zone['id'], isActive);
                                        } else if (v == 'delete') {
                                          _deleteZone(zone['id']);
                                        }
                                      },
                                      itemBuilder: (_) => [
                                        const PopupMenuItem(value: 'edit', child: Row(children: [Icon(LucideIcons.edit, size: 16), SizedBox(width: 10), Text('Edit')])),
                                        PopupMenuItem(value: 'toggle', child: Row(children: [Icon(isActive ? LucideIcons.ban : LucideIcons.checkCircle2, size: 16), const SizedBox(width: 10), Text(isActive ? 'Deactivate' : 'Activate')])),
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
                                    _buildZoneStat('Shipping', 'EGP ${zone['baseRate']}', LucideIcons.coins),
                                    _buildZoneStat('Return', 'EGP ${zone['returnRate']}', LucideIcons.undo),
                                    _buildZoneStat('Days', '${zone['avgDeliveryDays']}d', LucideIcons.clock),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(color: _riskColor(risk).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                                      child: Text(risk.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: _riskColor(risk))),
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
        onPressed: () { HapticFeedback.lightImpact(); _showAddEditDialog(); },
        backgroundColor: const Color(0xFF0EA5E9),
        icon: const Icon(LucideIcons.plus, color: Colors.white),
        label: Text('New Zone', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.white)),
      ),
    );
  }

  Widget _buildZoneStat(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.textMuted),
        const SizedBox(width: 4),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted)),
          ],
        ),
      ],
    );
  }
}
