import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { formatETB } from '../../lib/utils';

interface RevenueChartProps {
  data: Array<{
    _id: { month: number; year: number };
    totalRevenue: number;
    invoiceCount: number;
  }>;
  height?: number;
}

const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-xl p-3 shadow-2xl">
        <p className="text-xs text-white/50 mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: {p.name === 'Revenue' ? formatETB(p.value) : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function RevenueChart({ data, height = 280 }: RevenueChartProps) {
  const chartData = data.map((d) => ({
    month: `${monthNames[d._id?.month]} ${d._id?.year}`,
    Revenue: d.totalRevenue,
    Invoices: d.invoiceCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#c9a96e" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#c9a96e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="month"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="Revenue"
          stroke="#c9a96e"
          strokeWidth={2}
          fill="url(#revenueGradient)"
          dot={{ fill: '#c9a96e', r: 3 }}
          activeDot={{ r: 5, fill: '#e8d5a3' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
