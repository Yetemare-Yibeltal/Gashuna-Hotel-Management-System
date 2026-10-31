import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatETB } from '../../lib/utils';

interface PaymentChartProps {
  data: Array<{ _id: string; count: number; total: number }>;
  height?: number;
}

const COLORS = ['#c9a96e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-xl p-3 shadow-2xl">
        <p className="text-sm font-semibold text-white mb-1 capitalize">{payload[0]?.name}</p>
        <p className="text-xs text-amber-400">{formatETB(payload[0]?.value)}</p>
        <p className="text-xs text-white/40">{payload[0]?.payload?.count} transactions</p>
      </div>
    );
  }
  return null;
};

export default function PaymentChart({ data, height = 280 }: PaymentChartProps) {
  const chartData = data.map((d) => ({
    name: d._id?.replace(/_/g, ' ') || 'Unknown',
    value: d.total,
    count: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} fillOpacity={0.85} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-xs text-white/60 capitalize">{value}</span>}
          iconType="circle"
          iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
