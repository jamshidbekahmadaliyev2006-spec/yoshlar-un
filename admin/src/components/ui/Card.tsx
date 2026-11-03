import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  lift?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, lift, className = '', ...props }) => {
  return (
    <div className={`card ${lift ? 'lift' : ''} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
};

