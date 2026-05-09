import 'package:flutter/material.dart';
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
  bool _isSavingGlobal = false;
  String? _error;
  List<dynamic> _zones = [];

  bool _enableShipping = true;
  double _freeThreshold = 0;
  double _defaultRate = 50;
  double _expressRate = 100;

  @override
  void initState() {
    super.initState();
    _loadAllData();
  }

  Future<void> _loadAllData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      
      final zonesData = await client.get('/api/admin/auth/delivery-zones');
      
      final settingsData = await client.get('/api/admin/auth/settings');
      final configs = settingsData['configs'] as List?;
      final shippingConfig = configs?.firstWhere((c) => c['key'] == 'shipping_settings', orElse: () => null);
      
      if (shippingConfig != null && shippingConfig['value'] != null) {
        final val = shippingConfig['value'];
        _enableShipping = val['enableShipping'] ?? true;
        _freeThreshold = (val['freeShippingThreshold'] ?? 0).toDouble();
        _defaultRate = (val['defaultShippingRate'] ?? 50).toDouble();
        _expressRate = (val['expressShippingRate'] ?? 100).toDouble();
      }

      if (mounted) {
        setState(() { 
          _zones = zonesData['zones'] ?? []; 
          _isLoading = false; 
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _error = e.toString(); _isLoading = false; });
      }
    }
  }

  Future<void> _saveGlobalSettings() async {
    setState(() => _isSavingGlobal = true);
    final messenger = ScaffoldMessenger.of(context);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      
      // Fetch current settings first to preserve other fields (like existing shippingZones in JSON)
      final settingsData = await client.get('/api/admin/auth/settings');
      final configs = settingsData['configs'] as List?;
      final shippingConfig = configs?.firstWhere((c) => c['key'] == 'shipping_settings', orElse: () => null);
      
      Map<String, dynamic> existingValue = {};
      if (shippingConfig != null && shippingConfig['value'] != null) {
        existingValue = Map<String, dynamic>.from(shippingConfig['value']);
      }

      final newValue = {
        ...existingValue,
        'enableShipping': _enableShipping,
        'freeShippingThreshold': _freeThreshold,
        'defaultShippingRate': _defaultRate,
        'expressShippingRate': _expressRate,
      };

      await client.put('/api/admin/auth/settings', body: {
        'key': 'shipping_settings',
        'value': newValue,
        'description': 'Global shipping configuration'
      });

      if (mounted) messenger.showSnackBar(const SnackBar(content: Text('Global settings saved'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating));
    } catch (e) {
      if (mounted) messenger.showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
    } finally {
      if (mounted) setState(() => _isSavingGlobal = false);
    }
  }

  Future<void> _loadZones() async {
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/delivery-zones');
      if (mounted) setState(() { _zones = data['zones'] ?? []; });
    } catch (e) {
      debugPrint('Load zones error: $e');
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
    final messenger = ScaffoldMessenger.of(context);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.delete('/api/admin/auth/delivery-zones/$id');
      if (!mounted) return;
      messenger.showSnackBar(const SnackBar(content: Text('Zone deleted'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating));
      _loadZones();
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error, behavior: SnackBarBehavior.floating));
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
    final rateCtrl = TextEditingController(text: zone?['baseRate']?.toString() ?? '50');
    final returnRateCtrl = TextEditingController(text: zone?['returnRate']?.toString() ?? '0');
    final daysCtrl = TextEditingController(text: zone?['avgDeliveryDays']?.toString() ?? '3');
    final notesCtrl = TextEditingController(text: zone?['notes'] ?? '');
    
    List<String> selectedGovs = List<String>.from(zone?['governorates'] ?? []);
    List<String> selectedCities = List<String>.from(zone?['cities'] ?? []);
    String riskLevel = zone?['riskLevel'] ?? 'normal';

    final List<String> allGovernorates = [
      'Cairo', 'Giza', 'Alexandria', 'Al Beheira', 'Al Daqahliya', 'Al Fayoum',
      'Al Gharbia', 'Al Meniya', 'Al Monufia', 'Al Sharqia', 'Aswan', 'Asyut',
      'Bani Souaif', 'Damietta', 'Ismailia', 'Kafr El Sheikh', 'Luxor', 'Matrooh',
      'New Valley', 'Port Said', 'Qalyubia', 'Qena', 'Red Sea', 'Sohag', 'Suez',
      'North Sinai', 'South Sinai'
    ];

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
                const SizedBox(height: 20),
                
                Text('Governorates', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8, runSpacing: 8,
                  children: allGovernorates.map((gov) {
                    final isSelected = selectedGovs.contains(gov);
                    return ChoiceChip(
                      label: Text(gov, style: GoogleFonts.inter(fontSize: 12, color: isSelected ? Colors.white : AppColors.textPrimary)),
                      selected: isSelected,
                      selectedColor: AppColors.primaryDark,
                      backgroundColor: AppColors.background,
                      onSelected: (v) => setModalState(() {
                        if (v) {
                          selectedGovs.add(gov);
                        } else {
                          selectedGovs.remove(gov);
                        }
                      }),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: isSelected ? AppColors.primaryDark : AppColors.cardBorder)),
                      showCheckmark: false,
                    );
                  }).toList(),
                ),
                
                const SizedBox(height: 20),
                Text('Specific Cities', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
                const SizedBox(height: 8),
                TextField(
                  onSubmitted: (v) {
                    if (v.trim().isEmpty) return;
                    setModalState(() { selectedCities.add(v.trim()); });
                  },
                  decoration: InputDecoration(
                    hintText: 'Add city and press Enter',
                    prefixIcon: const Icon(LucideIcons.plusCircle, size: 18),
                    filled: true, fillColor: AppColors.background,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8, runSpacing: 8,
                  children: selectedCities.map((city) => Chip(
                    label: Text(city, style: GoogleFonts.inter(fontSize: 12)),
                    onDeleted: () => setModalState(() => selectedCities.remove(city)),
                    backgroundColor: AppColors.background,
                    deleteIcon: const Icon(LucideIcons.x, size: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: const BorderSide(color: AppColors.cardBorder)),
                  )).toList(),
                ),

                const SizedBox(height: 20),
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
                const SizedBox(height: 12),
                _modalField('Notes (Internal)', notesCtrl, LucideIcons.stickyNote),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity, height: 50,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (nameCtrl.text.isEmpty) return;
                      final body = {
                        'name': nameCtrl.text.trim(),
                        'governorates': selectedGovs,
                        'cities': selectedCities,
                        'baseRate': double.tryParse(rateCtrl.text) ?? 50,
                        'returnRate': double.tryParse(returnRateCtrl.text) ?? 0,
                        'avgDeliveryDays': int.tryParse(daysCtrl.text) ?? 3,
                        'riskLevel': riskLevel,
                        'notes': notesCtrl.text.trim(),
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
        title: Text('Shipping & Zones', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
        backgroundColor: AppColors.surface, surfaceTintColor: Colors.transparent, elevation: 0,
        leading: IconButton(icon: const Icon(LucideIcons.arrowLeft, color: AppColors.primaryDark), onPressed: () => Navigator.pop(context)),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : _error != null
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(LucideIcons.alertCircle, size: 48, color: AppColors.error), const SizedBox(height: 16), ElevatedButton(onPressed: _loadAllData, child: const Text('Retry'))]))
              : RefreshIndicator(
                  onRefresh: _loadAllData,
                  color: AppColors.primaryDark,
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                    children: [
                      _buildGlobalSettingsCard(),
                      const SizedBox(height: 32),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Delivery Zones', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                          TextButton.icon(
                            onPressed: _showAddEditDialog,
                            icon: const Icon(LucideIcons.plus, size: 18),
                            label: const Text('Add Zone'),
                            style: TextButton.styleFrom(foregroundColor: const Color(0xFF0EA5E9)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (_zones.isEmpty)
                        Center(child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 40),
                          child: Column(children: [
                            const Icon(LucideIcons.map, size: 48, color: AppColors.textMuted),
                            const SizedBox(height: 12),
                            Text('No custom zones yet.', style: GoogleFonts.inter(color: AppColors.textMuted)),
                          ]),
                        ))
                      else
                        ..._zones.map((zone) => _buildZoneCard(zone)),
                    ],
                  ),
                ),
    );
  }

  Widget _buildGlobalSettingsCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Global Shipping', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
              Switch.adaptive(
                value: _enableShipping,
                activeThumbColor: AppColors.success,
                onChanged: (v) => setState(() => _enableShipping = v),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _globalField('Default Rate', _defaultRate.toString(), (v) => _defaultRate = double.tryParse(v) ?? _defaultRate)),
              const SizedBox(width: 12),
              Expanded(child: _globalField('Express Rate', _expressRate.toString(), (v) => _expressRate = double.tryParse(v) ?? _expressRate)),
            ],
          ),
          const SizedBox(height: 12),
          _globalField('Free Shipping Above (0 = disabled)', _freeThreshold.toString(), (v) => _freeThreshold = double.tryParse(v) ?? _freeThreshold),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _isSavingGlobal ? null : _saveGlobalSettings,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryDark,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: _isSavingGlobal 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Save Global Settings'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _globalField(String label, String value, Function(String) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
        const SizedBox(height: 6),
        TextField(
          controller: TextEditingController(text: value)..selection = TextSelection.collapsed(offset: value.length),
          keyboardType: TextInputType.number,
          style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600),
          onChanged: onChanged,
          decoration: InputDecoration(
            filled: true, fillColor: AppColors.background,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            prefixText: 'EGP ', prefixStyle: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted),
          ),
        ),
      ],
    );
  }

  Widget _buildZoneCard(dynamic zone) {
    final isActive = zone['isActive'] == true;
    final govs = (zone['governorates'] as List?) ?? [];
    final cities = (zone['cities'] as List?) ?? [];
    final risk = zone['riskLevel'] ?? 'normal';
    final notes = zone['notes'] as String?;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
                    if (govs.isNotEmpty) Text(govs.join(', '), style: GoogleFonts.inter(fontSize: 12, color: AppColors.primaryDark, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
                    if (cities.isNotEmpty) Text(cities.join(', '), style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis),
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
          if (notes != null && notes.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(8),
              width: double.infinity,
              decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8)),
              child: Text(notes, style: GoogleFonts.inter(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.textSecondary)),
            ),
          ],
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
