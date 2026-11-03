import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  requiredMark?: boolean;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  requiredMark,
  error,
  id,
  className = '',
  ...props
}) => {
  return (
    <div>
      {label && (
        <label className="lb" htmlFor={id}>
          {label} {requiredMark && <span className="rq">*</span>}
        </label>
      )}
      <input id={id} className={`in ${className}`.trim()} {...props} />
      {error && <div className="er">{error}</div>}
    </div>
  );
};

