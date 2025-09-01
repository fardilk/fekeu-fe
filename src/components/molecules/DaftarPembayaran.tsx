import React, { useMemo, useState } from 'react';
import ViewSwitcher from '../atoms/ViewSwitcher';


type Props = {
  startDate?: string;
  endDate?: string;
  variant?: 'default' | 'soft' | 'solid';
};

export const DaftarPembayaran: React.FC<Props> = ({ startDate, endDate, variant = 'default' }) => {
  const [filterMonth, setFilterMonth] = useState<string>('');

  const mockRows = useMemo(() => ([
    { id: 1, created_at: '2025-08-28T12:34:00', kategori: 'Invoice A', nominal: 120000 },
    { id: 2, created_at: '2025-08-27T09:20:00', kategori: 'Invoice B', nominal: 55000 },
    { id: 3, created_at: '2025-08-25T15:10:00', kategori: 'Receipt C', nominal: 75000 },
  ]), []);

  const months = useMemo(() => ['2025-08', '2025-07'], []);

  const filtered = useMemo(() => {
    if (!mockRows) return [] as any[];
    return mockRows.filter(it => {
      if (filterMonth) return it.created_at && it.created_at.startsWith(filterMonth);
      if (startDate || endDate) {
        const d = it.created_at ? new Date(it.created_at) : null;
        if (startDate && d && d < new Date(startDate)) return false;
        if (endDate && d && d > new Date(endDate)) return false;
      }
      return true;
    }).sort((a,b)=> (b.created_at||'').localeCompare(a.created_at||''));
  }, [mockRows, filterMonth, startDate, endDate]);

  // use a soft teal background for the 'solid' variant (not black) and darker teal text for readability
  // use a stronger drop shadow for the solid variant to make it pop
  const containerClass = variant === 'solid' ? 'p-4 bg-teal-50 rounded shadow-lg' : variant === 'soft' ? 'p-4 bg-slate-50 rounded shadow-md' : 'p-4 bg-white rounded shadow-md';
  const textClass = variant === 'solid' ? 'text-teal-900' : 'text-slate-800';

  const fmtRupiah = (n?: number) => {
    const v = Number(n ?? 0);
    return 'R. ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  };

  const fmtDateIndo = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    try {
      const weekday = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(d);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${weekday}, ${day}-${month}-${year}`;
    } catch (e) {
      return iso.slice(0, 10).replace(/-/g, '-');
    }
  };

  const tealShadowStyle: React.CSSProperties = { boxShadow: '0 18px 60px rgba(20,184,166,0.18)', backdropFilter: 'blur(6px)' };

  return (
    <div className={containerClass} style={variant === 'solid' ? tealShadowStyle : undefined}>
      <div className="flex items-center justify-between mb-3">
        <div className={`text-sm ${variant === 'solid' ? 'text-teal-700' : 'text-slate-500'}`}>Daftar Pembayaran</div>
        <div className="flex items-center gap-2">
          {/* ViewSwitcher used as month filter here for reuse */}
          <ViewSwitcher
            options={[{ value: '', label: 'Filter by month' }, ...months.map(m => ({ value: m, label: m }))]}
            value={filterMonth}
            onChange={(v: string) => setFilterMonth(v)}
            variant={variant === 'solid' ? 'solid' : 'default'}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${textClass}`}>
          <thead>
            <tr className={`text-left text-xs ${variant === 'solid' ? 'text-teal-700' : 'text-slate-500'}`}>
              <th className="p-2">Tanggal</th>
              <th className="p-2 text-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={2} className={`p-3 ${variant === 'solid' ? 'text-teal-700' : 'text-slate-500'}`}>No records</td></tr>}
            {filtered.map(it => (
              <tr key={it.id} className="border-t">
                <td className="p-2 align-top">{fmtDateIndo(it.created_at)}</td>
                <td className="p-2 text-right">{fmtRupiah(it.nominal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DaftarPembayaran;
