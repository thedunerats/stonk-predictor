import React, { useState } from 'react';
import './App.css';
import ConfigPanel from './components/ConfigPanel';
import StockChart from './components/StockChart';
import MetricsDisplay from './components/MetricsDisplay';
import PredictionResults from './components/PredictionResults';
import axios from 'axios';
import { StockDataResponse, PredictionResponse, PredictionConfig } from './types';

function App() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [stockData, setStockData] = useState<StockDataResponse | null>(null);
  const [predictionResults, setPredictionResults] = useState<PredictionResponse | null>(null);
  const [status, setStatus] = useState<string>('');

  const handlePredict = async (config: PredictionConfig) => {
    setLoading(true);
    setError(null);
    setStatus('Downloading stock data...');
    setPredictionResults(null);

    try {
      // First, fetch stock data to display
      const stockResponse = await axios.post('/api/stock/data', {
        ticker: config.ticker,
        startDate: config.startDate,
        endDate: config.endDate,
        apiKey: config.apiKey
      });

      setStockData(stockResponse.data);
      setStatus('Training LSTM model...');

      // Then run prediction
      const predictionResponse = await axios.post('/api/predict', {
        ticker: config.ticker,
        startDate: config.startDate,
        endDate: config.endDate,
        apiKey: config.apiKey,
        sequenceLength: config.sequenceLength,
        epochs: config.epochs,
        batchSize: config.batchSize,
        predictionDays: config.predictionDays
      });

      setPredictionResults(predictionResponse.data);
      setStatus('Prediction complete!');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!predictionResults) return;

    try {
      const response = await axios.post('/api/download', {
        results: predictionResults.historicalData,
        ticker: predictionResults.ticker
      });

      // Create blob and download
      const blob = new Blob([response.data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Error downloading CSV');
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🤖 LSTM Stock Price Predictor</h1>
        <p>Predict stock prices using advanced AI neural networks</p>
      </header>

      <div className="app-container">
        <div className="sidebar">
          <ConfigPanel onPredict={handlePredict} loading={loading} />
        </div>

        <div className="main-content">
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>{status}</p>
            </div>
          )}

          {error && (
            <div className="error-container">
              <h3>❌ Error</h3>
              <p>{error}</p>
            </div>
          )}

          {stockData && !predictionResults && !loading && (
            <div className="data-preview">
              <h2>📊 {stockData.companyName} ({stockData.ticker})</h2>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-label">Current Price</div>
                  <div className="metric-value">${stockData.currentPrice.toFixed(2)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Daily Change</div>
                  <div className={`metric-value ${stockData.dailyChange >= 0 ? 'positive' : 'negative'}`}>
                    ${stockData.dailyChange.toFixed(2)} ({stockData.dailyChangePct.toFixed(2)}%)
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Period High</div>
                  <div className="metric-value">${stockData.periodHigh.toFixed(2)}</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Period Low</div>
                  <div className="metric-value">${stockData.periodLow.toFixed(2)}</div>
                </div>
              </div>
              <StockChart 
                data={stockData.historicalData.map(item => ({
                  date: item.date,
                  actual: item.close,
                  predicted: null
                }))} 
                title="Historical Stock Prices" 
              />
            </div>
          )}

          {predictionResults && (
            <div className="results-container">
              <h2>📈 Prediction Results for {predictionResults.companyName}</h2>
              
              <MetricsDisplay 
                trainMetrics={predictionResults.trainMetrics}
                testMetrics={predictionResults.testMetrics}
                accuracyStatus={predictionResults.accuracyStatus}
                accuracyMessage={predictionResults.accuracyMessage}
              />

              <StockChart 
                data={predictionResults.historicalData}
                futureData={predictionResults.futureData}
                title="Stock Price Predictions"
              />

              <PredictionResults
                futureData={predictionResults.futureData}
                currentPrice={stockData?.currentPrice || 0}
                trainingHistory={predictionResults.trainingHistory}
                modelInfo={predictionResults.modelInfo}
                onDownload={handleDownload}
              />
            </div>
          )}

          {!loading && !error && !stockData && (
            <div className="welcome-container">
              <h2>👋 Welcome to LSTM Stock Predictor</h2>
              <div className="info-grid">
                <div className="info-card">
                  <h3>🧠 LSTM Neural Networks</h3>
                  <p>
                    LSTM (Long Short-Term Memory) networks are a type of recurrent neural network 
                    capable of learning long-term dependencies. They're particularly well-suited for 
                    time series prediction because they can:
                  </p>
                  <ul>
                    <li>Remember important patterns from the past</li>
                    <li>Forget irrelevant information</li>
                    <li>Make predictions based on sequential data</li>
                  </ul>
                </div>

                <div className="info-card">
                  <h3>📊 Model Features</h3>
                  <p>Our LSTM model uses:</p>
                  <ul>
                    <li><strong>2 LSTM layers</strong> with 50 neurons each</li>
                    <li><strong>Dropout layers</strong> to prevent overfitting</li>
                    <li><strong>Dense layers</strong> for final prediction</li>
                    <li><strong>60-day sequences</strong> as default input</li>
                    <li><strong>Min-Max scaling</strong> for data normalization</li>
                  </ul>
                </div>
              </div>

              <div className="disclaimer">
                <h4>⚠️ Disclaimer</h4>
                <p>
                  This tool is for educational purposes only. Stock market predictions are inherently uncertain, 
                  and this model should not be used as the sole basis for investment decisions. Always conduct 
                  your own research and consider consulting with financial professionals before making investment 
                  choices. Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="app-footer">
        Made with ❤️ using React, Flask, and TensorFlow
      </footer>
    </div>
  );
}

export default App;
