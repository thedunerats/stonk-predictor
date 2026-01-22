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
import './PredictionResults.css';
import { FutureDataItem, TrainingHistory, ModelInfo } from '../types';

interface PredictionResultsProps {
  futureData: FutureDataItem[];
  currentPrice: number;
  trainingHistory: TrainingHistory;
  modelInfo: ModelInfo;
  onDownload: () => void;
}

const PredictionResults: React.FC<PredictionResultsProps> = ({ 
  futureData, 
  currentPrice, 
  trainingHistory, 
  modelInfo,
  onDownload 
}) => {
  // Prepare training history data
  const historyData = trainingHistory.loss.map((loss, index) => ({
    epoch: index + 1,
    trainLoss: loss,
    valLoss: trainingHistory.valLoss[index]
  }));

  return (
    <div className="prediction-results">
      <div className="future-predictions">
        <h3>🔮 Future Price Predictions</h3>
        <div className="predictions-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Predicted Price</th>
                <th>Change from Current</th>
              </tr>
            </thead>
            <tbody>
              {futureData.map((item, index) => {
                const change = ((item.predicted - currentPrice) / currentPrice * 100);
                return (
                  <tr key={index}>
                    <td>{item.date}</td>
                    <td>${item.predicted.toFixed(2)}</td>
                    <td className={change >= 0 ? 'positive' : 'negative'}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="training-history">
        <h3>📊 Model Training Progress</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={historyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="epoch" label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Loss', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="trainLoss" stroke="#1f77b4" name="Training Loss" />
            <Line type="monotone" dataKey="valLoss" stroke="#ff7f0e" name="Validation Loss" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="model-info">
        <h3>🔍 Model Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Sequence Length:</span>
            <span className="info-value">{modelInfo.sequenceLength} days</span>
          </div>
          <div className="info-item">
            <span className="info-label">Training Epochs:</span>
            <span className="info-value">{modelInfo.epochs}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Training Samples:</span>
            <span className="info-value">{modelInfo.trainSamples}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Test Samples:</span>
            <span className="info-value">{modelInfo.testSamples}</span>
          </div>
        </div>
      </div>

      <button className="download-button" onClick={onDownload}>
        📥 Download Predictions CSV
      </button>
    </div>
  );
};

export default PredictionResults;
