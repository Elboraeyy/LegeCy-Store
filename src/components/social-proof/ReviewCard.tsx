import Image from 'next/image';
import RatingStars from './RatingStars';

interface ReviewCardProps {
  name: string;
  rating: number;
  text: string;
  date?: string;
  images?: string[];
}

export default function ReviewCard({ name, rating, text, date, images }: ReviewCardProps) {
  return (
    <div className="review-card" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      height: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{name}</h4>
        {date && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{date}</span>}
      </div>
      <RatingStars rating={rating} size={14} />
      <p style={{ 
        margin: 0, 
        fontSize: '14px', 
        lineHeight: '1.6', 
        color: 'var(--text-muted)'
      }}>
        &quot;{text}&quot;
      </p>

      {images && images.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
          {images.map((url, idx) => (
            <div key={idx} style={{
              position: 'relative',
              width: '48px',
              height: '48px',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }}>
              <Image
                src={url}
                alt={`Review by ${name}`}
                fill
                style={{ objectFit: 'cover' }}
                sizes="48px"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
