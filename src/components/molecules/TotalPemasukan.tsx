import React from 'react';

type Props = {
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  variant?: 'default' | 'soft' | 'solid';
};

export const TotalPemasukan: React.FC<Props> = ({ startDate, endDate, variant = 'default' }) => {
  // Mock total for mockup/demo purposes
  const total = 12345000;

  const fmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  // use a fixed height ~8rem (8em) so the card fits larger content
  const containerClass = variant === 'solid'
    ? 'h-32 px-4 py-4 bg-teal-600 rounded shadow-lg flex items-center'
    : variant === 'soft'
      ? 'h-32 px-4 py-4 bg-indigo-50 rounded shadow-md flex items-center'
      : 'h-32 px-4 py-4 bg-white rounded shadow-md flex items-center';

  const titleClassSolid = variant === 'solid' ? 'text-sm text-teal-100' : 'text-sm text-slate-500';
  const valueClass = variant === 'solid' ? 'text-2xl font-semibold text-white' : 'text-2xl font-semibold';

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between">
        <div>
          <div className={titleClassSolid}>Total Pemasukan</div>
          <div className={valueClass}>{fmt.format(total)}</div>
        </div>
      </div>
    </div>
  );
};

export default TotalPemasukan;
