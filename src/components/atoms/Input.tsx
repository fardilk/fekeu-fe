import React, { forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input ref={ref} className={`border px-3 py-2 rounded w-full ${className}`} {...props} />
  )
);
Input.displayName = 'Input';

export const UsernameInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
>(({ label = 'Username / Email', className = '', ...props }, ref) => (
  <label className="block">
    <span className="text-sm font-medium mb-1 block">{label}</span>
    <Input ref={ref} name="username" type="text" placeholder="you@example.com" className={className} {...props} />
  </label>
));
UsernameInput.displayName = 'UsernameInput';

export const PasswordInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { label?: string }
>(({ label = 'Password', className = '', ...props }, ref) => (
  <label className="block">
    <span className="text-sm font-medium mb-1 block">{label}</span>
    <Input ref={ref} name="password" type="password" placeholder="Enter password" className={className} {...props} />
  </label>
));
PasswordInput.displayName = 'PasswordInput';

export default Input;
