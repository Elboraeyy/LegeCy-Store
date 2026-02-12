"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { submitReview } from "@/lib/actions/reviews";
import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (!text.trim()) {
      toast.error("Please write a review");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitReview({
        productId,
        name: name.trim(),
        text: text.trim(),
        rating,
        images
      });

      if (result.success) {
        toast.success("Thank you for your review!");
        setName("");
        setText("");
        setRating(5);
        setImages([]);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to submit review");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-form-container" style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '32px',
      border: '1px solid var(--border-light)',
      marginTop: '40px'
    }}>
      <h3 style={{ 
        fontFamily: 'var(--font-heading)', 
        fontSize: '24px', 
        marginBottom: '24px', 
        color: '#12403C'
      }}>
        Write a Review
      </h3>

      <form onSubmit={handleSubmit}>
        {/* Rating */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 600,
            fontSize: '14px',
            color: '#12403C'
          }}>
            Your Rating
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  fontSize: '28px',
                  color: star <= rating ? '#d4af37' : '#ddd',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 600,
            fontSize: '14px',
            color: '#12403C'
          }}>
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          />
        </div>

        {/* Review Text */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 600,
            fontSize: '14px',
            color: '#12403C'
          }}>
            Your Review
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts about this product..."
            required
            rows={4}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '15px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s'
            }}
          />
        </div>

        {/* Image Upload */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 600,
            fontSize: '14px',
            color: '#12403C'
          }}>
            Add Photos
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px', marginBottom: '12px' }}>
            {images.map((url, idx) => (
              <div key={idx} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                <Image
                  src={url}
                  alt="Review upload"
                  fill
                  style={{ objectFit: 'cover' }}
                />
                <button
                  type="button"
                  onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            <CldUploadWidget
              onSuccess={(result) => {
                if (result.info && typeof result.info === 'object' && 'secure_url' in result.info) {
                  setImages(prev => [...prev, (result.info as { secure_url: string }).secure_url]);
                }
              }}
              uploadPreset="nsigned_preset"
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => open()}
                  style={{
                    aspectRatio: '1/1',
                    border: '2px dashed #ddd',
                    borderRadius: '8px',
                    background: '#f9f9f9',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#666',
                    fontSize: '12px',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>+</span>
                  <span>Add</span>
                </button>
              )}
            </CldUploadWidget>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            background: '#12403C',
            color: '#fff',
            border: 'none',
            borderRadius: '30px',
            padding: '14px 32px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
            transition: 'all 0.2s',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
}
