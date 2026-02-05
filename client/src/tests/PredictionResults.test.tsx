import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import PredictionResults from '../components/PredictionResults';
import { FutureDataItem, TrainingHistory, ModelInfo } from '../types';

// Mock Recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>
}));

describe('PredictionResults Component', () => {
  const mockFutureData: FutureDataItem[] = [
    { date: '2026-01-22', predicted: 152.5 },
    { date: '2026-01-23', predicted: 153.2 },
    { date: '2026-01-24', predicted: 151.8 }
  ];

  const mockTrainingHistory: TrainingHistory = {
    loss: [0.1, 0.05, 0.01],
    valLoss: [0.12, 0.06, 0.02]
  };

  const mockModelInfo: ModelInfo = {
    sequenceLength: 60,
    epochs: 50,
    trainSamples: 1000,
    testSamples: 250
  };

  const mockOnDownload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders future predictions title', () => {
    render(
      <PredictionResults
        futureData={mockFutureData}
        currentPrice={150}
        trainingHistory={mockTrainingHistory}
        modelInfo={mockModelInfo}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/Future Price Predictions/i)).toBeInTheDocument();
  });

  test('renders predictions table with correct data', () => {
    render(
      <PredictionResults
        futureData={mockFutureData}
        currentPrice={150}
        trainingHistory={mockTrainingHistory}
        modelInfo={mockModelInfo}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('2026-01-22')).toBeInTheDocument();
    expect(screen.getByText('$152.50')).toBeInTheDocument();
    expect(screen.getByText('2026-01-23')).toBeInTheDocument();
    expect(screen.getByText('$153.20')).toBeInTheDocument();
  });

  test('calculates and displays percentage changes correctly', () => {
    render(
      <PredictionResults
        futureData={mockFutureData}
        currentPrice={150}
        trainingHistory={mockTrainingHistory}
        modelInfo={mockModelInfo}
        onDownload={mockOnDownload}
      />
    );

    // 152.5 vs 150 = +1.67%
    expect(screen.getByText(/\+1.67%/i)).toBeInTheDocument();
  });

  test('displays positive and negative changes correctly', () => {
    const mixedData: FutureDataItem[] = [
      { date: '2026-01-22', predicted: 155 }, // +3.33%
      { date: '2026-01-23', predicted: 145 }  // -3.33%
    ];

    render(
      <PredictionResults
        futureData={mixedData}
        currentPrice={150}
        trainingHistory={mockTrainingHistory}
        modelInfo={mockModelInfo}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/\+3.33%/i)).toBeInTheDocument();
    expect(screen.getByText(/-3.33%/i)).toBeInTheDocument();
  });

  test('renders training history chart', () => {
    render(
      <PredictionResults
        futureData={mockFutureData}
        currentPrice={150}
        trainingHistory={mockTrainingHistory}
        modelInfo={mockModelInfo}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/Model Training Progress/i)).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  test('renders model information', () => {
    render(
      <PredictionResults
        futureData={mockFutureData}
        currentPrice={150}
        trainingHistory={mockTrainingHistory}
        modelInfo={mockModelInfo}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/Model Information/i)).toBeInTheDocument();
    expect(screen.getByText('60 days')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
  });

  test('download button calls onDownload', () => {
    render(
      <PredictionResults
        futureData={mockFutureData}
        currentPrice={150}
        trainingHistory={mockTrainingHistory}
        modelInfo={mockModelInfo}
        onDownload={mockOnDownload}
      />
    );

    const downloadButton = screen.getByText(/Download Predictions CSV/i);
    fireEvent.click(downloadButton);

    expect(mockOnDownload).toHaveBeenCalledTimes(1);
  });

  test('renders all table headers', () => {
    render(
      <PredictionResults
        futureData={mockFutureData}
        currentPrice={150}
        trainingHistory={mockTrainingHistory}
        modelInfo={mockModelInfo}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Predicted Price')).toBeInTheDocument();
    expect(screen.getByText('Change from Current')).toBeInTheDocument();
  });

  test('handles empty future data', () => {
    render(
      <PredictionResults
        futureData={[]}
        currentPrice={150}
        trainingHistory={mockTrainingHistory}
        modelInfo={mockModelInfo}
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/Future Price Predictions/i)).toBeInTheDocument();
  });
});
