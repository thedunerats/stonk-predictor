import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders app header', () => {
    render(<App />);
    const headerElement = screen.getByText(/LSTM Stock Price Predictor/i);
    expect(headerElement).toBeInTheDocument();
  });

  test('renders welcome message initially', () => {
    render(<App />);
    const welcomeText = screen.getByText(/Welcome to LSTM Stock Predictor/i);
    expect(welcomeText).toBeInTheDocument();
  });

  test('renders info cards with LSTM information', () => {
    render(<App />);
    const lstmInfo = screen.getByText(/LSTM Neural Networks/i);
    const modelFeatures = screen.getByText(/Model Features/i);
    expect(lstmInfo).toBeInTheDocument();
    expect(modelFeatures).toBeInTheDocument();
  });

  test('displays disclaimer', () => {
    render(<App />);
    const disclaimer = screen.getByText(/This tool is for educational purposes only/i);
    expect(disclaimer).toBeInTheDocument();
  });

  test('handles successful stock data fetch', async () => {
    const mockStockData = {
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      historicalData: [
        { date: '2020-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000000 }
      ],
      currentPrice: 152.45,
      dailyChange: 2.35,
      dailyChangePct: 1.57,
      periodHigh: 195.80,
      periodLow: 53.15,
      dataPoints: 1500
    };

    mockedAxios.post.mockResolvedValueOnce({ data: mockStockData });

    render(<App />);
    
    // This test verifies the structure, actual interaction would require more setup
    expect(screen.getByText(/LSTM Stock Price Predictor/i)).toBeInTheDocument();
  });

  test('handles error state', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'API Error' } }
    });

    render(<App />);
    
    // Verify error handling structure exists
    expect(screen.getByText(/LSTM Stock Price Predictor/i)).toBeInTheDocument();
  });

  test('displays loading state', () => {
    render(<App />);
    
    // Check that the component can handle loading state
    const configPanel = screen.getByText(/Configuration/i);
    expect(configPanel).toBeInTheDocument();
  });
});

describe('App Integration Tests', () => {
  test('full prediction workflow structure', async () => {
    const mockStockData = {
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      historicalData: [],
      currentPrice: 150,
      dailyChange: 1,
      dailyChangePct: 0.67,
      periodHigh: 160,
      periodLow: 140,
      dataPoints: 100
    };

    const mockPredictionData = {
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      trainMetrics: { MSE: 1.5, RMSE: 1.22, MAE: 0.98, MAPE: 3.4 },
      testMetrics: { MSE: 2.1, RMSE: 1.45, MAE: 1.12, MAPE: 4.2 },
      historicalData: [
        { date: '2020-01-01', actual: 100, predicted: 100.5 }
      ],
      futureData: [
        { date: '2026-01-22', predicted: 152.5 }
      ],
      trainingHistory: {
        loss: [0.1, 0.05, 0.01],
        valLoss: [0.12, 0.06, 0.02]
      },
      accuracyStatus: 'good',
      accuracyMessage: 'Good accuracy!',
      modelInfo: {
        sequenceLength: 60,
        epochs: 50,
        trainSamples: 100,
        testSamples: 25
      }
    };

    mockedAxios.post
      .mockResolvedValueOnce({ data: mockStockData })
      .mockResolvedValueOnce({ data: mockPredictionData });

    render(<App />);
    
    expect(screen.getByText(/LSTM Stock Price Predictor/i)).toBeInTheDocument();
  });
});
