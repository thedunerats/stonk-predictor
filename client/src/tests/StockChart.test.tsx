import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StockChart from '../components/StockChart';
import { HistoricalDataWithPrediction, FutureDataItem } from '../types';

// Mock Recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>
}));

describe('StockChart Component', () => {
  const mockHistoricalData: HistoricalDataWithPrediction[] = [
    { date: '2020-01-01', actual: 100, predicted: null },
    { date: '2020-01-02', actual: 101, predicted: null },
    { date: '2020-01-03', actual: 102, predicted: 101.5 }
  ];

  const mockFutureData: FutureDataItem[] = [
    { date: '2026-01-22', predicted: 152.5 },
    { date: '2026-01-23', predicted: 153.2 }
  ];

  test('renders chart title', () => {
    render(<StockChart data={mockHistoricalData} title="Test Chart" />);
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
  });

  test('renders chart components', () => {
    render(<StockChart data={mockHistoricalData} title="Test Chart" />);
    
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('grid')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  test('renders with historical data only', () => {
    const { container } = render(
      <StockChart data={mockHistoricalData} title="Historical Prices" />
    );
    expect(container).toBeInTheDocument();
  });

  test('renders with historical and future data', () => {
    const { container } = render(
      <StockChart 
        data={mockHistoricalData} 
        futureData={mockFutureData}
        title="Predictions" 
      />
    );
    expect(container).toBeInTheDocument();
  });

  test('handles empty data array', () => {
    const { container } = render(
      <StockChart data={[]} title="Empty Chart" />
    );
    expect(screen.getByText('Empty Chart')).toBeInTheDocument();
  });

  test('renders chart with proper structure', () => {
    render(<StockChart data={mockHistoricalData} title="Stock Prices" />);
    
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
    
    // Check that Lines are rendered (2 lines: actual and predicted)
    const lines = screen.getAllByTestId('line');
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });
});
