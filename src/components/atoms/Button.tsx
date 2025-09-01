import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' };

export const Button: React.FC<Props> = ({ variant = 'primary', children, ...rest }) => {
  const base = 'px-4 py-2 rounded font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed';
  const styles = variant === 'primary'
    ? 'bg-teal-600 hover:bg-teal-700 text-white'
    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900';
  return (
    <button className={`${base} ${styles}`} {...rest}>
      {children}
    </button>
  );
};
