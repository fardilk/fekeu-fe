import React from 'react';

type Option = { value: string; label?: string };

type Props = {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  variant?: 'default' | 'solid';
};

export const ViewSwitcher: React.FC<Props> = ({ options, value, onChange, className, variant = 'default' }) => {
  // add a subtle drop shadow so switchers visually pop; for solid variant use teal blurry shadow
  const base = `rounded p-1 text-sm border shadow-sm focus:shadow-md ${variant === 'solid' ? 'border-teal-200 bg-white text-teal-900' : 'border-slate-200'}`;
  const tealShadow = { boxShadow: '0 12px 40px rgba(20,184,166,0.18)', backdropFilter: 'blur(6px)' } as React.CSSProperties;
  const style = variant === 'solid' ? tealShadow : undefined;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${base} ${className ?? ''}`}
      style={style}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label ?? o.value}</option>
      ))}
    </select>
  );
};

export default ViewSwitcher;
