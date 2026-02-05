import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import ConfigPanel from '../components/ConfigPanel';

describe('ConfigPanel Component', () => {
  const mockOnPredict = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders configuration panel', () => {
    render(<ConfigPanel onPredict={mockOnPredict} loading={false} />);
    expect(screen.getByText(/Configuration/i)).toBeInTheDocument();
  });

  test('renders all input fields', () => {
    render(<ConfigPanel onPredict={mockOnPredict} loading={false} />);
    
    expect(screen.getByLabelText(/Stock Ticker Symbol/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument();
    expect(screen.getByText(/Sequence Length:/i)).toBeInTheDocument();
    expect(screen.getByText(/Training Epochs:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Batch Size/i)).toBeInTheDocument();
    expect(screen.getByText(/Days to Predict:/i)).toBeInTheDocument();
  });

  test('displays default ticker value', () => {
    render(<ConfigPanel onPredict={mockOnPredict} loading={false} />);
    const tickerInput = screen.getByPlaceholderText(/AAPL/i) as HTMLInputElement;
    expect(tickerInput.value).toBe('AAPL');
  });

  test('handles ticker input change', () => {
    render(<ConfigPanel onPredict={mockOnPredict} loading={false} />);
    const tickerInput = screen.getByPlaceholderText(/AAPL/i) as HTMLInputElement;
    
    fireEvent.change(tickerInput, { target: { value: 'GOOGL' } });
    expect(tickerInput.value).toBe('GOOGL');
  });

  test('converts ticker to uppercase', () => {
    render(<ConfigPanel onPredict={mockOnPredict} loading={false} />);
    const tickerInput = screen.getByPlaceholderText(/AAPL/i) as HTMLInputElement;
    
    fireEvent.change(tickerInput, { target: { value: 'tsla' } });
    expect(tickerInput.value).toBe('TSLA');
  });

  test('handles sequence length slider', () => {
    render(<ConfigPanel onPredict={mockOnPredict} loading={false} />);
    const slider = screen.getByRole('slider', { name: /Sequence Length/i }) as HTMLInputElement;
    
    fireEvent.change(slider, { target: { value: '90' } });
    expect(slider.value).toBe('90');
    expect(screen.getByText(/Sequence Length: 90 days/i)).toBeInTheDocument();
  });

  test('handles epochs slider', () => {
    render(<ConfigPanel onPredict={mockOnPredict} loading={false} />);
    const slider = screen.getByRole('slider', { name: /Training Epochs/i }) as HTMLInputElement;
    
    fireEvent.change(slider, { target: { value: '75' } });
    expect(slider.value).toBe('75');
    expect(screen.getByText(/Training Epochs: 75/i)).toBeInTheDocument();
  });

  test('handles prediction days slider', () => {
    render(<ConfigPanel onPredict={mockOnPredict} loading={false} />);
    const slider = screen.getByRole('slider', { name: /Days to Predict/i }) as HTMLInputElement;
    
    fireEvent.change(slider, { target: { value: '10' } });
    expect(slider.value).toBe('10');
    expect(screen.getByText(/Days to Predict: 10/i)).toBeInTheDocument();
  });

  test('handles batch size selection', () => {
    render(<ConfigPanel onPredict={mockOnPredict} loading={false} />);
    const select = screen.getByLabelText(/Batch Size/i) as HTMLSelectElement;
    
    fireEvent.change(select, { target: { value: '64' } });
    expect(select.value).toBe('64');
  });

  test('submit button calls onPredict with config', () => {
    render(<ConfigPanel onPredict={mockOnPredict} loading={false} />);
    const button = screen.getByRole('button', { name: /Run Prediction/i });
    
    fireEvent.click(button);
    expect(mockOnPredict).toHaveBeenCalledTimes(1);
    expect(mockOnPredict).toHaveBeenCalledWith(
      expect.objectContaining({
        ticker: 'AAPL',
        sequenceLength: 60,
        epochs: 50,
        batchSize: 32,
        predictionDays: 5
      })
    );
  });

  test('disables button when loading', () => {
    render(<ConfigPanel onPredict={mockOnPredict} loading={true} />);
    const button = screen.getByRole('button') as HTMLButtonElement;
    
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/Processing/i);
  });

  test('enables button when not loading', () => {
    render(<ConfigPanel onPredict={mockOnPredict} loading={false} />);
    const button = screen.getByRole('button') as HTMLButtonElement;
    
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent(/Run Prediction/i);
  });

  test('has proper date inputs', () => {
    render(<ConfigPanel onPredict={mockOnPredict} loading={false} />);
    const startDateInput = screen.getByLabelText(/Start Date/i) as HTMLInputElement;
    const endDateInput = screen.getByLabelText(/End Date/i) as HTMLInputElement;
    
    expect(startDateInput.type).toBe('date');
    expect(endDateInput.type).toBe('date');
    expect(startDateInput.value).toBeTruthy();
    expect(endDateInput.value).toBeTruthy();
  });

  test('displays help text for inputs', () => {
    render(<ConfigPanel onPredict={mockOnPredict} loading={false} />);
    
    expect(screen.getByText(/Previous days used for prediction/i)).toBeInTheDocument();
    expect(screen.getByText(/Number of training iterations/i)).toBeInTheDocument();
    expect(screen.getByText(/Future days to forecast/i)).toBeInTheDocument();
  });
});
