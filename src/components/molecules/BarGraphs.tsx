import React, { useMemo, useState } from 'react';
import ViewSwitcher from '../atoms/ViewSwitcher';

type Granularity = 'daily' | 'weekly' | 'monthly';

type Props = {
  granularity?: Granularity;
  startDate?: string;
  endDate?: string;
  limit?: number; // number of bars to show
  variant?: 'default' | 'soft' | 'solid';
};

export const BarGraphs: React.FC<Props> = ({ granularity = 'monthly', startDate, endDate, limit = 10, variant = 'default' }) => {
  const [view, setView] = useState<'yearly' | 'monthly' | 'current'>(granularity === 'monthly' ? 'monthly' : 'yearly');

  // generate bars based on view and current date
  const bars = useMemo(() => {
    const now = new Date();
    if (view === 'yearly') {
      // last `limit` months ending with previous month (recent month)
      const arr = [] as { label: string; value: number; meta: string }[];
      for (let i = limit - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i - 1, 1); // previous months
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        arr.push({ label: monthLabel, value: Math.round(Math.random() * 15000), meta: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` });
      }
      return arr;
    }

    if (view === 'monthly') {
      // weeks in current month
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth()+1, 0);
      const weeks: { label: string; value: number; meta: string }[] = [];
      let weekStart = new Date(start);
      let safety = 0;
      const MAX_WEEKS = 64; // absolute cap to avoid infinite loops
      while (weekStart <= end && safety < MAX_WEEKS) {
        const weekEnd = new Date(Math.min(end.getTime(), new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()+6).getTime()));
        const label = `${weekStart.getDate()}-${weekEnd.getDate()}`;
        weeks.push({ label, value: Math.round(Math.random() * 5000), meta: `W ${label}` });
        weekStart = new Date(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate() + 1);
        safety++;
      }
      if (safety >= MAX_WEEKS) console.warn('BarGraphs: reached MAX_WEEKS safety cap while generating weekly buckets');
      return weeks.slice(0, limit);
    }

    // current -> last 10 days including today
    const days: { label: string; value: number; meta: string }[] = [];
    for (let i = limit - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      days.push({ label: d.toISOString().slice(0,10), value: Math.round(Math.random() * 3000), meta: d.toLocaleDateString() });
    }
    return days;
  }, [view, limit]);

  // horizontal bar graph layout: set a fixed height and display bars as vertical columns inside a scrollable row
  const containerClass = variant === 'solid' ? 'h-32 px-4 py-4 bg-teal-700 rounded shadow-md' : variant === 'soft' ? 'h-32 px-4 py-4 bg-indigo-50 rounded shadow-md' : 'h-32 px-4 py-4 bg-white rounded shadow-md';
  const labelClass = variant === 'solid' ? 'text-xs text-teal-100' : 'text-xs text-slate-500';
  const barColor = variant === 'solid' ? 'bg-teal-300' : 'bg-indigo-500';

  const max = Math.max(1, ...(bars.map(b=>b.value)));

  const tealShadowStyle: React.CSSProperties = { boxShadow: '0 18px 60px rgba(20,184,166,0.18)', backdropFilter: 'blur(6px)' };

  return (
    <div className={containerClass} style={variant === 'solid' ? tealShadowStyle : undefined}>
      <div className="flex items-center justify-between mb-3">
        <div className={labelClass}>Grafik Penerimaan</div>
        <div className="flex items-center gap-2">
          <ViewSwitcher
            options={[{ value: 'yearly', label: 'Yearly' }, { value: 'monthly', label: 'Monthly' }, { value: 'current', label: 'Current' }]}
            value={view}
            onChange={(v) => setView(v as any)}
            variant={variant === 'solid' ? 'solid' : 'default'}
          />
        </div>
      </div>
      <div className="h-full flex items-center">
        {bars.length === 0 && <div className="text-sm text-slate-500">No data</div>}
        {bars.length > 0 && (
          <div className="flex-1 overflow-x-auto">
            <div className="flex items-end h-20 gap-4 transform -translate-y-3">
              {bars.map((b) => (
                <div key={b.label} className="flex flex-col items-center" style={{ width: 48 }} title={`${b.meta} — R. ${b.value.toLocaleString()}`}>
                  <div className={`${barColor} rounded-t`} style={{ height: `${(b.value / max) * 100}%`, minHeight: 8, width: '100%' }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BarGraphs;
