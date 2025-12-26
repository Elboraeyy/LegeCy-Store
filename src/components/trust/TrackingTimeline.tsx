import React from "react";


interface TrackingTimelineProps {
  currentStage?: number; // 0: Confirmed, 1: Processing, 2: Shipped, 3: Delivered
  trackingId?: string;
  estimatedDelivery?: string;
}

const stages = [
  { label: "Confirmed", date: "Today" },
  { label: "Processing", date: "Today" },
  { label: "Shipped", date: "Pending" },
  { label: "Delivered", date: "Est. 3 Days" },
];

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  currentStage = 1,
  trackingId = "LEGCY-8842-XJ",
  estimatedDelivery = "Dec 24, 2025",
}) => {
  return (
    <div className="tracking-container">
      <div className="tracking-header">
        <div>
          <h3 className="tracking-title">Shipment Status</h3>
          <p className="tracking-id">Tracking ID: {trackingId}</p>
        </div>
        <div className="tracking-eta">
          <span>Estimated Delivery</span>
          <strong>{estimatedDelivery}</strong>
        </div>
      </div>

      <div className="timeline-wrapper">
        <div className="timeline-line">
          <div 
            className="timeline-progress" 
            style={{ width: `${(currentStage / (stages.length - 1)) * 100}%` }}
          ></div>
        </div>
        
        <div className="timeline-points">
          {stages.map((stage, index) => {
            const isCompleted = index <= currentStage;
            const isCurrent = index === currentStage;
            
            return (
              <div 
                key={index} 
                className={`timeline-point ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
              >
                <div className="point-marker">
                  {isCompleted && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <div className="point-info">
                  <span className="point-label">{stage.label}</span>
                  <span className="point-date">{stage.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <style jsx>{`
        .tracking-container {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 32px;
          margin-top: 32px;
        }
        .tracking-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          flex-wrap: wrap;
          gap: 20px;
        }
        .tracking-title {
          font-size: 20px;
          margin: 0 0 4px;
          font-family: var(--font-heading);
        }
        .tracking-id {
          color: var(--text-muted);
          font-size: 14px;
          margin: 0;
          font-family: monospace;
          letter-spacing: 1px;
        }
        .tracking-eta {
          text-align: right;
          background: var(--bg-dark);
          color: var(--text-on-dark);
          padding: 12px 20px;
          border-radius: var(--radius);
        }
        .tracking-eta span {
          display: block;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.8;
          margin-bottom: 4px;
        }
        .tracking-eta strong {
          display: block;
          font-size: 16px;
          font-weight: 600;
        }
        
        .timeline-wrapper {
          position: relative;
          padding: 0 20px;
        }
        .timeline-line {
          position: absolute;
          top: 14px;
          left: 40px;
          right: 40px;
          height: 2px;
          background: var(--border);
          z-index: 0;
        }
        .timeline-progress {
          height: 100%;
          background: var(--accent);
          transition: width 1s ease;
        }
        
        .timeline-points {
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }
        .timeline-point {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          width: 100px;
        }
        .point-marker {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--surface);
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          transition: all 0.3s ease;
          color: var(--surface);
        }
        .timeline-point.completed .point-marker {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
        }
        .timeline-point.current .point-marker {
          box-shadow: 0 0 0 4px rgba(212, 175, 55, 0.2);
        }
        
        .point-label {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
          color: var(--text);
        }
        .point-date {
          font-size: 12px;
          color: var(--text-muted);
        }
        .timeline-point:not(.completed) .point-label {
          color: var(--text-muted);
        }
        
        @media (max-width: 600px) {
          .timeline-wrapper {
            padding: 0;
            display: flex;
          }
          .timeline-line {
            top: 40px;
            bottom: 40px;
            left: 14px;
            right: auto;
            width: 2px;
            height: auto;
          }
          .timeline-progress {
            width: 100%;
             height: var(--progress-height, 33%); /* Dynamic based on stage */
          }
          .timeline-points {
            flex-direction: column;
            gap: 32px;
            width: 100%;
          }
          .timeline-point {
            flex-direction: row;
            align-items: center;
            width: 100%;
            text-align: left;
            gap: 16px;
          }
          .point-marker {
            margin-bottom: 0;
            flex-shrink: 0;
          }
          .point-info {
            display: flex;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
