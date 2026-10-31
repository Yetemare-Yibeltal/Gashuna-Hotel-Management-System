import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OccupancyChartProps {
  data: Array<{
    _id: { month: number; year: number };
    occupancyRate: number;
    totalBookings: number;
  }>;
  height?: number;
}

const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-white/10 rounded-xl p-3 shadow-2xl">
        <p className="text-xs text-white/50 mb-1">{label}</p>
        <p className="text-sm font-semibold text-amber-400">
          Occupancy: {Number(payload[0]?.value).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

export default function OccupancyChart({ data, height = 280 }: OccupancyChartProps) {
  const chartData = data.map((d) => ({
    month: monthNames[d._id?.month],
    Occupancy: d.occupancyRate,
    Bookings: d.totalBookings,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="month"
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="Occupancy" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={
                entry.Occupancy >= 80 ? '#10b981' :
                entry.Occupancy >= 60 ? '#c9a96e' :
                entry.Occupancy >= 40 ? '#f59e0b' : '#ef4444'
              }
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
