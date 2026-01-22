import React, { useState } from 'react';
import './ConfigPanel.css';
import { PredictionConfig } from '../types';

interface ConfigPanelProps {
  onPredict: (config: PredictionConfig) => void;
  loading: boolean;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ onPredict, loading }) => {
  const [config, setConfig] = useState<PredictionConfig>({
    apiKey: '',
    ticker: 'AAPL',
    startDate: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    sequenceLength: 60,
    epochs: 50,
    batchSize: 32,
    predictionDays: 5
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: name === 'ticker' ? value.toUpperCase() : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPredict(config);
  };

  return (
    <div className="config-panel">
      <h2>📊 Configuration</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="apiKey">
            FMP API Key (Optional)
            <span className="help-text">Get free key from financialmodelingprep.com</span>
          </label>
          <input
            type="password"
            id="apiKey"
            name="apiKey"
            value={config.apiKey}
            onChange={handleChange}
            placeholder="Enter API key or leave empty"
          />
        </div>

        <div className="form-group">
          <label htmlFor="ticker">
            Stock Ticker Symbol
            <span className="help-text">e.g., AAPL, GOOGL, TSLA</span>
          </label>
          <input
            type="text"
            id="ticker"
            name="ticker"
            value={config.ticker}
            onChange={handleChange}
            required
            placeholder="AAPL"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={config.startDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={config.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="divider">
          <span>🔧 Model Parameters</span>
        </div>

        <div className="form-group">
          <label htmlFor="sequenceLength">
            Sequence Length: {config.sequenceLength} days
            <span className="help-text">Previous days used for prediction</span>
          </label>
          <input
            type="range"
            id="sequenceLength"
            name="sequenceLength"
            min="30"
            max="120"
            value={config.sequenceLength}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="epochs">
            Training Epochs: {config.epochs}
            <span className="help-text">Number of training iterations</span>
          </label>
          <input
            type="range"
            id="epochs"
            name="epochs"
            min="20"
            max="100"
            value={config.epochs}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="batchSize">Batch Size</label>
          <select
            id="batchSize"
            name="batchSize"
            value={config.batchSize}
            onChange={handleChange}
          >
            <option value="16">16</option>
            <option value="32">32</option>
            <option value="64">64</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="predictionDays">
            Days to Predict: {config.predictionDays}
            <span className="help-text">Future days to forecast</span>
          </label>
          <input
            type="range"
            id="predictionDays"
            name="predictionDays"
            min="1"
            max="30"
            value={config.predictionDays}
            onChange={handleChange}
          />
        </div>

        <button 
          type="submit" 
          className="predict-button" 
          disabled={loading}
        >
          {loading ? '🔄 Processing...' : '🚀 Run Prediction'}
        </button>
      </form>
    </div>
  );
};

export default ConfigPanel;
