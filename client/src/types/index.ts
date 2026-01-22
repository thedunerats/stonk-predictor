export interface StockDataItem {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockDataResponse {
  ticker: string;
  companyName: string;
  historicalData: StockDataItem[];
  currentPrice: number;
  dailyChange: number;
  dailyChangePct: number;
  periodHigh: number;
  periodLow: number;
  dataPoints: number;
}

export interface PredictionMetrics {
  MSE: number;
  RMSE: number;
  MAE: number;
  MAPE: number;
}

export interface HistoricalDataWithPrediction {
  date: string;
  actual: number;
  predicted: number | null;
}

export interface FutureDataItem {
  date: string;
  predicted: number;
}

export interface TrainingHistory {
  loss: number[];
  valLoss: number[];
}

export interface ModelInfo {
  sequenceLength: number;
  epochs: number;
  trainSamples: number;
  testSamples: number;
}

export interface PredictionResponse {
  ticker: string;
  companyName: string;
  trainMetrics: PredictionMetrics;
  testMetrics: PredictionMetrics;
  historicalData: HistoricalDataWithPrediction[];
  futureData: FutureDataItem[];
  trainingHistory: TrainingHistory;
  accuracyStatus: 'excellent' | 'good' | 'fair' | 'poor';
  accuracyMessage: string;
  modelInfo: ModelInfo;
}

export interface PredictionConfig {
  apiKey: string;
  ticker: string;
  startDate: string;
  endDate: string;
  sequenceLength: number;
  epochs: number;
  batchSize: number;
  predictionDays: number;
}
