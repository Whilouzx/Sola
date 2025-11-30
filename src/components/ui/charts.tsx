import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  TooltipProps
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

interface ChartProps {
  data: ChartData[];
  height?: number;
  className?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-flowi border border-orange-200 dark:border-orange-800">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-orange-600 dark:text-orange-400">
            {entry.name}: ${entry.value?.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Flowi color palette
const COLORS = [
  '#f97316', // Orange 500
  '#ea580c', // Orange 600
  '#c2410c', // Orange 700
  '#9a3412', // Orange 800
  '#7c2d12', // Orange 900
  '#fb923c', // Orange 400
  '#fdba74', // Orange 300
  '#fed7aa', // Orange 200
];

export function FlowiBarChart({ data, height = 300, className = '' }: ChartProps) {
  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f97316" opacity={0.2} />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="value" 
            fill="url(#flowiBargradient)"
            radius={[4, 4, 0, 0]}
            className="drop-shadow-sm"
          />
          <defs>
            <linearGradient id="flowiBargradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FlowiLineChart({ data, height = 300, className = '' }: ChartProps) {
  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f97316" opacity={0.2} />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#f97316"
            strokeWidth={3}
            dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#ea580c' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FlowiAreaChart({ data, height = 300, className = '' }: ChartProps) {
  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f97316" opacity={0.2} />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value: number) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#f97316"
            strokeWidth={2}
            fill="url(#flowiAreaGradient)"
          />
          <defs>
            <linearGradient id="flowiAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0.1} />
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FlowiPieChart({ data, height = 300, className = '' }: ChartProps) {
  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Valor']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.15)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Sales trend chart with multiple metrics
interface SalesTrendData {
  date: string;
  sales: number;
  revenue: number;
  orders: number;
}

interface SalesTrendChartProps {
  data: SalesTrendData[];
  height?: number;
  className?: string;
}

export function FlowiSalesTrendChart({ data, height = 400, className = '' }: SalesTrendChartProps) {
  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f97316" opacity={0.2} />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #fed7aa',
              borderRadius: '8px',
              boxShadow: '0 4px 14px 0 rgba(249, 115, 22, 0.15)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#f97316"
            strokeWidth={3}
            name="Ingresos"
            dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="orders" 
            stroke="#ea580c"
            strokeWidth={2}
            name="Pedidos"
            dot={{ fill: '#ea580c', strokeWidth: 2, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}