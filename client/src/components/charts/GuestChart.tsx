import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GuestChartProps {
  data: Array<{ _id: string; count: number; avgSpend: number }>;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-xl p-3 shadow-2xl">
        <p className="text-xs text-white/50 mb-1">{label}</p>
        <p className="text-sm font-semibold text-emerald-400">{payload[0]?.value} guests</p>
      </div>
    );
  }
  return null;
};

export default function GuestChart({ data, height = 280 }: GuestChartProps) {
  const chartData = data.slice(0, 8).map((d) => ({
    nationality: d._id || 'Unknown',
    Guests: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="nationality"
          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="Guests" fill="#10b981" fillOpacity={0.8} radius={[0, 4, 4, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
