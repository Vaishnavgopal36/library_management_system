import React from 'react';
import styles from './Skeleton.module.css';

// By extending React.HTMLAttributes, we tell TypeScript it's okay to accept 'style'
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  style, // Pull the style prop out
  ...props // Spread any remaining props (like aria-hidden)
}) => {
  const skeletonClasses = [
    styles.skeleton,
    styles[variant],
    className
  ].filter(Boolean).join(' ');

  // Merge any custom styles passed in with our width/height calculations
  const combinedStyle = {
    width: width ?? (variant === 'text' ? '100%' : undefined),
    height: height,
    ...style, 
  };

  return <div className={skeletonClasses} style={combinedStyle} aria-hidden="true" {...props} />;
};