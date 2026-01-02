"use client";

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, 
  ComposedChart, RadialBarChart, RadialBar, Line
} from 'recharts';

// ============================================
// Types
// ============================================

interface SalesTrendData {
  date: string;
  revenue: number;
  orders: number;
}

interface CategoryData {
  category: string;
  revenue: number;
  orders: number;
}

interface PaymentMethodData {
  method: string;
  revenue: number;
  count: number;
}

interface CityData {
  city: string;
  count: number;
  revenue: number;
}

interface HourlyData {
  hour: number;
  count: number;
}

interface CustomerGrowthData {
  date: string;
  newCustomers: number;
  totalCustomers: number;
}

interface OrderStatusData {
  status: string;
  count: number;
}

interface TopProductData {
  name: string;
  sold: number;
  revenue: number;
}

interface AnalyticsChartsProps {
  salesTrend: SalesTrendData[];
  ordersByStatus: OrderStatusData[];
}

// Color Palettes
const COLORS = {
  primary: '#12403C',
  gold: '#d4af37',
  green: '#166534',
  red: '#b91c1c',
  blue: '#1e40af',
  orange: '#ea580c',
  purple: '#7c3aed',
  teal: '#0d9488',
  pink: '#db2777',
  gray: '#6b7280'
};

const CHART_COLORS = [
  COLORS.primary, COLORS.gold, COLORS.green, COLORS.blue, 
  COLORS.orange, COLORS.purple, COLORS.teal, COLORS.pink
];

const PAYMENT_COLORS: Record<string, string> = {
  'cod': COLORS.primary,
  'paymob': COLORS.gold,
  'fawry': COLORS.orange,
  'cash': COLORS.green
};

const STATUS_COLORS: Record<string, string> = {
  'pending': COLORS.orange,
  'processing': COLORS.blue,
  'shipped': COLORS.purple,
  'delivered': COLORS.green,
  'cancelled': COLORS.red,
  'paid': COLORS.gold
};

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-EG', { 
    style: 'currency', 
    currency: 'EGP',
    maximumFractionDigits: 0 
  }).format(value);
};

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

// ============================================
// Main Export - Default Revenue Chart
// ============================================

