import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';
import 'package:admin_app/features/orders/create_manual_order_screen.dart';
import 'package:admin_app/core/constants/order_constants.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'dart:io' show Platform;
import 'package:android_intent_plus/android_intent.dart';

class OrderDetailsScreen extends StatefulWidget {
  final String orderId;
  const OrderDetailsScreen({super.key, required this.orderId});

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> {
  Map<String, dynamic>? _order;
  bool _isLoading = true;
  bool _isUpdating = false;
  final _noteController = TextEditingController();
  bool _isAddingNote = false;

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }


  @override
  void initState() {
    super.initState();
    _loadOrder();
  }

  Future<void> _loadOrder() async {
    setState(() => _isLoading = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/orders/${widget.orderId}');
      if (mounted) setState(() { _order = data; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    HapticFeedback.mediumImpact();
    setState(() => _isUpdating = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      await client.patch('/api/admin/auth/orders/${widget.orderId}', body: {'status': newStatus});
      await _loadOrder();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Status updated to $newStatus'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isUpdating = false);
    }
  }

  Color _statusColorFor(String status) {
    switch (status.toLowerCase()) {
      case 'payment_pending': return const Color(0xFF7C3AED);
      case 'pending': return const Color(0xFFB76E00);
      case 'paid': return const Color(0xFF166534);
      case 'confirmed': return const Color(0xFF166534);
      case 'preparing': return const Color(0xFF0D9488);
      case 'shipped': return const Color(0xFF1E40AF);
      case 'delivered': return const Color(0xFF166534);
      case 'cancelled': return const Color(0xFF991B1B);
      case 'refunded': return const Color(0xFFCA8A04);
      case 'payment_failed': return const Color(0xFF991B1B);
      case 'cash_received': return const Color(0xFF166534);
      default: return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          _order != null ? '#${_order!['orderNumber']}' : 'Order Details',
          style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700),
        ),
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: true,
        actions: [
          if (_order != null) ...[
            IconButton(
              icon: const Icon(LucideIcons.edit, color: AppColors.primaryDark, size: 20),
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => CreateManualOrderScreen(existingOrder: _order),
                  ),
                );
                if (result == true) {
                  _loadOrder();
                }
              },
            ),
          ],
          const SizedBox(width: 8),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryDark))
          : _order == null
              ? Center(child: Text('Order not found', style: GoogleFonts.inter(color: AppColors.textMuted)))
              : RefreshIndicator(
                  color: AppColors.primaryDark,
                  onRefresh: _loadOrder,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildStatusCard(),
                        const SizedBox(height: 20),
                        _buildCustomerCard(),
                        const SizedBox(height: 20),
                        _buildOrderInfoCard(),
                        const SizedBox(height: 20),
                        _buildItemsCard(),
                        const SizedBox(height: 24),
                        _buildQuickActions(),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ),
      bottomNavigationBar: _isLoading || _order == null ? null : Container(
        color: AppColors.background,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: _buildFinancialCard(),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusCard() {
    final status = (_order!['status'] ?? '').toString();
    final color = _statusColorFor(status);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.cardBorder),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(LucideIcons.package, color: color, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Order Status', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w500, letterSpacing: 0.5)),
                const SizedBox(height: 4),
                Text(status.toUpperCase(), style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w800, color: color, letterSpacing: 0.5)),
              ],
            ),
          ),
          if (!OrderConstants.terminalStates.contains(status.toLowerCase()))
            IconButton.filled(
              onPressed: _isUpdating ? null : () => _showStatusPicker(),
              icon: _isUpdating
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(LucideIcons.chevronDown, size: 20),
              style: IconButton.styleFrom(backgroundColor: color),
            ),
        ],
      ),
    );
  }

  void _showStatusPicker() {
    final status = (_order!['status'] ?? '').toString().toLowerCase();
    final allowed = OrderConstants.allowedTransitions[status] ?? [];
    
    if (allowed.isEmpty) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: AppColors.divider, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 24),
            Text('Update Status', style: GoogleFonts.playfairDisplay(fontSize: 24, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
            const SizedBox(height: 24),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: allowed.length,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final s = allowed[index];
                final color = _statusColorFor(s);
                return InkWell(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      Navigator.pop(context);
                      _updateStatus(s);
                    },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: color.withValues(alpha: 0.1)),
                    ),
                    child: Row(
                      children: [
                        Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                        const SizedBox(width: 16),
                        Text(s.toUpperCase(), style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: color)),
                        const Spacer(),
                        Icon(LucideIcons.chevronRight, size: 18, color: color),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.user, size: 18, color: AppColors.primaryDark),
              const SizedBox(width: 8),
              Text('Customer Info', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
            ],
          ),
          const SizedBox(height: 20),
          _infoRow(LucideIcons.user, 'Name', 
            (_order!['displayName']?.toString().isNotEmpty == true) ? _order!['displayName'] : 
            (_order!['customer']?['name']?.toString().isNotEmpty == true) ? _order!['customer']['name'] : 'Guest'),
          _infoRow(LucideIcons.phone, 'Phone', 
            (_order!['phone']?.toString().isNotEmpty == true) ? _order!['phone'] : 
            (_order!['shippingPhone']?.toString().isNotEmpty == true) ? _order!['shippingPhone'] :
            (_order!['customerPhone']?.toString().isNotEmpty == true) ? _order!['customerPhone'] :
            (_order!['phoneNumber']?.toString().isNotEmpty == true) ? _order!['phoneNumber'] :
            (_order!['customer']?['phone']?.toString().isNotEmpty == true) ? _order!['customer']['phone'] : '-'),
          if ((_order!['alternativePhone'] ?? _order!['customer']?['alternativePhone']) != null && (_order!['alternativePhone'] ?? _order!['customer']?['alternativePhone']).toString().trim().isNotEmpty)
            _infoRow(LucideIcons.phoneCall, 'Alt. Phone', _order!['alternativePhone'] ?? _order!['customer']['alternativePhone']),
          if ((_order!['email'] ?? _order!['customer']?['email']) != null && (_order!['email'] ?? _order!['customer']?['email']).toString().trim().isNotEmpty)
            _infoRow(LucideIcons.mail, 'Email', _order!['email'] ?? _order!['customer']['email']),
          _infoRow(LucideIcons.mapPin, 'Address', [
            _order!['shippingAddress'],
            _order!['shippingCity'],
            _order!['shippingGovernorate']
          ].where((e) => e != null && e.toString().trim().isNotEmpty).join(', ').isEmpty ? '-' : 
          [
            _order!['shippingAddress'],
            _order!['shippingCity'],
            _order!['shippingGovernorate']
          ].where((e) => e != null && e.toString().trim().isNotEmpty).join(', ')),
        ],
      ),
    );
  }

  Widget _buildOrderInfoCard() {
    final source = (_order!['source'] ?? 'website').toString().toUpperCase();
    final payment = (_order!['paymentMethod'] ?? 'cod').toString().toUpperCase();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.info, size: 18, color: AppColors.primaryDark),
              const SizedBox(width: 8),
              Text('Additional Info', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
            ],
          ),
          const SizedBox(height: 20),
          _infoRow(LucideIcons.globe, 'Order Source', source),
          _infoRow(LucideIcons.creditCard, 'Payment Method', payment),
        ],
      ),
    );
  }

  Widget _buildItemsCard() {
    final items = (_order!['items'] as List? ?? []);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(255, 255, 255, 1),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(LucideIcons.shoppingBag, size: 18, color: AppColors.primaryDark),
                  const SizedBox(width: 8),
                  Text('Order Items', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
                ],
              ),
              Text('${items.length} items', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
            ],
          ),
          const SizedBox(height: 20),
          ...items.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: 50,
                    height: 50,
                    color: AppColors.background,
                    child: (item['imageUrl'] ?? item['product']?['imageUrl']) != null
                      ? CachedNetworkImage(
                          imageUrl: item['imageUrl'] ?? item['product']['imageUrl'],
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Container(color: AppColors.shimmer),
                          errorWidget: (context, url, error) => const Icon(LucideIcons.image, color: AppColors.textMuted, size: 20),
                        )
                      : const Icon(LucideIcons.image, color: AppColors.textMuted, size: 20),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item['name'] ?? 'Product', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600)),
                      Text('Quantity: ${item['quantity']}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                ),
                Text('${item['price']} EGP', style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primaryDark)),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildFinancialCard() {
    final double total = (_order!['totalPrice'] as num?)?.toDouble() ?? 0.0;
    final double shipping = (_order!['shippingCost'] as num?)?.toDouble() ?? 0.0;
    final double discount = (_order!['discountAmount'] as num?)?.toDouble() ?? 0.0;
    final double subtotal = total - shipping + discount;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.primaryDark,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryDark.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _financeRow('Subtotal', '${subtotal.toStringAsFixed(0)} EGP', Colors.white70),
          const SizedBox(height: 12),
          _financeRow('Shipping', '${shipping.toStringAsFixed(0)} EGP', Colors.white70),
          if (discount > 0) ...[
            const SizedBox(height: 12),
            _financeRow('Discount', '-${discount.toStringAsFixed(0)} EGP', Colors.greenAccent),
          ],
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Divider(color: Colors.white10, height: 1),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Total', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
              Text('${total.toStringAsFixed(0)} EGP', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.accent)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 14, color: AppColors.textMuted),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.inter(fontSize: 10, color: AppColors.textMuted, fontWeight: FontWeight.w500)),
                const SizedBox(height: 2),
                Text(value, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _financeRow(String label, String value, Color color) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 13, color: color)),
        Text(value, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white)),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Row(
      children: [
        Expanded(
          child: _buildActionBtn(
            icon: LucideIcons.messageCircle,
            label: 'WhatsApp',
            color: const Color(0xFF128C7E),
            onTap: _shareViaWhatsApp,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionBtn(
            icon: LucideIcons.printer,
            label: 'Print',
            color: const Color(0xFF475569),
            onTap: _printOrder,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildActionBtn(
            icon: LucideIcons.messageSquare,
            label: 'Notes',
            color: const Color(0xFFD97706),
            onTap: _showNotesBottomSheet,
          ),
        ),
      ],
    );
  }

  Widget _buildActionBtn({required IconData icon, required String label, required Color color, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
          ],
        ),
      ),
    );
  }

  void _showNotesBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            final notes = (_order!['notes'] as List<dynamic>?) ?? [];
            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
                top: 24, left: 24, right: 24,
              ),
              decoration: const BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40, height: 4,
                      decoration: BoxDecoration(color: AppColors.divider, borderRadius: BorderRadius.circular(2)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      const Icon(LucideIcons.messageSquare, size: 20, color: AppColors.primaryDark),
                      const SizedBox(width: 12),
                      Text('Admin Notes', style: GoogleFonts.playfairDisplay(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                    ],
                  ),
                  const SizedBox(height: 20),
                  if (notes.isNotEmpty) ...[
                    Flexible(
                      child: ListView.builder(
                        shrinkWrap: true,
                        physics: const BouncingScrollPhysics(),
                        itemCount: notes.length,
                        itemBuilder: (context, index) {
                          final n = notes[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.cardBorder),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(n['content'] ?? '', style: GoogleFonts.inter(fontSize: 14, color: AppColors.textPrimary)),
                                  const SizedBox(height: 8),
                                  Text(
                                    _formatDate(n['createdAt']),
                                    style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ] else
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      child: Center(child: Text('No notes added yet.', style: GoogleFonts.inter(fontSize: 13, color: AppColors.textMuted))),
                    ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _noteController,
                          style: GoogleFonts.inter(fontSize: 14),
                          decoration: InputDecoration(
                            hintText: 'Add an internal note...',
                            hintStyle: GoogleFonts.inter(fontSize: 14, color: AppColors.textMuted),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                            filled: true,
                            fillColor: AppColors.surface,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      IconButton.filled(
                        onPressed: _isAddingNote ? null : () async {
                          final text = _noteController.text.trim();
                          if (text.isEmpty) return;
                          
                          HapticFeedback.lightImpact();
                          FocusScope.of(context).unfocus();
                          setModalState(() => _isAddingNote = true);
                          try {
                            final token = context.read<AuthProvider>().token;
                            final client = ApiClient(token: token);
                            await client.patch('/api/admin/auth/orders/${widget.orderId}', body: {'note': text});
                            _noteController.clear();
                            await _loadOrder();
                            if (mounted) setModalState(() {});
                          } catch (e) {
                            if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.error));
                          } finally {
                            if (mounted) setModalState(() => _isAddingNote = false);
                          }
                        },
                        icon: _isAddingNote 
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(LucideIcons.send, size: 20),
                        style: IconButton.styleFrom(backgroundColor: AppColors.primaryDark, padding: const EdgeInsets.all(14)),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }
        );
      },
    );
  }

  void _shareViaWhatsApp() async {
    final phone = _order!['phone'] ?? _order!['shippingPhone'] ?? _order!['customerPhone'] ?? _order!['phoneNumber'] ?? _order!['customer']?['phone'] ?? '';
    final name = _order!['displayName'] ?? _order!['customer']?['name'] ?? 'Customer';
    final orderNo = _order!['orderNumber'].toString();
    final total = _order!['totalPrice'].toString();

    final text = "Hello $name,\nThank you for your order #$orderNo from LegaCy!\nYour total is $total EGP.\nWe will keep you updated with the shipping status.";
    
    String formattedPhone = phone.replaceAll(RegExp(r'\D'), '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '2$formattedPhone'; // Egypt country code fallback
    }

    final url = "https://wa.me/$formattedPhone?text=${Uri.encodeComponent(text)}";
    
    if (Platform.isAndroid) {
      try {
        final intent = AndroidIntent(
          action: 'action_view',
          data: url,
          package: 'com.whatsapp.w4b', // Force WhatsApp Business
        );
        await intent.launch();
      } catch (e) {
        // Fallback to url_launcher if WhatsApp Business is not installed
        _launchWhatsAppFallback(url);
      }
    } else {
      _launchWhatsAppFallback(url);
    }
  }

  Future<void> _launchWhatsAppFallback(String url) async {
    try {
      final bool launched = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      if (!launched) {
        await launchUrl(Uri.parse(url), mode: LaunchMode.platformDefault);
      }
    } catch (e) {
      try {
        await launchUrl(Uri.parse(url), mode: LaunchMode.platformDefault);
      } catch (e2) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('WhatsApp is not installed or supported.'), backgroundColor: AppColors.error));
        }
      }
    }
  }

  Future<void> _printOrder() async {
    try {
      final pdfDoc = pw.Document();
      
      final font = await PdfGoogleFonts.cairoRegular();
      final boldFont = await PdfGoogleFonts.cairoBold();
      
      final name = _order!['displayName'] ?? _order!['customer']?['name'] ?? 'Guest';
      final orderNo = _order!['orderNumber'].toString();
      final items = (_order!['items'] as List? ?? []);
      final total = (_order!['totalPrice'] as num?)?.toDouble() ?? 0.0;
      
      pdfDoc.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          theme: pw.ThemeData.withFont(base: font, bold: boldFont),
          build: (pw.Context context) {
            return pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Text('LegaCy Store', style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold)),
                pw.SizedBox(height: 20),
                pw.Text('Order #$orderNo', style: pw.TextStyle(fontSize: 18)),
                pw.Text('Customer: $name'),
                pw.SizedBox(height: 20),
                pw.Text('Items:', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                pw.SizedBox(height: 10),
                ...items.map((item) => pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('${item['quantity']}x ${item['name']}'),
                    pw.Text('${item['price']} EGP'),
                  ]
                )),
                pw.Divider(),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Total', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                    pw.Text('$total EGP', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                  ]
                ),
              ],
            );
          },
        ),
      );

      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdfDoc.save(),
        name: 'Order_$orderNo',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to print: $e'), backgroundColor: AppColors.error));
      }
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    return '${d.day}/${d.month}/${d.year} ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }
}
