import React from 'react';

export const FileInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string }>(
  ({ label = 'Upload', ...props }, ref) => (
    <label className="block">
      <span className="text-sm font-medium mb-1 block">{label}</span>
      <input ref={ref} type="file" className="w-full" {...props} />
    </label>
  )
);
FileInput.displayName = 'FileInput';
