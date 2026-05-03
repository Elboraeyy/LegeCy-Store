import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:admin_app/core/theme/app_theme.dart';
import 'package:admin_app/core/network/api_client.dart';
import 'package:admin_app/features/auth/auth_provider.dart';
import 'package:admin_app/core/constants/egypt_locations.dart';
import 'package:cached_network_image/cached_network_image.dart';

class CreateManualOrderScreen extends StatefulWidget {
  const CreateManualOrderScreen({super.key});

  @override
  State<CreateManualOrderScreen> createState() => _CreateManualOrderScreenState();
}

class _CreateManualOrderScreenState extends State<CreateManualOrderScreen> {
  final _pageController = PageController();
  int _currentStep = 0;

  // Form Controllers - Customer
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _alternativePhoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  String? _selectedGovernorate;
  String? _selectedCity;
  
  bool _isExistingCustomer = false;
  final _customerSearchController = TextEditingController();
  String? _selectedCustomerId;

  // Selected Products
  final List<Map<String, dynamic>> _selectedItems = [];
  
  // Financials
  double _shippingCost = 0.0;
  String _shippingZoneName = '';
  bool _isLoadingShipping = false;
  bool _shippingFetched = false;
  double _discountAmount = 0.0;
  String _paymentMethod = 'cod';
  String _orderSource = 'whatsapp';

  bool _isSubmitting = false;

  @override
  void dispose() {
    _pageController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _alternativePhoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _customerSearchController.dispose();
    super.dispose();
  }

  double get _subtotal {
    return _selectedItems.fold(0.0, (sum, item) => sum + (item['price'] * item['quantity']));
  }

  double get _total {
    return _subtotal + _shippingCost - _discountAmount;
  }

