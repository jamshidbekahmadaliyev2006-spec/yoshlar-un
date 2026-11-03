import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'icon';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  icon,
  className = '',
  ...props
}) => {
  const cls = variant === 'icon' ? 'ib' : variant === 'secondary' ? 'bt g' : 'bt';
  return (
    <button className={`${cls} ${className}`.trim()} {...props}>
      {icon}
      {children}
    </button>
  );
};

