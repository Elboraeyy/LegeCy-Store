"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import styles from "./Return.module.css";

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  image: string | null;
}

interface Order {
  id: string;
  status: string;
  createdAt: string;
  deliveredAt: string | null;
  totalPrice: number;
  customerName: string | null;
  items: OrderItem[];
}

interface Props {
  order: Order;
}

interface SelectedItem {
  id: string;
  quantity: number;
  images: string[];
}

const RETURN_REASONS = [
  { id: 'defective', label: 'Defective or Damaged', icon: '🔧', desc: 'Product arrived broken or not working' },
  { id: 'wrong_item', label: 'Wrong Item Received', icon: '📦', desc: 'Different product than what I ordered' },
  { id: 'not_as_described', label: 'Not as Described', icon: '📋', desc: 'Product doesn\'t match the description' },
  { id: 'changed_mind', label: 'Changed My Mind', icon: '🔄', desc: 'No longer need the product' },
  { id: 'size_issue', label: 'Size/Fit Issue', icon: '📏', desc: 'Product doesn\'t fit as expected' },
  { id: 'other', label: 'Other Reason', icon: '💬', desc: 'Different reason not listed above' }
];

const RETURN_TYPES = [
  { id: 'refund', label: 'Refund', icon: '💰' },
  { id: 'exchange', label: 'Exchange', icon: '🔄' },
  { id: 'store_credit', label: 'Store Credit', icon: '🎁' }
];

