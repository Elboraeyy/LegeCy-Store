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
    title: "Product Care Guide",
    content: "Keep your accessories in excellent condition. Clean regularly with appropriate materials. Store properly when not in use. Avoid exposure to extreme temperatures and moisture.",
  },
  {
    id: "strap",
    title: "Size & Fit Guide",
    content: "Leather goods will naturally conform to your use over time. For watches and bracelets, we recommend visiting our store for size adjustments, or using the provided adjustment tools where applicable.",
  },
  {
    id: "warranty",
    title: "Product Warranty",
    content: "Your LegaCy purchase is protected against manufacturing defects. This covers materials and craftsmanship. External wear and tear or accidental damage is not covered.",
  },
  {
    id: "service",
    title: "Service & Repairs",
    content: "We offer professional maintenance and repair services for all our products. Contact us for assessment and service options.",
  },
];

export const HelpCenter = () => {
  const [activeId, setActiveId] = useState<string | null>("care");

  return (
    <section className="help-section">
      <div className="help-header">
        <h3 className="help-title">Client Support & Education</h3>
        <p className="help-subtitle">Expert guidance for your accessory care</p>
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
            <span className="video-label">Watch: How to care for your Legacy products</span>
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
