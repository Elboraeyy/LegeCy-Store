import React, { useState } from "react";


interface HelpTopic {
  id: string;
  title: string;
  content: string;
  icon?: string;
}

const topics: HelpTopic[] = [
  {
    id: "care",
    title: "Watch Care Guide",
    content: "Clean your timepiece regularly with a soft cloth. Avoid exposure to strong magnetic fields and temperature shocks. For water resistance, ensure the crown is fully screwed down before contact with water.",
  },
  {
    id: "strap",
    title: "Strap Adjustment",
    content: "Leather straps will naturally conform to your wrist over time. For metal bracelets, we recommend visiting a certified boutique for link adjustment, or using the provided tool for micro-adjustments on the clasp.",
  },
  {
    id: "warranty",
    title: "5-Year Warranty",
    content: "Your Legacy timepiece is protected against manufacturing defects for 5 years. This covers the movement, hands, and dial. External wear and tear or accidental damage is not covered.",
  },
  {
    id: "service",
    title: "Service Intervals",
    content: "We recommend a full service every 3-5 years to ensure optimal performance. Our master watchmakers will disassemble, clean, lubricate, and calibrate your movement.",
  },
];

export const HelpCenter = () => {
  const [activeId, setActiveId] = useState<string | null>("care");

  return (
    <section className="help-section">
      <div className="help-header">
        <h3 className="help-title">Client Support & Education</h3>
        <p className="help-subtitle">Expert guidance for your timepiece journey</p>
      </div>

      <div className="help-grid">
        <div className="help-visual">
          {/* Mock Video Placeholder */}
          <div className="video-mock">
            <div className="play-button">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" stroke="none">
                 <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
            <span className="video-label">Watch: How to care for your Legacy</span>
          </div>
        </div>

        <div className="help-topics">
          {topics.map((topic) => (
            <div 
              key={topic.id} 
              className={`topic-item ${activeId === topic.id ? "active" : ""}`}
            >
              <button 
                className="topic-btn"
                onClick={() => setActiveId(activeId === topic.id ? null : topic.id)}
              >
                <span className="topic-title">{topic.title}</span>
                <span className="topic-icon">
                  {activeId === topic.id ? "−" : "+"}
                </span>
              </button>
              <div 
                className="topic-content"
                style={{ 
                  maxHeight: activeId === topic.id ? "200px" : "0",
                  opacity: activeId === topic.id ? 1 : 0
                }}
              >
                <p>{topic.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .help-section {
          padding: 60px 0;
          background: var(--surface);
          border-top: 1px solid var(--border);
          margin-top: 80px;
        }
        .help-header {
          text-align: center;
          margin-bottom: 48px;
          max-width: 600px;
          margin-inline: auto;
        }
        .help-title {
          font-family: var(--font-heading);
          font-size: 32px;
          margin: 0 0 16px;
        }
        .help-subtitle {
          color: var(--text-muted);
          font-size: 16px;
        }
        
        .help-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          max-width: 1000px;
          margin: 0 auto;
          align-items: start;
        }
        
        .help-visual {
          position: sticky;
          top: 100px;
        }
        .video-mock {
          aspect-ratio: 16/9;
          background: linear-gradient(45deg, #12403C, #2a4f45);
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.3s ease;
          box-shadow: var(--shadow);
        }
        .video-mock:hover {
          transform: scale(1.02);
        }
        .play-button {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          border: 1px solid rgba(255,255,255,0.3);
        }
        .video-label {
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.5px;
        }
        
        .topic-item {
          border-bottom: 1px solid var(--border);
        }
        .topic-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 0;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          color: var(--text);
        }
        .topic-title {
          font-size: 16px;
          font-weight: 600;
          font-family: var(--font-heading);
        }
        .topic-icon {
          font-size: 20px;
          color: var(--accent);
          font-weight: 300;
        }
        .topic-content {
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .topic-content p {
          padding-bottom: 24px;
          margin: 0;
          color: var(--text-muted);
          line-height: 1.7;
          font-size: 15px;
        }
        
        @media (max-width: 768px) {
          .help-grid {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .help-visual {
            position: static;
          }
        }
      `}</style>
    </section>
  );
};
