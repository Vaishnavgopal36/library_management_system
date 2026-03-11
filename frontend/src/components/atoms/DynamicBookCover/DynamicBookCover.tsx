import React from 'react';

export interface DynamicBookCoverProps {
  title: string;
  author: string;
  width?: string;
  height?: string;
  
  showText?: boolean;
}

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const GRADIENT_PALETTES = [
  'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)', // Soft Pink
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', // Purple/Pink
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', // Mint/Blue
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)', // Orange/Purple
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', // Lavender
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Deep Blue
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Vibrant Green
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Coral/Yellow
];

export const DynamicBookCover: React.FC<DynamicBookCoverProps> = ({ 
  title, 
  author, 
  width = '140px', 
  height = '200px',
  showText = true,
}) => {
  const gradientIndex = hashString(title) % GRADIENT_PALETTES.length;
  const background = GRADIENT_PALETTES[gradientIndex];

  return (
    <div style={{
      width,
      height,
      background,
      borderRadius: '8px',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      color: 'var(--color-text-primary)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative spine line */}
      <div style={{ position: 'absolute', left: '10px', top: 0, bottom: 0, width: '2px', backgroundColor: 'rgba(255,255,255,0.4)' }} />
      
      {showText && (
        <div style={{ paddingLeft: '8px' }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '0.95rem', 
            fontWeight: 800, 
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}>
            {title}
          </h3>
        </div>
      )}

      {showText && (
        <div style={{ paddingLeft: '8px' }}>
          <p style={{ 
            margin: 0, 
            fontSize: '0.7rem', 
            fontWeight: 600, 
            opacity: 0.8,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {author}
          </p>
        </div>
      )}
    </div>
  );
};