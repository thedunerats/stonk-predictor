import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './StockChart.css';
import { HistoricalDataWithPrediction, FutureDataItem } from '../types';

interface StockChartProps {
  data: HistoricalDataWithPrediction[];
  futureData?: FutureDataItem[];
  title: string;
}

const StockChart: React.FC<StockChartProps> = ({ data, futureData, title }) => {
  // Prepare chart data
  const chartData = data.map(item => ({
    date: item.date,
    actual: item.actual,
    predicted: item.predicted
  }));

  // Add future predictions if available
  if (futureData) {
    futureData.forEach(item => {
      chartData.push({
        date: item.date,
        actual: 0,  // Use 0 instead of null for type safety
        predicted: item.predicted
      });
    });
  }

  return (
    <div className="stock-chart">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <Tooltip
            formatter={(value: number) => value ? `$${value.toFixed(2)}` : 'N/A'}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#1f77b4"
            strokeWidth={2}
            dot={false}
            name="Actual Price"
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#2ca02c"
            strokeWidth={2}
            dot={futureData ? true : false}
            name="Predicted Price"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;
