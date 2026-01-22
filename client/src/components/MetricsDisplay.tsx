import React from 'react';
import './MetricsDisplay.css';
import { PredictionMetrics } from '../types';

interface MetricsDisplayProps {
  trainMetrics: PredictionMetrics;
  testMetrics: PredictionMetrics;
  accuracyStatus: 'excellent' | 'good' | 'fair' | 'poor';
  accuracyMessage: string;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ trainMetrics, testMetrics, accuracyStatus, accuracyMessage }) => {
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'status-excellent';
      case 'good':
        return 'status-good';
      case 'fair':
        return 'status-fair';
      case 'poor':
        return 'status-poor';
      default:
        return '';
    }
  };

  return (
    <div className="metrics-display">
      <div className="metrics-row">
        <div className="metrics-column">
          <h3>📈 Training Metrics</h3>
          <div className="metric-item">
            <span className="metric-name">MAPE:</span>
            <span className="metric-number">{trainMetrics.MAPE.toFixed(2)}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-name">RMSE:</span>
            <span className="metric-number">${trainMetrics.RMSE.toFixed(2)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-name">MAE:</span>
            <span className="metric-number">${trainMetrics.MAE.toFixed(2)}</span>
          </div>
        </div>

        <div className="metrics-column">
          <h3>🎯 Testing Metrics</h3>
          <div className="metric-item">
            <span className="metric-name">MAPE:</span>
            <span className="metric-number">{testMetrics.MAPE.toFixed(2)}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-name">RMSE:</span>
            <span className="metric-number">${testMetrics.RMSE.toFixed(2)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-name">MAE:</span>
            <span className="metric-number">${testMetrics.MAE.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className={`accuracy-status ${getStatusClass(accuracyStatus)}`}>
        <p>{accuracyMessage}</p>
      </div>
    </div>
  );
};

export default MetricsDisplay;
