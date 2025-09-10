import React, { useMemo, useState, useEffect, useCallback } from 'react';
import ViewSwitcher from '../atoms/ViewSwitcher';
import { getCatatanList } from '../../lib/api/keuangan';
import { useAuthStore } from '../../store/authStore';


type Props = {
  startDate?: string;
  endDate?: string;
  variant?: 'default' | 'soft' | 'solid';
};

export const DaftarPembayaran: React.FC<Props> = ({ startDate, endDate, variant = 'default' }) => {
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(s => s.token);

  const load = useCallback(async () => {
    if (!token) return; // guard – ProtectedRoute should ensure token exists
    setLoading(true); setError(null);
    try {
      const data = await getCatatanList();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const months = useMemo(() => {
    const mset = new Set<string>();
    const pickDate = (r: any): string | null => {
      // API may return Date, created_at, createdAt, date, or tanggal
      const d = r?.Date ?? r?.created_at ?? r?.createdAt ?? r?.date ?? r?.tanggal ?? null;
      return d ? String(d) : null;
    };
    rows.forEach(r => { const ds = pickDate(r); if (ds) mset.add(ds.slice(0,7)); });
    return Array.from(mset).sort().reverse();
  }, [rows]);

  const filtered = useMemo(() => {
  const getDateStr = (it: any) => String(it?.Date ?? it?.created_at ?? it?.createdAt ?? it?.date ?? it?.tanggal ?? '');
    return rows
      .filter(it => {
        const ds = getDateStr(it);
        if (filterMonth) return ds && ds.startsWith(filterMonth);
        if (startDate || endDate) {
          const d = ds ? new Date(ds) : null;
          if (startDate && d && d < new Date(startDate)) return false;
          if (endDate && d && d > new Date(endDate)) return false;
        }
        return true;
      })
      .sort((a,b)=> getDateStr(b).localeCompare(getDateStr(a)));
  }, [rows, filterMonth, startDate, endDate]);

  // use a soft teal background for the 'solid' variant (not black) and darker teal text for readability
  // use a stronger drop shadow for the solid variant to make it pop
  const containerClass = variant === 'solid' ? 'p-4 bg-teal-50 rounded shadow-lg' : variant === 'soft' ? 'p-4 bg-slate-50 rounded shadow-md' : 'p-4 bg-white rounded shadow-md';
  const textClass = variant === 'solid' ? 'text-teal-900' : 'text-slate-800';

  const fmtRupiah = (n?: number) => {
    const v = Number(n ?? 0);
    return 'IDR. ' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
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

  const displayDate = (iso?: string) => {
  // Keep the human-friendly Indonesian date (weekday + dd-mm-yyyy) so tests
  // and UIs that expect the dd-mm-yyyy fragment still find it.
  return fmtDateIndo(iso);
  };

  const toIsoDate = (iso?: string) => {
    if (!iso) return '-';
    try {
      return new Date(iso).toISOString().slice(0, 10);
    } catch (_) {
      return String(iso).slice(0, 10);
    }
  };

  const getAmount = (it: any): number => Number(it?.nominal ?? it?.amount ?? it?.Amount ?? 0);
  const getDate = (it: any): string => String(it?.Date ?? it?.created_at ?? it?.createdAt ?? it?.date ?? it?.tanggal ?? '');

  const tealShadowStyle: React.CSSProperties = { boxShadow: '0 18px 60px rgba(20,184,166,0.18)', backdropFilter: 'blur(6px)' };

  return (
    <div className={containerClass} style={variant === 'solid' ? tealShadowStyle : undefined}>
      <div className="flex items-center justify-between mb-3">
        <div className={`text-sm ${variant === 'solid' ? 'text-teal-700' : 'text-slate-500'}`}>Daftar Pembayaran</div>
        <div className="flex items-center gap-2">
          <ViewSwitcher
            options={[{ value: '', label: 'Semua Bulan' }, ...months.map(m => ({ value: m, label: m }))]}
            value={filterMonth}
            onChange={(v: string) => setFilterMonth(v)}
            variant={variant === 'solid' ? 'solid' : 'default'}
          />
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className={`text-xs px-2 py-1 rounded border ${loading ? 'opacity-50' : 'hover:bg-teal-50'} ${variant === 'solid' ? 'border-teal-300 text-teal-700' : 'border-slate-300 text-slate-600'}`}
          >{loading ? 'Memuat...' : 'Refresh'}</button>
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
            {error && (
              <tr><td colSpan={2} className="p-3 text-red-600 text-xs">{error}</td></tr>
            )}
            {!error && loading && (
              <tr><td colSpan={2} className="p-3 text-xs text-slate-500">Memuat data...</td></tr>
            )}
            {!error && !loading && filtered.length === 0 && (
              <tr><td colSpan={2} className={`p-3 ${variant === 'solid' ? 'text-teal-700' : 'text-slate-500'}`}>Tidak ada data</td></tr>
            )}
            {!error && filtered.map((it, idx) => {
              const kId = it?.id ?? it?.ID ?? 'noid';
              const dStr = getDate(it);
              const amt = getAmount(it);
              return (
                <tr key={`${kId}-${dStr}-${idx}`} className="border-t">
                  <td className="p-2 align-top">
                    <div>{displayDate(dStr)}</div>
                    <div className="text-[11px] text-slate-400 mt-1 font-mono">{toIsoDate(dStr)}</div>
                  </td>
                  <td className="p-2 text-right">{fmtRupiah(amt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DaftarPembayaran;
