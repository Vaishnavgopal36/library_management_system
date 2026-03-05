import React from 'react';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  interactive = false,
  padding = 'md',
  className = '',
  children,
  ...props
}) => {
  const cardClasses = [
    styles.card,
    interactive ? styles.interactive : '',
    styles[`padding-${padding}`],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};