import React from "react";


interface CertificateCardProps {
  productName?: string;
  serialNumber?: string;
  date?: string;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  productName = "LegeCy Chronograph",
  serialNumber = "LGC-2025-8842",
  date = "Dec 20, 2025",
}) => {
  return (
    <div className="certificate-card">
      <div className="cert-border">
        <div className="cert-content">
          <div className="cert-header">
            <h4 className="cert-title">Certificate of Authenticity</h4>
            <div className="cert-logo">LGC</div>
          </div>
          
          <div className="cert-body">
            <p className="cert-text">
              This document certifies that the <strong>{productName}</strong> is an authentic LegeCy Timepiece, 
              crafted with precision and verified for excellence.
            </p>
            
            <div className="cert-details">
              <div className="cert-row">
                <span className="cert-label">Serial Number</span>
                <span className="cert-value">{serialNumber}</span>
              </div>
              <div className="cert-row">
                <span className="cert-label">Date of Issue</span>
                <span className="cert-value">{date}</span>
              </div>
              <div className="cert-row">
                <span className="cert-label">Warranty</span>
                <span className="cert-value">5 Years International</span>
              </div>
            </div>
          </div>
          
          <div className="cert-footer">
            <div className="signature-line">
              <span className="signature">Alexander LegeCy</span>
              <span className="signature-label">Master Watchmaker</span>
            </div>
            <button className="download-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download PDF
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .certificate-card {
          background: #fdfbf7;
          padding: 24px;
          border-radius: var(--radius);
          box-shadow: 0 10px 40px rgba(0,0,0,0.08); /* Soft shadow */
          max-width: 600px;
          margin: 0 auto;
          position: relative;
        }
        .cert-border {
          border: 2px solid var(--accent);
          padding: 32px;
          position: relative;
        }
        .cert-border::before {
          content: '';
          position: absolute;
          inset: 4px;
          border: 1px solid rgba(212, 175, 55, 0.3);
        }
        
        .cert-header {
          text-align: center;
          margin-bottom: 32px;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          padding-bottom: 24px;
        }
        .cert-title {
          font-family: var(--font-heading);
          font-size: 24px;
          color: var(--primary);
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .cert-logo {
          width: 48px;
          height: 48px;
          background: var(--primary);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          border-radius: 50%;
          margin: 16px auto 0;
          font-family: var(--font-heading);
          border: 1px solid var(--accent);
        }
        
        .cert-text {
          text-align: center;
          font-size: 16px;
          color: var(--text-muted-light);
          line-height: 1.8;
          margin-bottom: 32px;
          font-style: italic;
        }
        .cert-text strong {
          color: var(--text);
          font-style: normal;
          font-weight: 600;
        }
        
        .cert-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }
        .cert-row {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .cert-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-muted);
          margin-bottom: 4px;
        }
        .cert-value {
          font-family: monospace;
          color: var(--primary);
          font-weight: 600;
        }
        
        .cert-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .signature-line {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .signature {
          font-family: 'Great Vibes', cursive; /* Fallback will be used if not loaded, that's fine */
          font-size: 24px;
          color: var(--primary);
          margin-bottom: 4px;
        }
        .signature-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-top: 1px solid var(--border);
          padding-top: 4px;
          width: 100%;
        }
        
        .download-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: 1px solid var(--border);
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .download-btn:hover {
          background: var(--bg-dark);
          color: #fff;
          border-color: var(--bg-dark);
        }
        
        @media (max-width: 600px) {
          .cert-details {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .cert-footer {
            flex-direction: column;
            align-items: center;
            gap: 24px;
          }
          .signature-line {
            align-items: center;
            width: 100%;
          }
          .signature-label {
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};