export default function AnalyticsCharts({ 
  salesTrend, 
  ordersByStatus 
}: AnalyticsChartsProps) {
  if (!salesTrend || !ordersByStatus) return null;

  const revenueData = salesTrend.map(d => ({ 
    date: formatDate(d.date), 
    revenue: d.revenue,
    orders: d.orders 
  }));

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={revenueData}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15}/>
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11, fill: '#666' }} 
            axisLine={{ stroke: '#eee' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#666' }} 
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip 
            formatter={(value) => [formatCurrency(Number(value || 0)), 'Revenue']}
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              fontFamily: 'inherit'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="revenue" 
            stroke={COLORS.primary} 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================
// Revenue & Orders Combined Chart
// ============================================

export function RevenueOrdersChart({ data }: { data: SalesTrendData[] }) {
  if (!data?.length) return <EmptyState message="No data available" />;

  const chartData = data.map(d => ({
    date: formatDate(d.date),
    revenue: d.revenue,
    orders: d.orders
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={chartData}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15}/>
            <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
        <YAxis 
          yAxisId="left" 
          tick={{ fontSize: 10 }} 
          tickFormatter={formatCurrency}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          formatter={(value, name) => [
            name === 'revenue' ? formatCurrency(Number(value || 0)) : value,
            name === 'revenue' ? 'Revenue' : 'Orders'
          ]}
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}
        />
        <Legend />
        <Area 
          yAxisId="left"
          type="monotone" 
          dataKey="revenue" 
          stroke={COLORS.primary} 
          fill="url(#revenueGradient)"
          name="Revenue"
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="orders" 
          stroke={COLORS.gold} 
          strokeWidth={2}
          dot={{ fill: COLORS.gold, r: 3 }}
          name="Orders"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ============================================
// Category Revenue Chart (Donut)
// ============================================

export function CategoryRevenueChart({ data }: { data: CategoryData[] }) {
  if (!data?.length) return <EmptyState message="No categories" />;

  const chartData = data.map((d, i) => ({
    ...d,
    fill: CHART_COLORS[i % CHART_COLORS.length]
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="revenue"
          nameKey="category"
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.fill} 
              stroke="none"
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [formatCurrency(Number(value || 0)), 'Revenue']}
          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ============================================
// Payment Method Chart (Bar)
// ============================================

export function PaymentMethodChart({ data }: { data: PaymentMethodData[] }) {
  if (!data?.length) return <EmptyState message="No data available" />;

  const methodLabels: Record<string, string> = {
    'cod': 'Cash on Delivery',
    'paymob': 'PayMob',
    'fawry': 'Fawry',
    'cash': 'Cash'
  };

  const chartData = data.map(d => ({
    ...d,
    name: methodLabels[d.method] || d.method
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
        <YAxis 
          type="category" 
          dataKey="name" 
          tick={{ fontSize: 12 }}
          width={120}
        />
        <Tooltip 
          formatter={(value, name) => [
            name === 'revenue' ? formatCurrency(Number(value || 0)) : value,
            name === 'revenue' ? 'Revenue' : 'Order Count'
          ]}
          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Bar 
          dataKey="revenue" 
          radius={[0, 8, 8, 0]}
          name="Revenue"
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={PAYMENT_COLORS[entry.method] || CHART_COLORS[index % CHART_COLORS.length]} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================
// Orders by City Chart (Horizontal Bar)
// ============================================

export function OrdersByCityChart({ data }: { data: CityData[] }) {
  if (!data?.length) return <EmptyState message="No data available" />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data.slice(0, 8)} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" tick={{ fontSize: 10 }} />
        <YAxis 
          type="category" 
          dataKey="city" 
          tick={{ fontSize: 12 }}
          width={100}
        />
        <Tooltip 
          formatter={(value, name) => [
            name === 'revenue' ? formatCurrency(Number(value || 0)) : value,
            name === 'revenue' ? 'Revenue' : 'Order Count'
          ]}
          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Bar 
          dataKey="count" 
          fill={COLORS.primary}
          radius={[0, 8, 8, 0]}
          name="Order Count"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================
// Hourly Sales Heatmap
// ============================================

export function HourlySalesChart({ data }: { data: HourlyData[] }) {
  if (!data?.length) return <EmptyState message="No data available" />;

  const maxCount = Math.max(...data.map(d => d.count));

  const getColor = (count: number) => {
    if (count === 0) return '#f0f0f0';
    const intensity = maxCount > 0 ? count / maxCount : 0;
    if (intensity > 0.7) return COLORS.primary;
    if (intensity > 0.4) return '#4a8b7f';
    if (intensity > 0.2) return '#7ab8a8';
    return '#b5ddd1';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {data.map((item) => (
          <div
            key={item.hour}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              background: getColor(item.count),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 600,
              color: item.count > (maxCount > 0 ? maxCount * 0.4 : 0) ? '#fff' : '#666',
              position: 'relative',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            title={`${item.hour}:00 - ${item.count} orders`}
          >
            {item.hour}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#666' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f0f0f0' }} />
          Low
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#666' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: COLORS.primary }} />
          High
        </div>
      </div>
    </div>
  );
}

// ============================================
// Customer Growth Chart
// ============================================

export function CustomerGrowthChart({ data }: { data: CustomerGrowthData[] }) {
  if (!data?.length) return <EmptyState message="No data available" />;

  const chartData = data.map(d => ({
    date: formatDate(d.date),
    new: d.newCustomers,
    total: d.totalCustomers
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="newCustomersGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.gold} stopOpacity={0.3}/>
            <stop offset="95%" stopColor={COLORS.gold} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip 
          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="new" 
          stroke={COLORS.gold} 
          fill="url(#newCustomersGradient)"
          name="New Customers"
        />
        <Line 
          type="monotone" 
          dataKey="total" 
          stroke={COLORS.primary} 
          strokeWidth={2}
          dot={false}
          name="Total Customers"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================
// Order Status Donut Chart
// ============================================

export function OrderStatusChart({ data }: { data: OrderStatusData[] }) {
  if (!data?.length) return <EmptyState message="No orders" />;

  const statusLabels: Record<string, string> = {
    'pending': 'Pending',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'paid': 'Paid'
  };

  const chartData = data.map(d => ({
    name: statusLabels[d.status] || d.status,
    value: d.count,
    status: d.status
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={STATUS_COLORS[entry.status] || CHART_COLORS[index % CHART_COLORS.length]} 
            />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => [value, 'orders']}
          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Legend 
          formatter={(value) => <span style={{ fontSize: '12px' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ============================================
// Top Products Radial Chart
// ============================================

export function TopProductsChart({ data }: { data: TopProductData[] }) {
  if (!data?.length) return <EmptyState message="No sales yet" />;

  const chartData = data.slice(0, 5).map((d, i) => ({
    name: d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name,
    sold: d.sold,
    fill: CHART_COLORS[i % CHART_COLORS.length],
    fullName: d.name
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <RadialBarChart 
        cx="50%" 
        cy="50%" 
        innerRadius="20%" 
        outerRadius="90%" 
        data={chartData}
        startAngle={180}
        endAngle={0}
      >
        <RadialBar
          background
          dataKey="sold"
          label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
        />
        <Legend 
          iconSize={10}
          layout="vertical"
          verticalAlign="middle"
          align="right"
          formatter={(value) => <span style={{ fontSize: '11px' }}>{value}</span>}
        />
        <Tooltip 
          formatter={(value) => [value, 'sold']}
          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
}

// ============================================
// Mini Trend Sparkline
// ============================================

export function TrendSparkline({ 
  data, 
  color = COLORS.primary,
  height = 40 
}: { 
  data: number[]; 
  color?: string;
  height?: number;
}) {
  if (!data?.length) return null;

  const chartData = data.map((value, i) => ({ value, i }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`sparkline-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
            <stop offset="95%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={1.5}
          fill={`url(#sparkline-${color.replace('#', '')})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================
// NEW: Order Funnel Chart
// ============================================

interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
}

export function OrderFunnelChart({ data }: { data: FunnelData[] }) {
  if (!data?.length) return <EmptyState message="No data available" />;

  const stageLabels: Record<string, string> = {
    'pending': 'Pending',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered'
  };

  const stageColors: Record<string, string> = {
    'pending': '#ea580c',
    'processing': '#1e40af',
    'shipped': '#7c3aed',
    'delivered': '#166534'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {data.map((item, i) => {
        const widthPercent = data[0].count > 0 ? (item.count / data[0].count) * 100 : 0;
        return (
          <div key={item.stage} style={{ position: 'relative' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
              fontSize: '12px'
            }}>
              <span style={{ fontWeight: 600 }}>{stageLabels[item.stage] || item.stage}</span>
              <span style={{ color: '#666' }}>{item.count} orders ({item.percentage}%)</span>
            </div>
            <div style={{
              height: '32px',
              background: '#f0f0f0',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${Math.max(widthPercent, 5)}%`,
                background: stageColors[item.stage] || CHART_COLORS[i % CHART_COLORS.length],
                borderRadius: '6px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// NEW: Monthly Comparison Chart
// ============================================

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
  customers: number;
}

export function MonthlyComparisonChart({ data }: { data: MonthlyData[] }) {
  if (!data?.length) return <EmptyState message="No monthly data" />;

  const chartData = data.map(d => ({
    ...d,
    month: new Date(d.month + '-01').toLocaleDateString('en-US', { month: 'short' })
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis 
          yAxisId="left" 
          tick={{ fontSize: 10 }} 
          tickFormatter={formatCurrency}
          axisLine={false}
          tickLine={false}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          tick={{ fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip 
          formatter={(value, name) => [
            name === 'revenue' ? formatCurrency(Number(value || 0)) : value,
            name === 'revenue' ? 'Revenue' : name === 'orders' ? 'Orders' : 'Customers'
          ]}
          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Legend />
        <Bar 
          yAxisId="left"
          dataKey="revenue" 
          fill={COLORS.primary}
          radius={[4, 4, 0, 0]}
          name="Revenue"
        />
        <Line 
          yAxisId="right"
          type="monotone" 
          dataKey="orders" 
          stroke={COLORS.gold} 
          strokeWidth={2}
          dot={{ fill: COLORS.gold, r: 3 }}
          name="Orders"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ============================================
// NEW: Weekly Comparison Chart
// ============================================

interface WeeklyData {
  week: string;
  revenue: number;
  orders: number;
}

export function WeeklyComparisonChart({ data }: { data: WeeklyData[] }) {
  if (!data?.length) return <EmptyState message="No weekly data" />;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" tickFormatter={formatCurrency} tick={{ fontSize: 10 }} />
        <YAxis 
          type="category" 
          dataKey="week" 
          tick={{ fontSize: 11 }}
          width={90}
        />
        <Tooltip 
          formatter={(value, name) => [
            name === 'revenue' ? formatCurrency(Number(value || 0)) : value,
            name === 'revenue' ? 'Revenue' : 'Orders'
          ]}
          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Bar 
          dataKey="revenue" 
          fill={COLORS.primary}
          radius={[0, 4, 4, 0]}
          name="Revenue"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================
// NEW: Day of Week Chart
// ============================================

interface DayOfWeekData {
  day: string;
  count: number;
  revenue: number;
}

export function DayOfWeekChart({ data }: { data: DayOfWeekData[] }) {
  if (!data?.length) return <EmptyState message="No data available" />;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis 
          dataKey="day" 
          tick={{ fontSize: 10 }} 
          tickLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip 
          formatter={(value, name) => [
            name === 'revenue' ? formatCurrency(Number(value || 0)) : value,
            name === 'revenue' ? 'Revenue' : 'Orders'
          ]}
          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Bar 
          dataKey="count" 
          fill={COLORS.primary}
          radius={[4, 4, 0, 0]}
          name="Orders"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================
// NEW: Comparison Card
// ============================================

interface ComparisonData {
  current: number;
  previous: number;
  label: string;
  format?: 'currency' | 'number';
}

export function ComparisonCard({ current, previous, label, format = 'number' }: ComparisonData) {
  const change = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);
  const isPositive = change >= 0;
  const displayValue = format === 'currency' ? formatCurrency(current) : current.toLocaleString();
  const prevDisplayValue = format === 'currency' ? formatCurrency(previous) : previous.toLocaleString();

  return (
    <div style={{
      padding: '16px',
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #e5e5e5'
    }}>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>{displayValue}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
        <span style={{
          color: isPositive ? '#166534' : '#b91c1c',
          background: isPositive ? '#dcfce7' : '#fee2e2',
          padding: '2px 6px',
          borderRadius: '4px',
          fontWeight: 600
        }}>
          {isPositive ? '↑' : '↓'} {Math.abs(Math.round(change))}%
        </span>
        <span style={{ color: '#999' }}>vs {prevDisplayValue}</span>
      </div>
    </div>
  );
}

// ============================================
// NEW: Progress Bar
// ============================================

export function ProgressBar({ 
  value, 
  max, 
  label, 
  color = COLORS.primary 
}: { 
  value: number; 
  max: number; 
  label: string;
  color?: string;
}) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '6px',
        fontSize: '12px'
      }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: '#666' }}>{Math.round(percentage)}%</span>
      </div>
      <div style={{
        height: '8px',
        background: '#f0f0f0',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: color,
          borderRadius: '4px',
          transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  );
}

// ============================================
// NEW: Stats Grid
// ============================================

interface StatItem {
  label: string;
  value: string | number;
  change?: number;
  icon?: string;
}

export function StatsGrid({ items }: { items: StatItem[] }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '12px'
    }}>
      {items.map((item, i) => (
        <div key={i} style={{
          padding: '16px',
          background: '#f8f8f8',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          {item.icon && <div style={{ fontSize: '20px', marginBottom: '8px' }}>{item.icon}</div>}
          <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', color: '#12403C' }}>{item.value}</div>
          <div style={{ fontSize: '11px', color: '#555' }}>{item.label}</div>
          {item.change !== undefined && (
            <div style={{ 
              fontSize: '11px', 
              color: item.change >= 0 ? '#166534' : '#b91c1c',
              marginTop: '4px'
            }}>
              {item.change >= 0 ? '↑' : '↓'} {Math.abs(item.change)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// NEW: Gauge Chart (Semi-circle)
// ============================================

export function GaugeChart({ 
  value, 
  max = 100, 
  label,
  color = '#12403C'
}: { 
  value: number; 
  max?: number; 
  label: string;
  color?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const angle = (percentage / 100) * 180;

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <svg viewBox="0 0 200 120" style={{ width: '100%', maxWidth: '200px' }}>
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#f0f0f0"
          strokeWidth="20"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * 251} 251`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        {/* Center text */}
        <text x="100" y="90" textAnchor="middle" fontSize="28" fontWeight="700" fill={color}>
          {Math.round(percentage)}%
        </text>
        <text x="100" y="110" textAnchor="middle" fontSize="12" fill="#666">
          {label}
        </text>
      </svg>
    </div>
  );
}

// ============================================
// NEW: Circular Progress Ring
// ============================================

export function CircularProgress({ 
  value, 
  max = 100, 
  size = 120,
  strokeWidth = 12,
  label,
  sublabel,
  color = '#12403C'
}: { 
  value: number; 
  max?: number; 
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel?: string;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f0f0f0"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        {/* Percentage inside circle */}
        <div style={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: size / 4,
          fontWeight: 700,
          color
        }}>
          {Math.round(percentage)}%
        </div>
      </div>
      {/* Label below the circle */}
      <div style={{ textAlign: 'center', marginTop: '12px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{sublabel}</div>}
      </div>
    </div>
  );
}


// ============================================
// NEW: Dual Line Comparison Chart
// ============================================

interface ComparisonLineData {
  date: string;
  current: number;
  previous: number;
}

export function DualLineComparison({ 
  data, 
  currentLabel = 'This Period',
  previousLabel = 'Last Period' 
}: { 
  data: ComparisonLineData[];
  currentLabel?: string;
  previousLabel?: string;
}) {
  if (!data?.length) return <EmptyState message="No comparison data" />;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#12403C" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#12403C" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="previousGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#d4af37" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
        <Tooltip 
          formatter={(value) => [formatCurrency(Number(value || 0))]}
          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="current" 
          stroke="#12403C" 
          strokeWidth={2}
          fill="url(#currentGrad)"
          name={currentLabel}
        />
        <Area 
          type="monotone" 
          dataKey="previous" 
          stroke="#d4af37" 
          strokeWidth={2}
          strokeDasharray="5 5"
          fill="url(#previousGrad)"
          name={previousLabel}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================
// NEW: Stacked Area Chart
// ============================================

interface StackedAreaData {
  date: string;
  [key: string]: string | number;
}

export function StackedAreaTimeChart({ 
  data, 
  keys,
  colors = CHART_COLORS
}: { 
  data: StackedAreaData[];
  keys: string[];
  colors?: string[];
}) {
  if (!data?.length) return <EmptyState message="No data available" />;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        <Legend />
        {keys.map((key, i) => (
          <Area 
            key={key}
            type="monotone" 
            dataKey={key} 
            stackId="1"
            stroke={colors[i % colors.length]} 
            fill={colors[i % colors.length]}
            fillOpacity={0.6}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================
// NEW: Stacked Horizontal Bar Chart
// ============================================

interface StackedBarData {
  name: string;
  [key: string]: string | number;
}

export function StackedHorizontalBar({ 
  data, 
  keys,
  colors = CHART_COLORS
}: { 
  data: StackedBarData[];
  keys: string[];
  colors?: string[];
}) {
  if (!data?.length) return <EmptyState message="No data available" />;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
        <XAxis type="number" tick={{ fontSize: 10 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
        <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        <Legend />
        {keys.map((key, i) => (
          <Bar 
            key={key}
            dataKey={key} 
            stackId="a"
            fill={colors[i % colors.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================
// NEW: Target Progress Bar with Goal
// ============================================

export function TargetProgressBar({ 
  current, 
  target, 
  label,
  format = 'number'
}: { 
  current: number; 
  target: number; 
  label: string;
  format?: 'number' | 'currency' | 'percent';
}) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isAchieved = current >= target;
  
  const formatValue = (val: number) => {
    if (format === 'currency') return formatCurrency(val);
    if (format === 'percent') return `${val}%`;
    return val.toLocaleString();
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '12px', color: '#666' }}>
          {formatValue(current)} / {formatValue(target)}
        </span>
      </div>
      <div style={{
        height: '24px',
        background: '#f0f0f0',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: isAchieved 
            ? 'linear-gradient(90deg, #166534, #22c55e)'
            : 'linear-gradient(90deg, #12403C, #4a8b7f)',
          borderRadius: '12px',
          transition: 'width 0.5s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '10px'
        }}>
          {percentage >= 20 && (
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#fff' }}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
        {/* Target marker */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '2px',
          background: '#b91c1c'
        }} />
      </div>
      {isAchieved && (
        <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ✓ Target achieved!
        </div>
      )}
    </div>
  );
}

// ============================================
// NEW: Mini Sparkline Area Chart
// ============================================

export function MiniAreaChart({ 
  data, 
  color = '#12403C',
  height = 50,
  showValue = true
}: { 
  data: number[];
  color?: string;
  height?: number;
  showValue?: boolean;
}) {
  if (!data?.length) return null;

  const chartData = data.map((value, i) => ({ value, i }));
  const lastValue = data[data.length - 1];
  const firstValue = data[0];
  const trend = lastValue >= firstValue ? 'up' : 'down';

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`mini-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={2}
            fill={`url(#mini-${color.replace('#', '')})`}
          />
        </AreaChart>
      </ResponsiveContainer>
      {showValue && (
        <div style={{ 
          fontSize: '11px', 
          color: trend === 'up' ? '#166534' : '#b91c1c',
          whiteSpace: 'nowrap'
        }}>
          {trend === 'up' ? '↑' : '↓'}
        </div>
      )}
    </div>
  );
}

// ============================================
// NEW: Multi-Donut Chart (Nested rings)
// ============================================

interface MultiRingData {
  label: string;
  value: number;
  max: number;
  color: string;
}

export function MultiRingChart({ data }: { data: MultiRingData[] }) {
  if (!data?.length) return <EmptyState message="No data" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {data.map((item, i) => {
        const percentage = item.max > 0 ? (item.value / item.max) * 100 : 0;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              position: 'relative' 
            }}>
              <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke="#f0f0f0"
                  strokeWidth="3"
                />
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="3"
                  strokeDasharray={`${percentage} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '10px',
                fontWeight: 700
              }}>
                {Math.round(percentage)}%
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                {item.value.toLocaleString()} / {item.max.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// NEW: Horizontal Progress Bars Group
// ============================================

interface ProgressItem {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

export function HorizontalProgressGroup({ items }: { items: ProgressItem[] }) {
  if (!items?.length) return <EmptyState message="No data" />;

  const maxValue = Math.max(...items.map(i => i.max || i.value));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {items.map((item, i) => {
        const percentage = ((item.value) / maxValue) * 100;
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 500 }}>{item.label}</span>
              <span style={{ fontSize: '12px', color: '#666' }}>{item.value.toLocaleString()}</span>
            </div>
            <div style={{
              height: '8px',
              background: '#f0f0f0',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${percentage}%`,
                background: item.color || CHART_COLORS[i % CHART_COLORS.length],
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// NEW: Metric Card with Trend Line
// ============================================

interface MetricCardData {
  value: string | number;
  label: string;
  trend?: number;
  trendData?: number[];
  color?: string;
}

export function MetricCardWithTrend({ value, label, trend, trendData, color = '#12403C' }: MetricCardData) {
  return (
    <div style={{
      padding: '20px',
      background: '#fff',
      borderRadius: '16px',
      border: '1px solid #e5e5e5'
    }}>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 700, color }}>{value}</div>
          {trend !== undefined && (
            <div style={{ 
              fontSize: '12px', 
              color: trend >= 0 ? '#166534' : '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '4px'
            }}>
              <span style={{
                background: trend >= 0 ? '#dcfce7' : '#fee2e2',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600
              }}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
        {trendData && (
          <div style={{ width: '100px', height: '40px' }}>
            <MiniAreaChart data={trendData} color={color} height={40} showValue={false} />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// NEW: Bullet Chart
// ============================================

export function BulletChart({ 
  value, 
  target, 
  max,
  label,
  color = '#12403C'
}: { 
  value: number; 
  target: number; 
  max: number;
  label: string;
  color?: string;
}) {
  const valuePercent = (value / max) * 100;
  const targetPercent = (target / max) * 100;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>{label}</div>
      <div style={{
        height: '20px',
        background: 'linear-gradient(to right, #e8e8e8 0%, #d0d0d0 100%)',
        borderRadius: '4px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Value bar */}
        <div style={{
          position: 'absolute',
          top: '4px',
          bottom: '4px',
          left: 0,
          width: `${valuePercent}%`,
          background: color,
          borderRadius: '2px'
        }} />
        {/* Target marker */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${targetPercent}%`,
          width: '3px',
          background: '#b91c1c',
          transform: 'translateX(-50%)'
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: '#666' }}>
        <span>Current: {formatCurrency(value)}</span>
        <span>Target: {formatCurrency(target)}</span>
      </div>
    </div>
  );
}

// ============================================
// Empty State Component
// ============================================

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '200px',
      color: '#999',
      fontSize: '14px',
      fontStyle: 'italic'
    }}>
      {message}
    </div>
  );
}
