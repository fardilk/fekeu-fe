import React, { forwardRef } from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ label, className = '', ...props }, ref) => (
  <label className="inline-flex items-center space-x-2 text-sm">
    <input ref={ref} type="checkbox" className={`h-4 w-4 ${className}`} {...props} />
    {label && <span>{label}</span>}
  </label>
));

Checkbox.displayName = 'Checkbox';
