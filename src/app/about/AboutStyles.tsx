"use strict";
'use client';

export default function AboutStyles() {
  return (
    <style jsx global>{`
      @media (max-width: 768px) {
        .about-container { padding-bottom: 40px !important; }
        
        /* Hero Compact */
        .shop-hero { padding: 40px 0 30px !important; min-height: auto !important; }
        .shop-hero h1 { font-size: 26px !important; margin-bottom: 8px !important; }
        .shop-hero p { font-size: 13px !important; max-width: 90%; margin: 0 auto; }
        
        /* Story Section Density */
        .detail-split { gap: 24px !important; }
        .detail-title-large { font-size: 22px !important; margin-bottom: 12px !important; text-align: center; }
        .detail-desc { font-size: 12px !important; line-height: 1.5 !important; margin-bottom: 12px !important; text-align: justify; }
        
        .main-image-wrapper { 
          margin-right: 0 !important; 
          margin-left: 0 !important;
          margin-bottom: 20px; 
          height: 180px !important; 
          width: 100% !important;
          border-radius: 8px;
          overflow: hidden;
        }
        
        /* Features Grid - 3 Columns Side-by-Side */
        .about-features-grid {
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 8px !important;
          margin-top: 30px !important;
        }

        /* Compact styling for side-by-side layout */
        .specs-list {
          padding: 12px 4px !important;
          height: 100% !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-start !important;
          border-radius: 8px !important;
        }
        
        .specs-list h3 {
          font-size: 11px !important;
          line-height: 1.2 !important;
          margin-bottom: 6px !important;
          min-height: 28px; /* Align titles */
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .specs-list p {
          font-size: 9px !important;
          line-height: 1.3 !important;
          display: block !important;
          color: var(--text-muted) !important;
        }
        
        /* Team Section Density */
        .team-section-header { margin-bottom: 24px !important; }
        .team-section-header h2 { font-size: 22px !important; margin-bottom: 6px !important; }
        .team-section-header p { font-size: 11px !important; line-height: 1.4 !important; }
        
        /* Team Grid - 3 Columns for maximum density */
        .about-team-grid {
          grid-template-columns: repeat(3, 1fr) !important;
          gap: 8px !important;
        }
        
        .about-team-card {
          padding: 10px 4px !important;
          border-radius: 8px !important;
        }
        
        .about-team-avatar {
          width: 48px !important;
          height: 48px !important;
          margin-bottom: 6px !important;
          border-width: 2px !important;
        }
        
        .about-team-name { 
          font-size: 10px !important; 
          margin-bottom: 2px !important; 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis;
          font-weight: 700 !important;
        }
        
        .about-team-role { 
          font-size: 7px !important; 
          letter-spacing: 0px !important; 
          margin-bottom: 4px !important;
          opacity: 0.8;
        }
        
        .about-team-handle { 
          font-size: 8px !important; 
          gap: 2px !important;
        }
        
        .about-team-handle svg { 
          width: 8px !important; 
          height: 8px !important; 
        }
      }
    `}</style>
  );
}
