"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useStore } from "@/context/StoreContext";
import { Reveal } from "@/components/ui/Reveal";
import { toast } from "sonner";
import { placeOrderWithShipping } from "@/lib/actions/checkout";

import { validateCoupon } from "@/lib/actions/coupons";
import { getPaymentMethodsStatus } from "@/lib/actions/killswitches";
import { useFormPersistence } from "@/hooks/useFormPersistence";

interface ShippingForm {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingNotes: string;
  paymentMethod: "cod" | "paymob" | "wallet";
  walletNumber?: string;
}

export default function CheckoutClient() {
  const { cart, clearCart } = useStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Payment Methods State (from kill switches)
  const [paymentMethods, setPaymentMethods] = useState<{cod: boolean; paymob: boolean; wallet: boolean}>({
    cod: true,
    paymob: false,
    wallet: false
  });
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);

  const [form, setForm, clearFormStorage] = useFormPersistence<ShippingForm>('checkout_form', {
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    shippingAddress: "",
    shippingCity: "",
    shippingNotes: "",
    paymentMethod: "cod",
  });

  const [errors, setErrors] = useState<Partial<ShippingForm>>({});

  // Fetch payment methods status on mount
  useEffect(() => {
    getPaymentMethodsStatus().then(status => {
      setPaymentMethods(status);
      setLoadingPaymentMethods(false);
      // If COD (default) is disabled, switch to first available
      if (!status.cod) {
        if (status.paymob) setForm(f => ({ ...f, paymentMethod: "paymob" }));
        else if (status.wallet) setForm(f => ({ ...f, paymentMethod: "wallet" }));
      }
    }).catch(() => {
      setLoadingPaymentMethods(false);
    });
  }, [setForm]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = 0; // Free shipping
  const total = subtotal + shipping;
  const finalTotal = total - (appliedCoupon?.discount || 0);

  const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError("");

    try {
        const result = await validateCoupon(couponCode, total);
        if (result.isValid && result.discountAmount !== undefined) {
             setAppliedCoupon({
                 code: couponCode,
                 discount: result.discountAmount
             });
             toast.success("Coupon applied successfully!");
        } else {
            setCouponError(result.error || "Invalid coupon");
            setAppliedCoupon(null);
        }
    } catch {
        setCouponError("Failed to validate coupon");
    } finally {
        setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<ShippingForm> = {};
    
    if (!form.customerName.trim()) newErrors.customerName = "Name is required";
    if (!form.customerEmail.trim()) {
      newErrors.customerEmail = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      newErrors.customerEmail = "Invalid email address";
    }
    if (!form.customerPhone.trim()) {
      newErrors.customerPhone = "Phone number is required";
    } else if (!/^01[0125][0-9]{8}$/.test(form.customerPhone.replace(/\s/g, ''))) {
      newErrors.customerPhone = "Invalid Egyptian phone number";
    }
    if (!form.shippingAddress.trim()) newErrors.shippingAddress = "Address is required";
    if (!form.shippingCity.trim()) newErrors.shippingCity = "City is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsLoading(true);

    try {
      const cartItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        variantId: item.variantId || null,
      }));

      const result = await placeOrderWithShipping({
        ...form,
        cartItems,
        totalPrice: total, // Pass base total, server will recalculate with coupon
        couponCode: appliedCoupon?.code
      });

      if (result.success && result.orderId) {
        if (result.paymentUrl) {
           // Redirect to Paymob
           window.location.href = result.paymentUrl;
           return;
        }

        // COD order success - redirect to order page
        clearCart();
        clearFormStorage(); // Clear persisted form data
        toast.success("Your order has been confirmed! 🎉");
        router.push(`/orders/${result.orderId}`);
      } else {
        toast.error(result.error || "Failed to create order");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof ShippingForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (cart.length === 0) {
    return (
      <main className="container" style={{ padding: "80px 0", textAlign: "center" }}>
        <h2>Your Cart is Empty</h2>
        <p style={{ margin: "20px 0", color: "var(--text-muted)" }}>
          There are no products in your cart
        </p>
        <Link href="/shop" className="btn btn-primary">
          Browse Products
        </Link>
      </main>
    );
  }

  // Shipping Form Step
  return (
    <main>
      <section className="shop-hero">
        <div className="container">
          <Reveal>
            <h1 className="fade-in">Checkout</h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="fade-in">Enter your shipping details to complete your order</p>
          </Reveal>
        </div>
      </section>

      <section className="container" style={{ marginBottom: "80px" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 400px", 
          gap: "40px",
          alignItems: "start"
        }} className="checkout-grid">
          
          {/* Shipping Form */}
          <Reveal>
            <form onSubmit={handleSubmit} style={{ 
              background: "#fff", 
              borderRadius: "16px", 
              padding: "32px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)"
            }}>
              <h2 style={{ fontSize: "24px", marginBottom: "24px", fontFamily: "var(--font-heading)" }}>
                Shipping Information
              </h2>

              <div style={{ display: "grid", gap: "20px" }}>
                {/* Name */}
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={form.customerName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: errors.customerName ? "2px solid #ef4444" : "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "16px",
                      transition: "border-color 0.2s"
                    }}
                  />
                  {errors.customerName && (
                    <span style={{ color: "#ef4444", fontSize: "13px", marginTop: "4px", display: "block" }}>
                      {errors.customerName}
                    </span>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="customerEmail"
                    value={form.customerEmail}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: errors.customerEmail ? "2px solid #ef4444" : "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "16px"
                    }}
                  />
                  {errors.customerEmail && (
                    <span style={{ color: "#ef4444", fontSize: "13px", marginTop: "4px", display: "block" }}>
                      {errors.customerEmail}
                    </span>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={form.customerPhone}
                    onChange={handleChange}
                    placeholder="01012345678"
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: errors.customerPhone ? "2px solid #ef4444" : "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "16px"
                    }}
                  />
                  {errors.customerPhone && (
                    <span style={{ color: "#ef4444", fontSize: "13px", marginTop: "4px", display: "block" }}>
                      {errors.customerPhone}
                    </span>
                  )}
                </div>

                {/* City */}
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
                    City *
                  </label>
                  <select
                    name="shippingCity"
                    value={form.shippingCity}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: errors.shippingCity ? "2px solid #ef4444" : "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "16px",
                      background: "#fff"
                    }}
                  >
                    <option value="">Select City</option>
                    <option value="Cairo">Cairo</option>
                    <option value="Giza">Giza</option>
                    <option value="Alexandria">Alexandria</option>
                    <option value="Mansoura">Mansoura</option>
                    <option value="Tanta">Tanta</option>
                    <option value="Zagazig">Zagazig</option>
                    <option value="Assiut">Assiut</option>
                    <option value="Sohag">Sohag</option>
                    <option value="Luxor">Luxor</option>
                    <option value="Aswan">Aswan</option>
                    <option value="Port Said">Port Said</option>
                    <option value="Suez">Suez</option>
                    <option value="Ismailia">Ismailia</option>
                    <option value="Damietta">Damietta</option>
                    <option value="Minya">Minya</option>
                    <option value="Beni Suef">Beni Suef</option>
                    <option value="Fayoum">Fayoum</option>
                    <option value="Qena">Qena</option>
                    <option value="Sharm El Sheikh">Sharm El Sheikh</option>
                    <option value="Hurghada">Hurghada</option>
                    <option value="Marsa Matrouh">Marsa Matrouh</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.shippingCity && (
                    <span style={{ color: "#ef4444", fontSize: "13px", marginTop: "4px", display: "block" }}>
                      {errors.shippingCity}
                    </span>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
                    Full Address *
                  </label>
                  <textarea
                    name="shippingAddress"
                    value={form.shippingAddress}
                    onChange={handleChange}
                    placeholder="Street number, street name, area, landmark"
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: errors.shippingAddress ? "2px solid #ef4444" : "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "16px",
                      resize: "vertical"
                    }}
                  />
                  {errors.shippingAddress && (
                    <span style={{ color: "#ef4444", fontSize: "13px", marginTop: "4px", display: "block" }}>
                      {errors.shippingAddress}
                    </span>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
                    Notes (Optional)
                  </label>
                  <textarea
                    name="shippingNotes"
                    value={form.shippingNotes}
                    onChange={handleChange}
                    placeholder="Any special delivery instructions..."
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "16px",
                      resize: "vertical"
                    }}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label style={{ display: "block", marginBottom: "12px", fontWeight: "600", fontSize: "14px" }}>
                    Payment Method
                  </label>
                  {loadingPaymentMethods ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "#6b7280" }}>
                      Loading payment options...
                    </div>
                  ) : (
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", flexDirection: "column" }}>
                    {paymentMethods.cod && (
                    <label style={{
                      flex: 1,
                      minWidth: "140px",
                      padding: "16px",
                      border: form.paymentMethod === "cod" ? "2px solid #1a3c34" : "1px solid #ddd",
                      borderRadius: "12px",
                      cursor: "pointer",
                      background: form.paymentMethod === "cod" ? "#f0fdf4" : "#fff",
                      transition: "all 0.2s",
                      display: "block"
                    }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cod"
                          checked={form.paymentMethod === "cod"}
                          onChange={handleChange}
                          style={{ marginRight: "12px", accentColor: "#1a3c34", transform: "scale(1.2)" }}
                        />
                        <div>
                          <span style={{ fontWeight: "700", fontSize: "16px", display: "block", color: "#1f2937" }}>Cash on Delivery</span>
                          <span style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px", display: "block" }}>
                            Pay cash when you receive your order
                          </span>
                        </div>
                      </div>
                    </label>
                    )}

                    {paymentMethods.paymob && (
                    <label style={{
                      flex: 1,
                      minWidth: "140px",
                      padding: "16px",
                      border: form.paymentMethod === "paymob" ? "2px solid #1a3c34" : "1px solid #ddd",
                      borderRadius: "12px",
                      cursor: "pointer",
                      background: form.paymentMethod === "paymob" ? "#f0fdf4" : "#fff",
                      transition: "all 0.2s",
                      display: "block"
                    }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="paymob"
                          checked={form.paymentMethod === "paymob"}
                          onChange={handleChange}
                          style={{ marginRight: "12px", accentColor: "#1a3c34", transform: "scale(1.2)" }}
                        />
                        <div>
                          <span style={{ fontWeight: "700", fontSize: "16px", display: "block", color: "#1f2937" }}>Pay Online (Card)</span>
                          <span style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px", display: "block" }}>
                            Visa / Mastercard
                          </span>
                        </div>
                      </div>
                    </label>
                    )}

                    {paymentMethods.wallet && (
                    <label style={{
                      flex: 1,
                      minWidth: "140px",
                      padding: "16px",
                      border: form.paymentMethod === "wallet" ? "2px solid #1a3c34" : "1px solid #ddd",
                      borderRadius: "12px",
                      cursor: "pointer",
                      background: form.paymentMethod === "wallet" ? "#f0fdf4" : "#fff",
                      transition: "all 0.2s",
                      display: "block"
                    }}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="wallet"
                          checked={form.paymentMethod === "wallet"}
                          onChange={handleChange}
                          style={{ marginRight: "12px", accentColor: "#1a3c34", transform: "scale(1.2)" }}
                        />
                        <div>
                          <span style={{ fontWeight: "700", fontSize: "16px", display: "block", color: "#1f2937" }}>Mobile Wallet</span>
                          <span style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px", display: "block" }}>
                            Vodafone Cash, Etisalat, etc.
                          </span>
                        </div>
                      </div>
                    </label>
                    )}
                  </div>
                  )}
                  
                  {form.paymentMethod === "wallet" && (
                    <div style={{ marginTop: "16px" }}>
                      <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
                        Wallet Number
                      </label>
                      <input
                        type="tel"
                        name="walletNumber"
                        placeholder="01XXXXXXXXX"
                        pattern="01[0125][0-9]{8}"
                        maxLength={11}
                        value={form.walletNumber || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                          handleChange({ target: { name: 'walletNumber', value } } as React.ChangeEvent<HTMLInputElement>);
                        }}
                        className="w-full p-3 border rounded-lg"
                        style={{ width: "100%", padding: "12px", border: "1px solid #ddd", borderRadius: "8px" }}
                        required
                      />
                      <span style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", display: "block" }}>
                        Enter your Egyptian mobile number (Vodafone, Etisalat, Orange, WE)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  marginTop: "32px",
                  padding: "16px",
                  fontSize: "16px",
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? "Processing..." : "Place Order"}
              </button>
            </form>
          </Reveal>

          {/* Order Summary */}
          <Reveal delay={0.2}>
            <div style={{ 
              background: "#fff", 
              borderRadius: "16px", 
              padding: "24px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              position: "sticky",
              top: "100px"
            }}>
              <h3 style={{ fontSize: "20px", marginBottom: "20px" }}>Order Summary</h3>
              
              <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "20px" }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ 
                    display: "flex", 
                    gap: "12px", 
                    padding: "12px 0",
                    borderBottom: "1px solid #f0f0f0"
                  }}>
                    <div style={{ 
                      width: "60px", 
                      height: "60px", 
                      borderRadius: "8px", 
                      overflow: "hidden",
                      background: "#f5f5f5",
                      flexShrink: 0
                    }}>
                      {item.img && (
                        <Image 
                          src={item.img} 
                          alt={item.name} 
                          width={60} 
                          height={60}
                          style={{ objectFit: "cover" }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: "600", fontSize: "14px" }}>{item.name}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                        Qty: {item.qty}
                      </p>
                    </div>
                    <p style={{ fontWeight: "600", whiteSpace: "nowrap" }}>
                      {formatPrice(item.price * item.qty)}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid #eee", paddingTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span>Shipping</span>
                  <span style={{ color: "#16a34a" }}>Free</span>
                </div>
                
                {/* Coupon UI */}
                {!appliedCoupon ? (
                  <div style={{ marginBottom: "16px" }}>
                     <div style={{ display: "flex", gap: "8px" }}>
                       <input 
                         type="text"
                         value={couponCode}
                         onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                         placeholder="Promo Code"
                         style={{
                           flex: 1,
                           padding: "8px 12px",
                           borderRadius: "8px",
                           border: couponError ? "1px solid #ef4444" : "1px solid #ddd",
                           fontSize: "14px"
                         }}
                       />
                       <button
                         type="button"
                         onClick={handleApplyCoupon}
                         disabled={isValidatingCoupon || !couponCode}
                         style={{
                           padding: "8px 16px",
                           background: "#1a3c34",
                           color: "#fff",
                           border: "none",
                           borderRadius: "8px",
                           cursor: "pointer",
                           fontSize: "14px",
                           opacity: isValidatingCoupon ? 0.7 : 1
                         }}
                       >
                         {isValidatingCoupon ? "..." : "Apply"}
                       </button>
                     </div>
                     {couponError && (
                       <p style={{ color: "#ef4444", fontSize: "12px", marginTop: "4px" }}>
                         {couponError}
                       </p>
                     )}
                  </div>
                ) : (
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    marginBottom: "8px",
                    color: "#16a34a"
                  }}>
                    <span>Discount ({appliedCoupon.code})</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>- {formatPrice(appliedCoupon.discount)}</span>
                      <button 
                        onClick={handleRemoveCoupon}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#666", fontSize: "16px" }}
                        aria-label="Remove coupon"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  paddingTop: "16px",
                  borderTop: "2px solid #1a3c34",
                  fontSize: "18px",
                  fontWeight: "700"
                }}>
                  <span>Total</span>
                  <span style={{ color: "var(--accent)" }}>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div style={{ 
                marginTop: "24px", 
                padding: "16px", 
                background: "#f9f9f9", 
                borderRadius: "8px",
                fontSize: "13px",
                color: "var(--text-muted)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span>🔒</span>
                  <span>100% Secure Payment</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <span>🚚</span>
                  <span>Fast Delivery Nationwide</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>↩️</span>
                  <span>Free Returns within 14 Days</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 900px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
