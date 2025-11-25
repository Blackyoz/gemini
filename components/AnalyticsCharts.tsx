import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { ChartDataPoint, StatusDataPoint } from '../types';

interface AnalyticsChartsProps {
  barData: ChartDataPoint[];
  pieData: StatusDataPoint[];
  formatCurrency: (val: number) => string;
  chartTitle: string;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ barData, pieData, formatCurrency, chartTitle }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 h-auto lg:h-96">
      {/* Bar Chart */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">{chartTitle}</h3>
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis 
                dataKey="name" 
                tick={{fill: '#64748B', fontSize: 12}} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
              />
              <YAxis 
                tick={{fill: '#64748B', fontSize: 12}} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => `¥${value/1000}k`}
              />
              <Tooltip 
                cursor={{fill: '#F1F5F9'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="revenue" name="收入" fill="#475569" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="profit" name="利润" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">团单状态分布</h3>
        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={pieData} 
                cx="50%" 
                cy="50%" 
                innerRadius={60} 
                outerRadius={80} 
                paddingAngle={5} 
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}/>
              <Legend verticalAlign="bottom" height={36} iconType="circle"/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;