  void _nextStep() {
    if (_currentStep < 2) {
      _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Create Manual Order', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.x, color: AppColors.primaryDark),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          _buildStepIndicator(),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              onPageChanged: (i) => setState(() => _currentStep = i),
              children: [
                _buildCustomerStep(),
                _buildProductsStep(),
                _buildSummaryStep(),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildStepIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Row(
        children: [
          _stepNode(0, 'Customer', LucideIcons.user),
          _stepLine(0),
          _stepNode(1, 'Products', LucideIcons.shoppingBag),
          _stepLine(1),
          _stepNode(2, 'Review', LucideIcons.checkCircle),
        ],
      ),
    );
  }

  Widget _stepNode(int index, String label, IconData icon) {
    bool isActive = _currentStep >= index;
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: isActive ? AppColors.primaryDark : Colors.white,
            shape: BoxShape.circle,
            border: Border.all(color: isActive ? AppColors.primaryDark : AppColors.divider),
            boxShadow: isActive ? [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.2), blurRadius: 8, offset: const Offset(0, 4))] : null,
          ),
          child: Icon(icon, size: 18, color: isActive ? Colors.white : AppColors.textMuted),
        ),
        const SizedBox(height: 6),
        Text(label, style: GoogleFonts.inter(fontSize: 10, fontWeight: isActive ? FontWeight.w700 : FontWeight.w500, color: isActive ? AppColors.primaryDark : AppColors.textMuted)),
      ],
    );
  }

  Widget _stepLine(int index) {
    bool isActive = _currentStep > index;
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 16),
        color: isActive ? AppColors.primaryDark : AppColors.divider,
      ),
    );
  }

  Widget _buildCustomerStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Customer Details'),
          const SizedBox(height: 16),
          _customerTypeToggle(),
          const SizedBox(height: 24),
          if (_isExistingCustomer) ...[
            _searchablePicker('Search Existing Customer', _nameController.text.isEmpty ? null : _nameController.text, _showCustomerPicker),
            const SizedBox(height: 24),
          ],
          _textField(_nameController, 'Full Name', LucideIcons.user, enabled: !_isExistingCustomer),
          const SizedBox(height: 16),
          _textField(_phoneController, 'Phone Number', LucideIcons.phone, keyboardType: TextInputType.phone),
          const SizedBox(height: 16),
          _textField(_alternativePhoneController, 'Alternative Phone (Optional)', LucideIcons.phoneCall, keyboardType: TextInputType.phone),
          const SizedBox(height: 16),
          _textField(_emailController, 'Email (Optional)', LucideIcons.mail, keyboardType: TextInputType.emailAddress),
          const SizedBox(height: 24),
          _sectionTitle('Shipping Address'),
          const SizedBox(height: 20),
          _searchablePicker('Governorate', _selectedGovernorate, () => _showLocationPicker('governorate')),
          const SizedBox(height: 16),
          _searchablePicker('City / Area', _selectedCity, () => _showLocationPicker('city'), enabled: _selectedGovernorate != null),
          const SizedBox(height: 16),
          _textField(_addressController, 'Detailed Address', LucideIcons.mapPin, maxLines: 3),
        ],
      ),
    );
  }

  Widget _buildProductsStep() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(24),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _sectionTitle('Selected Products'),
              TextButton.icon(
                onPressed: _showProductPicker,
                icon: const Icon(LucideIcons.plus, size: 16),
                label: const Text('Add Product'),
              ),
            ],
          ),
        ),
        Expanded(
          child: _selectedItems.isEmpty
              ? _buildEmptyProducts()
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  itemCount: _selectedItems.length,
                  itemBuilder: (context, index) {
                    final item = _selectedItems[index];
                    return _productListItem(item, index);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildEmptyProducts() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.shoppingCart, size: 64, color: AppColors.textMuted.withValues(alpha: 0.2)),
          const SizedBox(height: 16),
          Text('No products added yet', style: GoogleFonts.inter(color: AppColors.textMuted)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _showProductPicker,
            child: const Text('Search & Add Products'),
          ),
        ],
      ),
    );
  }

  Widget _productListItem(Map<String, dynamic> item, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Container(
              width: 50,
              height: 50,
              color: AppColors.shimmer,
              child: item['imageUrl'] != null
                  ? Image.network(item['imageUrl'], fit: BoxFit.cover)
                  : const Icon(LucideIcons.image, size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item['name'], style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text('SKU: ${item['sku']}', style: GoogleFonts.inter(fontSize: 11, color: AppColors.textMuted)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                children: [
                  _qtyBtn(LucideIcons.minus, () {
                    setState(() {
                      if (item['quantity'] > 1) {
                        item['quantity']--;
                      } else {
                        _selectedItems.removeAt(index);
                      }
                    });
                  }),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text('${item['quantity']}', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                  ),
                  _qtyBtn(LucideIcons.plus, () {
                    setState(() { item['quantity']++; });
                  }),
                ],
              ),
              const SizedBox(height: 4),
              Text('${(item['price'] * item['quantity']).toStringAsFixed(0)} EGP', style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryDark)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _qtyBtn(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(icon, size: 14, color: AppColors.primaryDark),
      ),
    );
  }

  Widget _buildSummaryStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Order Summary'),
          const SizedBox(height: 20),
          _summaryCard(),
          const SizedBox(height: 24),
          _sectionTitle('Additional Details'),
          const SizedBox(height: 20),
          _sourceDropdown(),
          const SizedBox(height: 16),
          _paymentDropdown(),
          const SizedBox(height: 16),
          _financialInputs(),
        ],
      ),
    );
  }

  Widget _summaryCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.primaryDark,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.2), blurRadius: 15, offset: const Offset(0, 8))],
      ),
      child: Column(
        children: [
          _summaryRow('Subtotal', '${_subtotal.toStringAsFixed(0)} EGP', Colors.white70),
          _summaryRow(
            _shippingZoneName.isNotEmpty ? 'Shipping ($_shippingZoneName)' : 'Shipping',
            _isLoadingShipping ? '...' : '${_shippingCost.toStringAsFixed(0)} EGP',
            Colors.white70,
          ),
          if (_discountAmount > 0)
            _summaryRow('Discount', '-${_discountAmount.toStringAsFixed(0)} EGP', Colors.greenAccent),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(color: Colors.white12),
          ),
          _summaryRow('Total Price', '${_total.toStringAsFixed(0)} EGP', Colors.white, isLarge: true),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, String value, Color color, {bool isLarge = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: isLarge ? 16 : 13, color: color, fontWeight: isLarge ? FontWeight.w700 : FontWeight.w400)),
          Text(value, style: GoogleFonts.inter(fontSize: isLarge ? 22 : 14, color: color, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }

  Widget _financialInputs() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Shipping rate from server
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.cardBorder),
          ),
          child: Row(
            children: [
              Icon(
                _isLoadingShipping ? LucideIcons.loader : LucideIcons.truck,
                size: 18,
                color: _shippingFetched ? AppColors.primaryDark : AppColors.textMuted,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Shipping Cost',
                      style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _isLoadingShipping
                          ? 'Calculating...'
                          : _shippingFetched
                              ? '${_shippingCost.toStringAsFixed(0)} EGP'
                              : 'Select governorate first',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: _shippingFetched ? AppColors.primaryDark : AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              if (_shippingZoneName.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primaryDark.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _shippingZoneName,
                    style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primaryDark),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        // Discount field (still manually editable)
        _smallField('Discount', (v) => setState(() => _discountAmount = double.tryParse(v) ?? 0.0), initial: '0'),
      ],
    );
  }

  Widget _smallField(String label, Function(String) onChanged, {String? initial}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
        const SizedBox(height: 8),
        TextField(
          onChanged: onChanged,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            hintText: initial,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            fillColor: Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _buildBottomBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -5))],
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: _prevStep,
                child: const Text('Back'),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 16),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : (_currentStep == 2 ? _submitOrder : _nextStep),
              child: _isSubmitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text(_currentStep == 2 ? 'Create Order' : 'Continue'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Text(title, style: GoogleFonts.playfairDisplay(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.primaryDark));
  }

  Widget _textField(TextEditingController controller, String hint, IconData icon, {TextInputType? keyboardType, int maxLines = 1, bool enabled = true}) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      enabled: enabled,
      style: GoogleFonts.inter(fontSize: 14, color: enabled ? AppColors.textPrimary : AppColors.textMuted),
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, size: 18, color: AppColors.textMuted),
        fillColor: enabled ? Colors.white : AppColors.background,
      ),
    );
  }

  Widget _searchablePicker(String label, String? value, VoidCallback onTap, {bool enabled = true}) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: enabled ? Colors.white : AppColors.background,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              value ?? label,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: value != null ? AppColors.textPrimary : AppColors.textMuted,
              ),
            ),
            Icon(LucideIcons.chevronDown, size: 16, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }

  void _showLocationPicker(String type) {
    List<String> options = [];
    if (type == 'governorate') {
      options = egyptLocations.map((g) => g.en).toList();
    } else {
      final gov = egyptLocations.firstWhere((g) => g.en == _selectedGovernorate);
      options = gov.cities.map((c) => c.en).toList();
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _LocationSearchSheet(
        title: 'Select $type',
        options: options,
        onSelect: (val) {
          setState(() {
            if (type == 'governorate') {
              _selectedGovernorate = val;
              _selectedCity = null; // Reset city when gov changes
            } else {
              _selectedCity = val;
            }
          });
          _updateShippingCost();
        },
      ),
    );
  }

  Future<void> _updateShippingCost() async {
    if (_selectedGovernorate == null) return;
    
    if (mounted) {
      setState(() => _isLoadingShipping = true);
    }
    
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      
      // Build query with subtotal for free shipping threshold check
      final queryParams = {
        'governorate': _selectedGovernorate!,
        if (_selectedCity != null && _selectedCity!.isNotEmpty) 'city': _selectedCity!,
        if (_subtotal > 0) 'subtotal': _subtotal.toString(),
      };
      final queryString = queryParams.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');
      
      final data = await client.get('/api/admin/auth/orders/shipping-rate?$queryString');
      
      if (!mounted) return;
      setState(() {
        _shippingCost = (data['rate'] as num).toDouble();
        _shippingZoneName = data['zoneName'] as String? ?? '';
        _shippingFetched = true;
        _isLoadingShipping = false;
      });
    } catch (e) {
      debugPrint('Shipping rate fetch error: $e');
      // Do NOT use hardcoded fallback — show error instead
      if (mounted) {
        setState(() {
          _isLoadingShipping = false;
          _shippingFetched = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not fetch shipping rate from server. Please check connection.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Widget _customerTypeToggle() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.cardBorder),
      ),
      child: Row(
        children: [
          _toggleBtn('New Customer', !_isExistingCustomer, () => setState(() {
            _isExistingCustomer = false;
            _clearCustomerFields();
          })),
          _toggleBtn('Existing', _isExistingCustomer, () => setState(() {
            _isExistingCustomer = true;
          })),
        ],
      ),
    );
  }

  Widget _toggleBtn(String label, bool isActive, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isActive ? AppColors.primaryDark : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
              color: isActive ? Colors.white : AppColors.textMuted,
            ),
          ),
        ),
      ),
    );
  }

  void _clearCustomerFields() {
    _selectedCustomerId = null;
    _nameController.clear();
    _phoneController.clear();
    _alternativePhoneController.clear();
    _emailController.clear();
    _selectedGovernorate = null;
    _selectedCity = null;
    _addressController.clear();
    _shippingCost = 0.0;
    _shippingZoneName = '';
    _shippingFetched = false;
  }

  void _showCustomerPicker() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CustomerSearchSheet(
        onSelect: (customer) => _populateCustomerData(customer['id']),
      ),
    );
  }

  Future<void> _populateCustomerData(String id) async {
    setState(() {
      _selectedCustomerId = id;
      _isSubmitting = true; // Show loading
    });
    
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/customers/$id');
      
      if (mounted) {
        setState(() {
          _nameController.text = data['name'] ?? '';
          _phoneController.text = data['phone'] ?? '';
          _emailController.text = data['email'] ?? '';
          
          // Try to get address from last order
          if (data['orders'] != null && data['orders'].isNotEmpty) {
            final lastOrder = data['orders'][0];
            _selectedGovernorate = lastOrder['shippingGovernorate'];
            _selectedCity = lastOrder['shippingCity'];
            _addressController.text = lastOrder['shippingAddress'] ?? '';
          }
        });
        // Fetch shipping rate from server for the customer's location
        if (_selectedGovernorate != null) {
          _updateShippingCost();
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to fetch customer details')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Widget _sourceDropdown() {
    return _selectableChips(
      label: 'Order Source',
      value: _orderSource,
      options: [
        {'id': 'whatsapp', 'label': 'WhatsApp', 'icon': LucideIcons.messageCircle},
        {'id': 'facebook', 'label': 'Facebook', 'icon': LucideIcons.facebook},
        {'id': 'instagram', 'label': 'Instagram', 'icon': LucideIcons.instagram},
        {'id': 'phone', 'label': 'Phone', 'icon': LucideIcons.phone},
        {'id': 'other', 'label': 'Other', 'icon': LucideIcons.moreHorizontal},
      ],
      onChanged: (v) => setState(() => _orderSource = v),
    );
  }

  Widget _paymentDropdown() {
    return _selectableChips(
      label: 'Payment Method',
      value: _paymentMethod,
      options: [
        {'id': 'cod', 'label': 'COD', 'icon': LucideIcons.banknote},
        {'id': 'instapay', 'label': 'InstaPay', 'icon': LucideIcons.send},
        {'id': 'wallet', 'label': 'Wallet', 'icon': LucideIcons.wallet},
        {'id': 'card', 'label': 'Card', 'icon': LucideIcons.creditCard},
      ],
      onChanged: (v) => setState(() => _paymentMethod = v),
    );
  }

  Widget _selectableChips({
    required String label,
    required String value,
    required List<Map<String, dynamic>> options,
    required Function(String) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((opt) {
            final isSelected = value == opt['id'];
            return GestureDetector(
              onTap: () => onChanged(opt['id']),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primaryDark : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isSelected ? AppColors.primaryDark : AppColors.cardBorder),
                  boxShadow: isSelected ? [BoxShadow(color: AppColors.primaryDark.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 4))] : [],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(opt['icon'], size: 16, color: isSelected ? Colors.white : AppColors.textMuted),
                    const SizedBox(width: 8),
                    Text(
                      opt['label'],
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected ? Colors.white : AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  void _showProductPicker() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _ProductPickerSheet(onAdd: (item) {
        setState(() {
          int idx = _selectedItems.indexWhere((i) => i['variantId'] == item['variantId']);
          if (idx != -1) {
            _selectedItems[idx]['quantity'] += item['quantity'];
          } else {
            _selectedItems.add(item);
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${item['name']} added to order'),
            duration: const Duration(seconds: 1),
            behavior: SnackBarBehavior.floating,
            backgroundColor: AppColors.success,
          ),
        );
      }),
    );
  }

  Future<void> _submitOrder() async {
    if (_nameController.text.isEmpty || _phoneController.text.isEmpty || _selectedItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill required fields and add products')));
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      
      final body = {
        'customer': _isExistingCustomer 
          ? { 'existingId': _selectedCustomerId }
          : {
              'name': _nameController.text,
              'phone': _phoneController.text,
              'alternativePhone': _alternativePhoneController.text.isEmpty ? null : _alternativePhoneController.text,
              'email': _emailController.text.isEmpty ? null : _emailController.text,
            },
        'shippingAddress': {
          'street': _addressController.text,
          'city': _selectedCity,
          'governorate': _selectedGovernorate,
        },
        'items': _selectedItems.map((i) => {
          'variantId': i['variantId'],
          'quantity': i['quantity'],
        }).toList(),
        'shippingCost': _shippingCost,
        'discountAmount': _discountAmount,
        'paymentMethod': _paymentMethod,
        'source': _orderSource,
      };

      await client.post('/api/admin/auth/orders', body: body);
      
      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: const Text('Order created successfully'), backgroundColor: AppColors.success, behavior: SnackBarBehavior.floating),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }
}

class _ProductPickerSheet extends StatefulWidget {
  final Function(Map<String, dynamic>) onAdd;
  const _ProductPickerSheet({required this.onAdd});

  @override
  State<_ProductPickerSheet> createState() => _ProductPickerSheetState();
}

class _ProductPickerSheetState extends State<_ProductPickerSheet> {
  final _searchController = TextEditingController();
  List<dynamic> _results = [];
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _search();
  }

  void _search() async {
    setState(() => _isSearching = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/products?search=${Uri.encodeComponent(_searchController.text)}');
      setState(() => _results = data['products']);
    } catch (_) {} finally {
      setState(() => _isSearching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.divider, borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.all(24),
            child: TextField(
              controller: _searchController,
              autofocus: true,
              onChanged: (_) => _search(),
              decoration: InputDecoration(
                hintText: 'Search products by name...',
                prefixIcon: const Icon(LucideIcons.search, size: 20),
                suffixIcon: _isSearching ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2)) : null,
              ),
            ),
          ),
          Expanded(
            child: _results.isEmpty
                ? Center(child: Text('No results', style: GoogleFonts.inter(color: AppColors.textMuted)))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    itemCount: _results.length,
                    itemBuilder: (context, index) {
                      final p = _results[index];
                      return ListTile(
                        contentPadding: const EdgeInsets.symmetric(vertical: 8),
                        leading: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            width: 56, 
                            height: 56, 
                            color: AppColors.shimmer, 
                            child: p['imageUrl'] != null 
                              ? CachedNetworkImage(
                                  imageUrl: p['imageUrl'],
                                  fit: BoxFit.cover,
                                  placeholder: (context, url) => Container(color: AppColors.shimmer),
                                  errorWidget: (context, url, error) => const Icon(LucideIcons.image),
                                )
                              : const Icon(LucideIcons.image),
                          ),
                        ),
                        title: Text(p['name'], style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                        subtitle: Text('${p['price']} EGP • ${p['variantCount']} variants', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.primaryDark.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Add',
                            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryDark),
                          ),
                        ),
                        onTap: () => _showQuantityAndVariantPicker(p),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  void _showQuantityAndVariantPicker(dynamic product) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _ProductDetailSheet(
        product: product,
        onAdd: (item) {
          Navigator.of(context).pop(); // Close detail sheet
          widget.onAdd(item);
          // The parent pop will be handled by the user or here
          Navigator.of(context).pop(); // Close product search
        },
      ),
    );
  }
}

class _LocationSearchSheet extends StatefulWidget {
  final String title;
  final List<String> options;
  final Function(String) onSelect;

  const _LocationSearchSheet({
    required this.title,
    required this.options,
    required this.onSelect,
  });

  @override
  State<_LocationSearchSheet> createState() => _LocationSearchSheetState();
}

class _LocationSearchSheetState extends State<_LocationSearchSheet> {
  final _searchController = TextEditingController();
  List<String> _filteredOptions = [];

  @override
  void initState() {
    super.initState();
    _filteredOptions = widget.options;
  }

  void _filter(String query) {
    setState(() {
      _filteredOptions = widget.options
          .where((o) => o.toLowerCase().contains(query.toLowerCase()))
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.divider, borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.title, style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                TextField(
                  controller: _searchController,
                  autofocus: true,
                  onChanged: _filter,
                  decoration: InputDecoration(
                    hintText: 'Search...',
                    prefixIcon: const Icon(LucideIcons.search, size: 20),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              itemCount: _filteredOptions.length,
              itemBuilder: (context, index) {
                final option = _filteredOptions[index];
                return ListTile(
                  title: Text(option, style: GoogleFonts.inter(fontSize: 14)),
                  onTap: () {
                    widget.onSelect(option);
                    Navigator.pop(context);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _CustomerSearchSheet extends StatefulWidget {
  final Function(Map<String, dynamic>) onSelect;
  const _CustomerSearchSheet({required this.onSelect});

  @override
  State<_CustomerSearchSheet> createState() => _CustomerSearchSheetState();
}

class _CustomerSearchSheetState extends State<_CustomerSearchSheet> {
  final _searchController = TextEditingController();
  List<dynamic> _results = [];
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    _search();
  }

  void _search() async {
    setState(() => _isSearching = true);
    try {
      final token = context.read<AuthProvider>().token;
      final client = ApiClient(token: token);
      final data = await client.get('/api/admin/auth/customers?search=${Uri.encodeComponent(_searchController.text)}');
      setState(() => _results = data['data']);
    } catch (_) {} finally {
      setState(() => _isSearching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.divider, borderRadius: BorderRadius.circular(2))),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Search Customers', style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700)),
                const SizedBox(height: 16),
                TextField(
                  controller: _searchController,
                  autofocus: true,
                  onChanged: (_) => _search(),
                  decoration: InputDecoration(
                    hintText: 'Search by name or phone...',
                    prefixIcon: const Icon(LucideIcons.search, size: 20),
                    suffixIcon: _isSearching ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2)) : null,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _results.isEmpty
                ? Center(child: Text('No customers found', style: GoogleFonts.inter(color: AppColors.textMuted)))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    itemCount: _results.length,
                    itemBuilder: (context, index) {
                      final c = _results[index];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppColors.primaryDark.withValues(alpha: 0.1),
                          child: Text(c['name']?[0]?.toUpperCase() ?? '?', style: GoogleFonts.inter(color: AppColors.primaryDark, fontWeight: FontWeight.bold)),
                        ),
                        title: Text(c['name'] ?? 'Guest', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
                        subtitle: Text(c['email'] ?? '', style: GoogleFonts.inter(fontSize: 12, color: AppColors.textMuted)),
                        onTap: () {
                          widget.onSelect(c);
                          Navigator.pop(context);
                        },
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _ProductDetailSheet extends StatefulWidget {
  final dynamic product;
  final Function(Map<String, dynamic>) onAdd;

  const _ProductDetailSheet({required this.product, required this.onAdd});

  @override
  State<_ProductDetailSheet> createState() => _ProductDetailSheetState();
}

class _ProductDetailSheetState extends State<_ProductDetailSheet> {
  int _quantity = 1;
  late dynamic _selectedVariant;

  @override
  void initState() {
    super.initState();
    final List<dynamic> variants = widget.product['variants'] ?? [];
    _selectedVariant = variants.isNotEmpty ? variants[0] : null;
  }

  @override
  Widget build(BuildContext context) {
    final List<dynamic> variants = widget.product['variants'] ?? [];

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  width: 80,
                  height: 80,
                  color: AppColors.shimmer,
                  child: widget.product['imageUrl'] != null 
                    ? CachedNetworkImage(
                        imageUrl: widget.product['imageUrl'], 
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(color: AppColors.shimmer),
                        errorWidget: (context, url, error) => const Icon(LucideIcons.image),
                      )
                    : const Icon(LucideIcons.image),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.product['name'], style: GoogleFonts.playfairDisplay(fontSize: 18, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text('${_selectedVariant?['price'] ?? widget.product['price']} EGP', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryDark)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          if (variants.length > 1) ...[
            Text('Select Variant', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            SizedBox(
              height: 40,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: variants.length,
                itemBuilder: (context, index) {
                  final v = variants[index];
                  final isSelected = _selectedVariant?['id'] == v['id'];
                  return GestureDetector(
                    onTap: () => setState(() => _selectedVariant = v),
                    child: Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primaryDark : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: isSelected ? AppColors.primaryDark : AppColors.cardBorder),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        v['sku'],
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: isSelected ? Colors.white : AppColors.textPrimary,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 24),
          ],
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Quantity', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600)),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.cardBorder),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(LucideIcons.minus, size: 16),
                      onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                    ),
                    Text('$_quantity', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                    IconButton(
                      icon: const Icon(LucideIcons.plus, size: 16),
                      onPressed: () => setState(() => _quantity++),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: () {
                try {
                  if (_selectedVariant == null) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a variant')));
                    return;
                  }
                  
                  final item = {
                    'productId': widget.product['id'],
                    'variantId': _selectedVariant['id'],
                    'name': widget.product['name'],
                    'sku': _selectedVariant['sku'],
                    'price': double.parse((_selectedVariant['price'] ?? widget.product['price'] ?? 0).toString()),
                    'imageUrl': widget.product['imageUrl'],
                    'quantity': _quantity,
                  };
                  
                  widget.onAdd(item);
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error adding product: $e')));
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryDark,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: Text('Add to Order', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