export default function ReturnRequestClient({ order }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [reason, setReason] = useState('');
  const [returnType, setReturnType] = useState('refund');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const formatPrice = (p: number) => `EGP ${p.toLocaleString()}`;

  const toggleItem = (item: OrderItem) => {
    const newMap = new Map(selectedItems);
    if (newMap.has(item.id)) {
      newMap.delete(item.id);
    } else {
      newMap.set(item.id, { id: item.id, quantity: 1, images: [] });
    }
    setSelectedItems(newMap);
  };

  const updateItemQuantity = (itemId: string, qty: number) => {
    const newMap = new Map(selectedItems);
    const item = newMap.get(itemId);
    if (item) {
      item.quantity = qty;
      newMap.set(itemId, item);
      setSelectedItems(newMap);
    }
  };

  const handlePhotoUpload = async (itemId: string, file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('orderId', order.id);

      const res = await fetch('/api/upload/return-image', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      
      if (data.success && data.url) {
        const newMap = new Map(selectedItems);
        const item = newMap.get(itemId);
        if (item) {
          item.images.push(data.url);
          newMap.set(itemId, item);
          setSelectedItems(newMap);
        }
        toast.success('Photo uploaded successfully');
      } else {
        toast.error(data.error || 'Failed to upload photo');
      }
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (itemId: string, photoIndex: number) => {
    const newMap = new Map(selectedItems);
    const item = newMap.get(itemId);
    if (item) {
      item.images.splice(photoIndex, 1);
      newMap.set(itemId, item);
      setSelectedItems(newMap);
    }
  };

  const canProceedStep1 = () => {
    if (selectedItems.size === 0) return false;
    // Check all selected items have at least one photo
    for (const item of selectedItems.values()) {
      if (item.images.length === 0) return false;
    }
    return true;
  };

  const canProceedStep2 = () => {
    return reason !== '';
  };

  const handleSubmit = async () => {
    if (!canProceedStep1() || !canProceedStep2()) return;

    setSubmitting(true);
    try {
      const items = Array.from(selectedItems.values()).map(item => ({
        id: item.id,
        quantity: item.quantity,
        images: item.images
      }));

      const allImages = items.flatMap(item => item.images);

      const res = await fetch('/api/returns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          reason: RETURN_REASONS.find(r => r.id === reason)?.label || reason,
          description,
          returnType,
          items,
          images: allImages
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        toast.success('Return request submitted successfully!');
      } else {
        toast.error(data.error || 'Failed to submit return request');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main className={styles.returnPage}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>Return Request</span>
            <h1 className={styles.heroTitle}>Request Submitted!</h1>
          </div>
        </div>
        <div className={styles.container}>
          <div className={`${styles.card} ${styles.successCard}`}>
            <div className={styles.successIcon}>✅</div>
            <h2 className={styles.successTitle}>We&apos;ve Received Your Request</h2>
            <p className={styles.successText}>
              Your return request for order #{order.id.slice(0, 8).toUpperCase()} has been submitted successfully.
              <br /><br />
              Our team will review your request and get back to you within 24-48 hours.
              You&apos;ll receive an email with the next steps once approved.
            </p>
            <div className={styles.successActions}>
              <Link href="/account/orders" className={styles.btnNext}>
                View My Orders
              </Link>
              <Link href="/shop" className={styles.btnBack}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.returnPage}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroLabel}>Order #{order.id.slice(0, 8).toUpperCase()}</span>
          <h1 className={styles.heroTitle}>Request a Return</h1>
          <p className={styles.heroSubtitle}>We&apos;re sorry to see these items go</p>
        </div>
      </div>

      <div className={styles.container}>
        {/* Progress Steps */}
        <div className={styles.progressBar}>
          <div className={`${styles.progressStep} ${step === 1 ? styles.active : ''} ${step > 1 ? styles.completed : ''}`}>
            <span className={styles.stepNumber}>{step > 1 ? '✓' : '1'}</span>
            Select Items
          </div>
          <div className={`${styles.progressStep} ${step === 2 ? styles.active : ''} ${step > 2 ? styles.completed : ''}`}>
            <span className={styles.stepNumber}>{step > 2 ? '✓' : '2'}</span>
            Reason
          </div>
          <div className={`${styles.progressStep} ${step === 3 ? styles.active : ''}`}>
            <span className={styles.stepNumber}>3</span>
            Review
          </div>
        </div>

        {/* Step 1: Select Items */}
        {step === 1 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📦</span>
              Select Items to Return
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              Select the items you wish to return and upload photos for each.
            </p>

            <div className={styles.productList}>
              {order.items.map(item => {
                const selected = selectedItems.get(item.id);
                const isSelected = !!selected;

                return (
                  <div 
                    key={item.id} 
                    className={`${styles.productItem} ${isSelected ? styles.selected : ''}`}
                  >
                    <div className={styles.productImage}>
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={80} height={80} style={{ objectFit: 'cover' }} />
                      ) : (
                        '⌚'
                      )}
                    </div>

                    <div className={styles.productInfo}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div onClick={() => toggleItem(item)} style={{ cursor: 'pointer', flex: 1 }}>
                          <p className={styles.productName}>{item.name}</p>
                          <p className={styles.productMeta}>
                            {formatPrice(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <div 
                          className={styles.checkbox}
                          onClick={() => toggleItem(item)}
                        >
                          {isSelected && '✓'}
                        </div>
                      </div>

                      {isSelected && (
                        <>
                          <div className={styles.qtySelector}>
                            <span className={styles.qtyLabel}>Return Quantity:</span>
                            <select 
                              className={styles.qtySelect}
                              value={selected.quantity}
                              onChange={(e) => updateItemQuantity(item.id, Number(e.target.value))}
                            >
                              {[...Array(item.quantity)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1}</option>
                              ))}
                            </select>
                          </div>

                          <div className={styles.photoUpload}>
                            <p className={styles.photoLabel}>
                              📷 Upload Photos <span className={styles.photoRequired}>*</span>
                            </p>
                            <div className={styles.photoGrid}>
                              {selected.images.map((url, idx) => (
                                <div key={idx} className={`${styles.photoSlot} ${styles.filled}`}>
                                  <Image src={url} alt={`Photo ${idx + 1}`} width={80} height={80} style={{ objectFit: 'cover' }} />
                                  <button 
                                    className={styles.photoRemove}
                                    onClick={() => removePhoto(item.id, idx)}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                              {selected.images.length < 3 && (
                                <div 
                                  className={styles.photoSlot}
                                  onClick={() => fileInputRefs.current.get(item.id)?.click()}
                                >
                                  {uploading ? (
                                    <div className={styles.spinner} />
                                  ) : (
                                    <span className={styles.photoAdd}>+</span>
                                  )}
                                </div>
                              )}
                              <input
                                ref={el => { if (el) fileInputRefs.current.set(item.id, el); }}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePhotoUpload(item.id, file);
                                  e.target.value = '';
                                }}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.actions}>
              <button 
                className={styles.btnBack}
                onClick={() => router.back()}
              >
                Cancel
              </button>
              <button 
                className={styles.btnNext}
                disabled={!canProceedStep1()}
                onClick={() => setStep(2)}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Reason */}
        {step === 2 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📝</span>
              Why are you returning?
            </h2>

            <div className={styles.reasonList}>
              {RETURN_REASONS.map(r => (
                <div 
                  key={r.id}
                  className={`${styles.reasonOption} ${reason === r.id ? styles.selected : ''}`}
                  onClick={() => setReason(r.id)}
                >
                  <span className={styles.reasonIcon}>{r.icon}</span>
                  <div className={styles.reasonText}>
                    <p className={styles.reasonTitle}>{r.label}</p>
                    <p className={styles.reasonDesc}>{r.desc}</p>
                  </div>
                  <div className={styles.checkbox}>
                    {reason === r.id && '✓'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
                How would you like to be compensated?
              </h3>
              <div className={styles.returnTypes}>
                {RETURN_TYPES.map(t => (
                  <div 
                    key={t.id}
                    className={`${styles.returnType} ${returnType === t.id ? styles.selected : ''}`}
                    onClick={() => setReturnType(t.id)}
                  >
                    <div className={styles.returnTypeIcon}>{t.icon}</div>
                    <div className={styles.returnTypeLabel}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                Additional Details (Optional)
              </label>
              <textarea 
                className={styles.textarea}
                placeholder="Provide any additional details about your return request..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className={styles.actions}>
              <button 
                className={styles.btnBack}
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button 
                className={styles.btnNext}
                disabled={!canProceedStep2()}
                onClick={() => setStep(3)}
              >
                Review Request →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              <span className={styles.cardIcon}>✅</span>
              Review Your Request
            </h2>

            <div className={styles.summarySection}>
              <p className={styles.summaryLabel}>Items to Return</p>
              <div className={styles.summaryItems}>
                {Array.from(selectedItems.entries()).map(([itemId, selected]) => {
                  const item = order.items.find(i => i.id === itemId);
                  if (!item) return null;
                  return (
                    <div key={itemId} className={styles.summaryItem}>
                      <div className={styles.summaryItemImage}>
                        {item.image && <Image src={item.image} alt={item.name} width={50} height={50} style={{ objectFit: 'cover' }} />}
                      </div>
                      <div className={styles.summaryItemInfo}>
                        <p className={styles.summaryItemName}>{item.name}</p>
                        <p className={styles.summaryItemMeta}>Qty: {selected.quantity} • {formatPrice(item.price * selected.quantity)}</p>
                      </div>
                      <div className={styles.summaryPhotos}>
                        {selected.images.map((url, idx) => (
                          <div key={idx} className={styles.summaryPhoto}>
                            <Image src={url} alt={`Photo ${idx + 1}`} width={40} height={40} style={{ objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.summarySection}>
              <p className={styles.summaryLabel}>Reason</p>
              <p className={styles.summaryValue}>
                {RETURN_REASONS.find(r => r.id === reason)?.label}
              </p>
            </div>

            <div className={styles.summarySection}>
              <p className={styles.summaryLabel}>Preferred Resolution</p>
              <p className={styles.summaryValue}>
                {RETURN_TYPES.find(t => t.id === returnType)?.label}
              </p>
            </div>

            {description && (
              <div className={styles.summarySection}>
                <p className={styles.summaryLabel}>Additional Details</p>
                <p className={styles.summaryValue}>{description}</p>
              </div>
            )}

            <div className={styles.actions}>
              <button 
                className={styles.btnBack}
                onClick={() => setStep(2)}
              >
                ← Back
              </button>
              <button 
                className={styles.btnSubmit}
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
