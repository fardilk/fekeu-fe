import React from 'react';
import { useCatatan } from '../../hooks/useCatatan';

type Props = {
  startDate?: string; // ISO date (not yet used)
  endDate?: string; // ISO date (not yet used)
  variant?: 'default' | 'soft' | 'solid';
};

export const TotalPemasukan: React.FC<Props> = ({ startDate, endDate, variant = 'default' }) => {
  const items = useCatatan();

  // Sum flexibly: backend may return Amount, amount, or nominal
  const total = (items || []).reduce((acc, it: any) => {
    const val = (it && (it.Amount ?? it.amount ?? it.nominal ?? 0)) || 0;
    return acc + Number(val || 0);
  }, 0);

  const fmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

  // use a fixed height ~8rem so the card fits larger content
  const containerClass = variant === 'solid'
    ? 'h-32 px-4 py-4 bg-teal-600 rounded shadow-lg flex items-center'
    : variant === 'soft'
      ? 'h-32 px-4 py-4 bg-indigo-50 rounded shadow-md flex items-center'
      : 'h-32 px-4 py-4 bg-white rounded shadow-md flex items-center';

  const titleClassSolid = variant === 'solid' ? 'text-sm text-teal-100' : 'text-sm text-slate-500';
  const valueClass = variant === 'solid' ? 'text-2xl font-semibold text-white' : 'text-2xl font-semibold';

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between w-full">
        <div>
          <div className={titleClassSolid}>Total Pemasukan</div>
          <div className={valueClass}>{items ? fmt.format(total) : 'Loading...'}</div>
        </div>
        {/* optional small info */}
        <div className="text-xs text-slate-400 hidden sm:block">{items ? `${items.length} item(s)` : ''}</div>
      </div>
    </div>
  );
};

export default TotalPemasukan;

