"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface AnalyticsChartsProps {
  salesTrend: { date: string; value: number }[];
  ordersByStatus: { status: string; count: number }[];
}

export default function AnalyticsCharts({ salesTrend, ordersByStatus }: AnalyticsChartsProps) {
  // Data is passed from server component
  const data = {
      revenue: salesTrend.map(d => ({ date: d.date, amount: d.value })),
      status: ordersByStatus.map(d => ({ name: d.status, value: d.count })),
      topProducts: [] // Top products handled purely by server page list now, or pass if needed.
      // Based on page.tsx, top products are rendered in a separate card in page.tsx, 
      // but AnalyticsCharts *also* had a top products chart. 
      // page.tsx passes salesTrend and ordersByStatus. It does NOT pass topProducts to this component on line 74.
      // So I will remove the Top Products chart from this component or require it to be passed.
      // Looking at page.tsx line 74: <AnalyticsCharts salesTrend={...} ordersByStatus={...} />
      // So I will remove Top Products from here to avoid errors, or add it to optional props.
  };

  if (!salesTrend || !ordersByStatus) return null;

  const COLORS = ['#1a3c34', '#d4af37', '#b91c1c', '#0088FE', '#00C49F'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      
      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Trends (Last 30 Days)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.revenue}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1a3c34" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#1a3c34" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#999" />
              <YAxis tick={{fontSize: 12}} stroke="#999" tickFormatter={(value) => `EGP ${value}`} />
              <Tooltip 
                formatter={(value: number | undefined) => [`EGP ${(value || 0).toLocaleString()}`, 'Revenue']}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="amount" stroke="#1a3c34" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Order Status Distribution</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.status}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {data.status.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>



    </div>
  );
}
