import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DonutChartData {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  innerRadius?: number;
  outerRadius?: number;
}

export function DonutChart({ 
  data, 
  size = 120, 
  innerRadius = 25, 
  outerRadius = 50 
}: DonutChartProps) {
  return (
    <div className="flex items-center justify-center">
      <ResponsiveContainer width={size} height={size}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
