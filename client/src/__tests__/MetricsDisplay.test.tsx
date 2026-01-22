import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MetricsDisplay from '../components/MetricsDisplay';
import { PredictionMetrics } from '../types';

describe('MetricsDisplay Component', () => {
  const mockTrainMetrics: PredictionMetrics = {
    MSE: 2.34,
    RMSE: 1.53,
    MAE: 1.12,
    MAPE: 3.45
  };

  const mockTestMetrics: PredictionMetrics = {
    MSE: 3.21,
    RMSE: 1.79,
    MAE: 1.34,
    MAPE: 4.12
  };

  test('renders training metrics', () => {
    render(
      <MetricsDisplay
        trainMetrics={mockTrainMetrics}
        testMetrics={mockTestMetrics}
        accuracyStatus="good"
        accuracyMessage="Good accuracy!"
      />
    );

    expect(screen.getByText(/Training Metrics/i)).toBeInTheDocument();
    expect(screen.getByText(/3.45%/i)).toBeInTheDocument(); // Train MAPE
    expect(screen.getByText(/\$1.53/i)).toBeInTheDocument(); // Train RMSE
  });

  test('renders testing metrics', () => {
    render(
      <MetricsDisplay
        trainMetrics={mockTrainMetrics}
        testMetrics={mockTestMetrics}
        accuracyStatus="good"
        accuracyMessage="Good accuracy!"
      />
    );

    expect(screen.getByText(/Testing Metrics/i)).toBeInTheDocument();
    expect(screen.getByText(/4.12%/i)).toBeInTheDocument(); // Test MAPE
    expect(screen.getByText(/\$1.79/i)).toBeInTheDocument(); // Test RMSE
  });

  test('displays all metric types', () => {
    render(
      <MetricsDisplay
        trainMetrics={mockTrainMetrics}
        testMetrics={mockTestMetrics}
        accuracyStatus="good"
        accuracyMessage="Good accuracy!"
      />
    );

    // Check for metric labels (appears multiple times for train and test)
    const mapeLabels = screen.getAllByText(/MAPE:/i);
    const rmseLabels = screen.getAllByText(/RMSE:/i);
    const maeLabels = screen.getAllByText(/MAE:/i);

    expect(mapeLabels.length).toBe(2); // Train and test
    expect(rmseLabels.length).toBe(2);
    expect(maeLabels.length).toBe(2);
  });

  test('renders accuracy status message', () => {
    render(
      <MetricsDisplay
        trainMetrics={mockTrainMetrics}
        testMetrics={mockTestMetrics}
        accuracyStatus="good"
        accuracyMessage="Good accuracy! MAPE < 10%"
      />
    );

    expect(screen.getByText(/Good accuracy! MAPE < 10%/i)).toBeInTheDocument();
  });

  test('applies correct CSS class for excellent status', () => {
    const { container } = render(
      <MetricsDisplay
        trainMetrics={mockTrainMetrics}
        testMetrics={mockTestMetrics}
        accuracyStatus="excellent"
        accuracyMessage="Excellent accuracy!"
      />
    );

    const statusElement = container.querySelector('.status-excellent');
    expect(statusElement).toBeInTheDocument();
  });

  test('applies correct CSS class for good status', () => {
    const { container } = render(
      <MetricsDisplay
        trainMetrics={mockTrainMetrics}
        testMetrics={mockTestMetrics}
        accuracyStatus="good"
        accuracyMessage="Good accuracy!"
      />
    );

    const statusElement = container.querySelector('.status-good');
    expect(statusElement).toBeInTheDocument();
  });

  test('applies correct CSS class for fair status', () => {
    const { container } = render(
      <MetricsDisplay
        trainMetrics={mockTrainMetrics}
        testMetrics={mockTestMetrics}
        accuracyStatus="fair"
        accuracyMessage="Fair accuracy"
      />
    );

    const statusElement = container.querySelector('.status-fair');
    expect(statusElement).toBeInTheDocument();
  });

  test('applies correct CSS class for poor status', () => {
    const { container } = render(
      <MetricsDisplay
        trainMetrics={mockTrainMetrics}
        testMetrics={mockTestMetrics}
        accuracyStatus="poor"
        accuracyMessage="Poor accuracy"
      />
    );

    const statusElement = container.querySelector('.status-poor');
    expect(statusElement).toBeInTheDocument();
  });

  test('formats metrics to 2 decimal places', () => {
    const metrics: PredictionMetrics = {
      MSE: 2.123456,
      RMSE: 1.456789,
      MAE: 1.987654,
      MAPE: 3.123456
    };

    render(
      <MetricsDisplay
        trainMetrics={metrics}
        testMetrics={metrics}
        accuracyStatus="good"
        accuracyMessage="Test"
      />
    );

    expect(screen.getAllByText(/3.12%/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/\$1.46/i).length).toBeGreaterThan(0);
  });
});
