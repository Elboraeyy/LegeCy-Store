import React from 'react';

interface RatingStarsProps {
  rating: number; // 0 to 5
  size?: number;
  color?: string;
  showText?: boolean;
}

export default function RatingStars({ 
  rating, 
  size = 16, 
  color = '#d4af37',
  showText = false 
}: RatingStarsProps) {
  


  /* 
     Note: Simple unicode stars for frontend-only constraints. 
     Ideally SVG icons would be used for "half" stars more precisely, 
     but unicode is reliable and lightweight for this requirement.
     To make filled vs empty visually distinct we use opacity or different characters.
     Here '☆' is empty star, '★' is filled.
  */

  return (
    <div className="rating-stars" style={{ display: 'inline-flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
           <svg 
             key={i}
             width={size} 
             height={size} 
             viewBox="0 0 24 24" 
             fill={i < rating ? color : "none"} 
             stroke={i < rating ? color : "currentColor"}
             strokeWidth="2"
             style={{ opacity: i < rating ? 1 : 0.3 }}
           >
             <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
           </svg>
        ))}
      </div>
      {showText && (
        <span style={{ marginLeft: 8, fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
