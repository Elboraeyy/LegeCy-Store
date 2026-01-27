"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";
import { placeOrderWithShipping } from "@/lib/actions/checkout";
import { validateCoupon } from "@/lib/actions/coupons";
import { getPaymentMethodsStatus } from "@/lib/actions/killswitches";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { calculateShipping } from "@/lib/actions/shipping";
import { EGYPT_LOCATIONS } from "@/data/egypt-locations";
import CustomSelect from "@/components/ui/CustomSelect";
import styles from "./Checkout.module.css";

interface ShippingForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingGovernorate: string;
  shippingCity: string;
  shippingNotes: string;
  paymentMethod: "cod" | "paymob" | "wallet";
  walletNumber?: string;
}

// Locations are imported from @/data/egypt-locations

export default function CheckoutClient() {
  const { cart, clearCart } = useStore();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; freeShipping?: boolean; message?: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Form State
  const [form, setForm] = useFormPersistence<ShippingForm>("checkout-form", {
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    shippingGovernorate: "",
    shippingCity: "",
    shippingNotes: "",
    paymentMethod: "cod",
  });

  const [errors, setErrors] = useState<Partial<ShippingForm>>({});
  const [paymentMethods, setPaymentMethods] = useState<{ cod: boolean; paymob: boolean; wallet: boolean }>({
    cod: true,
    paymob: false,
    wallet: false,
  });
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);

  // Shipping State
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  const [shippingZone, setShippingZone] = useState<string>("");
  const [loadingShipping, setLoadingShipping] = useState(false);

  // Load payment methods
  useEffect(() => {
    async function load() {
      try {
        const methods = await getPaymentMethodsStatus();
        setPaymentMethods(methods);
      } catch (error) {
        console.error("Failed to load payment methods", error);
      } finally {
        setLoadingPaymentMethods(false);
      }
    }
    load();
  }, []);

  // Validate selected payment method
  useEffect(() => {
    if (loadingPaymentMethods) return;
    const currentEnabled = paymentMethods[form.paymentMethod];
    if (!currentEnabled) {
      let availableMethod: "cod" | "paymob" | "wallet" | null = null;
      if (paymentMethods.cod) availableMethod = "cod";
      else if (paymentMethods.paymob) availableMethod = "paymob";
      else if (paymentMethods.wallet) availableMethod = "wallet";
      if (availableMethod) {
        setForm((prev) => ({ ...prev, paymentMethod: availableMethod! }));
      }
    }
  }, [loadingPaymentMethods, paymentMethods, form.paymentMethod, setForm]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // Calculate shipping when city changes
  useEffect(() => {
    async function loadShipping() {
      if (!form.shippingGovernorate) {
        setShippingCost(null);
        setShippingZone("");
        return;
      }
      setLoadingShipping(true);
      try {
        const result = await calculateShipping(form.shippingGovernorate, subtotal);
        if (appliedCoupon?.freeShipping) {
          setShippingCost(0);
          setShippingZone("Free Shipping (Coupon)");
        } else {
          setShippingCost(result.shippingCost);
          setShippingZone(result.zoneName);
        }
      } catch (error) {
        console.error("Failed to calculate shipping:", error);
        setShippingCost(50);
        setShippingZone("Standard Shipping");
      } finally {
        setLoadingShipping(false);
      }
    }
    loadShipping();
  }, [form.shippingGovernorate, subtotal, appliedCoupon?.freeShipping]);

  // Calculate totals - Discount applies to products only
  const actualShipping = shippingCost ?? 0;
  const discountAmount = appliedCoupon?.discount || 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const finalTotal = discountedSubtotal + actualShipping;



  const formatPrice = (p: number) => {
    return language === 'ar'
      ? `${p.toLocaleString('en-US')} ${t.common.currency}`
      : `${t.common.currency} ${p.toLocaleString('en-US')}`;
  };

  const clearFormStorage = () => {
    setForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      shippingAddress: "",
      shippingGovernorate: "",
      shippingCity: "",
      shippingNotes: "",
      paymentMethod: "cod",
    });
    localStorage.removeItem("checkout-form");
  };

  // Coupon handlers
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError("");
    setAppliedCoupon(null);

    try {
      const result = await validateCoupon(couponCode, subtotal, undefined, undefined, cart);
      if (result.isValid) {
        setAppliedCoupon({
          code: couponCode,
          discount: result.discountAmount || 0,
          freeShipping: result.shippingFree,
          message: result.message,
        });
        toast.success("Promo code applied!", { description: result.message });
      } else {
        setCouponError(result.error || "Invalid promo code");
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError("Failed to validate promo code");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingForm> = {};

    if (!form.customerName.trim()) newErrors.customerName = "Full name is required";
    if (!form.customerEmail.trim()) {
      newErrors.customerEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      newErrors.customerEmail = "Please enter a valid email";
    }
    if (!form.customerPhone.trim()) {
      newErrors.customerPhone = "Phone number is required";
    } else if (!/^01[0125][0-9]{8}$/.test(form.customerPhone.replace(/\s/g, ""))) {
      newErrors.customerPhone = "Enter a valid 11-digit Egyptian number (01x...)";
    }
    if (form.customerName.trim().length < 3) {
      newErrors.customerName = "Name must be at least 3 characters";
    }
    if (!form.shippingAddress.trim()) newErrors.shippingAddress = "Address is required";
    if (!form.shippingGovernorate) newErrors.shippingGovernorate = "Please select a governorate";
    if (!form.shippingCity) newErrors.shippingCity = "Please select a city";
    if (form.paymentMethod === "wallet" && !form.walletNumber) {
      newErrors.walletNumber = "Wallet number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t.messages?.error_occurred || "Please fill in all required fields correctly");
      return;
    }

    if (cart.length === 0) {
      toast.error(t.cart.empty_cart);
      return;
    }

    setIsLoading(true);

    try {
      const cartItems = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        variantId: item.variantId || null,
      }));

      const result = await placeOrderWithShipping({
        ...form,
        cartItems,
        totalPrice: finalTotal,
        shippingCost: actualShipping,
        couponCode: appliedCoupon?.code,
      });

      if (result.success && result.orderId) {
        if (result.paymentUrl) {
          window.location.href = result.paymentUrl;
          return;
        }
        clearCart();
        clearFormStorage();
        toast.success(t.messages.order_success);
        router.push(`/orders/${result.orderId}`);
      } else {
        toast.error(result.error || t.messages.error_occurred);
      }
    } catch (error) {
      console.error(error);
      toast.error(t.messages.error_occurred);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ShippingForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const selectPaymentMethod = (method: "cod" | "paymob" | "wallet") => {
    if (!paymentMethods[method]) return;
    setForm((prev) => ({ ...prev, paymentMethod: method }));
  };

  // Empty cart state
  if (cart.length === 0) {
    return (
      <main className={styles.checkoutPage}>
        <div className={styles.checkoutHero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Checkout</h1>
          </div>
        </div>
        <div className={styles.checkoutContainer}>
          <div className={styles.emptyCart}>
            <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 22a1 1 0 100-2 1 1 0 000 2zM20 22a1 1 0 100-2 1 1 0 000 2z" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            <h2 className={styles.emptyTitle}>{t.cart.empty_cart}</h2>
            <p className={styles.emptyText}>{t.cart.empty_desc}</p>
            <Link href="/shop" className={styles.emptyBtn}>
              {t.cart.continue_shopping}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.checkoutPage}>
      {/* Hero */}
      <div className={styles.checkoutHero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>{t.checkout.secure_checkout}</h1>
          <p className={styles.heroSubtitle}>{t.checkout.contact_subtitle}</p>
        </div>
      </div>

      <div className={styles.checkoutContainer}>
        <form onSubmit={handleSubmit} className={styles.checkoutGrid}>
          {/* Left Column - Form */}
          <div>
            {/* Contact Information */}
            <section className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>{t.checkout.contact_info}</h2>
                  <p className={styles.sectionSubtitle}>{t.checkout.contact_subtitle}</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Full Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    placeholder={t.checkout.full_name}
                    className={`${styles.formInput} ${errors.customerName ? styles.formInputError : ""}`}
                  />
                  {errors.customerName && <span className={styles.errorMessage}>{errors.customerName}</span>}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      Email <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={form.customerEmail}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`${styles.formInput} ${errors.customerEmail ? styles.formInputError : ""}`}
                    />
                    {errors.customerEmail && <span className={styles.errorMessage}>{errors.customerEmail}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      {t.checkout.phone} <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={form.customerPhone}
                      onChange={handleChange}
                      placeholder="01XXXXXXXXX"
                      className={`${styles.formInput} ${errors.customerPhone ? styles.formInputError : ""}`}
                    />
                    {errors.customerPhone && <span className={styles.errorMessage}>{errors.customerPhone}</span>}
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section className={styles.formSection} style={{ marginTop: "24px" }}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>{t.checkout.shipping_address}</h2>
                  <p className={styles.sectionSubtitle}>{t.checkout.shipping_subtitle}</p>
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      {t.checkout.governorate} <span className={styles.required}>*</span>
                    </label>
                    <CustomSelect
                      name="shippingGovernorate"
                      value={form.shippingGovernorate}
                      onChange={(val) => {
                        setForm(prev => ({ ...prev, shippingGovernorate: val, shippingCity: "" }));
                        if (errors.shippingGovernorate) setErrors(prev => ({ ...prev, shippingGovernorate: "" }));
                      }}
                      options={EGYPT_LOCATIONS.map(gov => ({
                        value: gov.en,
                        label: language === 'ar' ? gov.ar : gov.en
                      }))}
                      placeholder={t.checkout.select_governorate}
                      className={errors.shippingGovernorate ? styles.formInputError : ""}
                      searchPlaceholder={language === 'ar' ? "ابحث عن محافظة..." : "Search governorate..."}
                    />
                    {errors.shippingGovernorate && <span className={styles.errorMessage}>{errors.shippingGovernorate}</span>}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      {t.checkout.city} <span className={styles.required}>*</span>
                    </label>
                    <CustomSelect
                      name="shippingCity"
                      value={form.shippingCity}
                      onChange={(val) => {
                        setForm(prev => ({ ...prev, shippingCity: val }));
                        if (errors.shippingCity) setErrors(prev => ({ ...prev, shippingCity: "" }));
                      }}
                      disabled={!form.shippingGovernorate}
                      options={form.shippingGovernorate ? (
                        EGYPT_LOCATIONS.find(g => g.en === form.shippingGovernorate)?.cities.map(city => ({
                          value: city.en,
                          label: language === 'ar' ? city.ar : city.en
                        })) || []
                      ) : []}
                      placeholder={t.checkout.select_city}
                      className={errors.shippingCity ? styles.formInputError : ""}
                      searchPlaceholder={language === 'ar' ? "ابحث عن مدينة..." : "Search city..."}
                    />
                    {errors.shippingCity && <span className={styles.errorMessage}>{errors.shippingCity}</span>}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    {t.checkout.full_address} <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    name="shippingAddress"
                    value={form.shippingAddress}
                    onChange={handleChange}
                    placeholder={t.checkout.address_placeholder}
                    className={`${styles.formTextarea} ${errors.shippingAddress ? styles.formInputError : ""}`}
                    style={{ minHeight: "100px" }}
                  />
                  {errors.shippingAddress && <span className={styles.errorMessage}>{errors.shippingAddress}</span>}
                </div>


              </div>
            </section>

            {/* Order Notes */}
            <section className={styles.formSection} style={{ marginTop: "24px" }}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>{t.checkout.order_notes}</h2>
                  <p className={styles.sectionSubtitle}>{t.checkout.notes_subtitle}</p>
                </div>
              </div>
              <div className={styles.formGroup}>
                <textarea
                  name="shippingNotes"
                  value={form.shippingNotes}
                  onChange={handleChange}
                  placeholder={t.checkout.notes_placeholder}
                  className={styles.formTextarea}
                  style={{ minHeight: "80px" }}
                />
              </div>
            </section>

            {/* Payment Method */}
            <section className={styles.formSection} style={{ marginTop: "24px" }}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <div>
                  <h2 className={styles.sectionTitle}>{t.checkout.payment_method_title}</h2>
                  <p className={styles.sectionSubtitle}>{t.checkout.payment_subtitle}</p>
                </div>
              </div>

              {loadingPaymentMethods ? (
                <div className={styles.paymentMethods}>
                  <div className={`${styles.skeleton}`} style={{ height: "80px" }} />
                  <div className={`${styles.skeleton}`} style={{ height: "80px" }} />
                </div>
              ) : (
                  <div className={styles.paymentMethods}>
                    {paymentMethods.cod && (
                      <div
                        className={`${styles.paymentOption} ${form.paymentMethod === "cod" ? styles.paymentOptionSelected : ""}`}
                        onClick={() => selectPaymentMethod("cod")}
                      >
                        <div className={styles.paymentRadio} />
                        <div className={styles.paymentIcon}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#12403C" strokeWidth="1.5">
                            <rect x="1" y="4" width="22" height="16" rx="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                            <circle cx="18" cy="15" r="2" />
                          </svg>
                        </div>
                        <div className={styles.paymentInfo}>
                          <p className={styles.paymentName}>{t.checkout.cod}</p>
                          <p className={styles.paymentDesc}>{t.checkout.cod_desc}</p>
                        </div>
                      </div>
                    )}

                    {paymentMethods.paymob && (
                      <div
                        className={`${styles.paymentOption} ${form.paymentMethod === "paymob" ? styles.paymentOptionSelected : ""}`}
                        onClick={() => selectPaymentMethod("paymob")}
                      >
                        <div className={styles.paymentRadio} />
                        <div className={styles.paymentIcon}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#12403C" strokeWidth="1.5">
                            <rect x="1" y="4" width="22" height="16" rx="2" />
                            <line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                        </div>
                        <div className={styles.paymentInfo}>
                          <p className={styles.paymentName}>{t.checkout.card}</p>
                          <p className={styles.paymentDesc}>{t.checkout.card_desc}</p>
                        </div>
                      </div>
                    )}

                    {paymentMethods.wallet && (
                      <div
                        className={`${styles.paymentOption} ${form.paymentMethod === "wallet" ? styles.paymentOptionSelected : ""}`}
                        onClick={() => selectPaymentMethod("wallet")}
                      >
                        <div className={styles.paymentRadio} />
                        <div className={styles.paymentIcon}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#12403C" strokeWidth="1.5">
                            <rect x="2" y="3" width="20" height="18" rx="2" />
                            <path d="M16 8v8M8 8v8M12 8v8" />
                          </svg>
                        </div>
                        <div className={styles.paymentInfo}>
                          <p className={styles.paymentName}>{t.checkout.wallet}</p>
                          <p className={styles.paymentDesc}>{t.checkout.wallet_desc}</p>
                        </div>
                      </div>
                  )}
                </div>
              )}

              {form.paymentMethod === "wallet" && (
                <div className={styles.formGroup} style={{ marginTop: "16px" }}>
                  <label className={styles.formLabel}>
                    {t.checkout.wallet_number} <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="walletNumber"
                    value={form.walletNumber || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 11);
                      handleChange({ target: { name: "walletNumber", value } } as React.ChangeEvent<HTMLInputElement>);
                    }}
                    placeholder="01XXXXXXXXX"
                    className={`${styles.formInput} ${errors.walletNumber ? styles.formInputError : ""}`}
                  />
                  {errors.walletNumber && <span className={styles.errorMessage}>{errors.walletNumber}</span>}
                  <p className={styles.inputHint}>{t.checkout.wallet_hint}</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Order Summary */}
          <aside className={styles.orderSummary}>
            <div className={styles.summaryHeader}>
              <h3 className={styles.summaryTitle}>{t.checkout.order_summary}</h3>
              <span className={styles.summaryItemCount}>{t.cart.items_count.replace('{count}', cart.reduce((sum, i) => sum + i.qty, 0).toString())}</span>
            </div>

            {/* Cart Items */}
            <div className={styles.summaryItems}>
              {cart.map((item, idx) => (
                <div key={idx} className={styles.summaryItem}>
                  <div className={styles.itemImage}>
                    {item.img && (
                      <Image src={item.img} alt={item.name} width={64} height={64} style={{ objectFit: "cover" }} />
                    )}
                  </div>
                  <div className={styles.itemDetails}>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemMeta}>{t.product.quantity}: {item.qty}</p>
                  </div>
                  <span className={styles.itemPrice}>{formatPrice(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            {/* Coupon Section */}
            <div className={styles.couponSection}>
              {!appliedCoupon ? (
                <>
                  <div className={styles.couponInput}>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder={t.checkout.coupon_code}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponCode.trim()}
                      className={styles.couponBtn}
                    >
                      {isValidatingCoupon ? "..." : t.checkout.apply_coupon}
                    </button>
                  </div>
                  {couponError && <p className={styles.couponError}>{couponError}</p>}
                </>
              ) : (
                <div className={styles.couponApplied}>
                  <div className={styles.couponAppliedInfo}>
                    <span className={styles.couponCode}>{appliedCoupon.code}</span>
                    <span className={styles.couponDiscount}>-{formatPrice(appliedCoupon.discount)}</span>
                  </div>
                  <button type="button" onClick={handleRemoveCoupon} className={styles.couponRemove}>×</button>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className={styles.pricingSection}>
              <div className={styles.pricingRow}>
                <span className={styles.pricingLabel}>{t.checkout.subtotal}</span>
                <span className={styles.pricingValue}>{formatPrice(subtotal)}</span>
              </div>

              {appliedCoupon && appliedCoupon.discount > 0 && (
                <div className={styles.pricingRow}>
                  <span className={styles.pricingLabel}>{t.checkout.discount}</span>
                  <span className={`${styles.pricingValue} ${styles.pricingDiscount}`}>-{formatPrice(appliedCoupon.discount)}</span>
                </div>
              )}

              <div className={styles.pricingRow}>
                <span className={styles.pricingLabel}>{t.checkout.shipping}</span>
                {loadingShipping ? (
                  <span className={styles.pricingValue} style={{ color: "var(--text-muted)" }}>{t.checkout.calculating}</span>
                ) : shippingCost === null ? (
                    <span className={styles.pricingValue} style={{ color: "var(--text-muted)" }}>{t.checkout.select_city}</span>
                ) : shippingCost === 0 ? (
                      <span className={`${styles.pricingValue} ${styles.pricingDiscount}`}>{t.checkout.free}</span>
                ) : (
                        <div className={styles.pricingShipping}>
                          <span className={styles.pricingValue}>{formatPrice(shippingCost)}</span>
                          <span className={styles.shippingZone}>{shippingZone}</span>
                  </div>
                )}
              </div>

              <div className={styles.pricingTotal}>
                <span className={styles.totalLabel}>{t.checkout.total}</span>
                <span className={styles.totalValue}>{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className={styles.submitBtn} disabled={isLoading || shippingCost === null}>
              {isLoading ? (
                <span className={styles.submitBtnLoading}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" opacity="0.25" />
                    <path d="M12 2a10 10 0 0110 10" strokeLinecap="round">
                      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                    </path>
                  </svg>
                  {t.checkout.processing}
                </span>
              ) : (
                  t.checkout.place_order
              )}
            </button>

            {/* Trust Badges */}
            <div className={styles.trustBadges}>
              <div className={styles.trustBadge}>
                <svg className={styles.trustIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span className={styles.trustText}>{t.product.trust.secure}</span>
              </div>
              <div className={styles.trustBadge}>
                <svg className={styles.trustIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className={styles.trustText}>{t.product.trust.authentic}</span>
              </div>
              <div className={styles.trustBadge}>
                <svg className={styles.trustIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className={styles.trustText}>{t.product.shipping_list.delivery.split(' ').slice(0, 2).join(' ')}</span>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
