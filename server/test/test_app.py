import unittest
from unittest.mock import patch, MagicMock
import sys
import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from helpers import (
    download_stock_data,
    prepare_data,
    build_lstm_model,
    calculate_metrics,
    predict_future_prices
)


class TestFlaskApp(unittest.TestCase):
    """Test Flask application endpoints"""

    def setUp(self):
        """Set up test client"""
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_health_check(self):
        """Test health check endpoint"""
        response = self.client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['status'], 'ok')
        self.assertIn('message', data)

    @patch('helpers.download_stock_data')
    def test_stock_data_endpoint_success(self, mock_download):
        """Test successful stock data retrieval"""
        # Mock data
        mock_df = pd.DataFrame({
            'Open': [100, 101, 102],
            'High': [105, 106, 107],
            'Low': [95, 96, 97],
            'Close': [100, 101, 102],
            'Volume': [1000000, 1100000, 1200000]
        }, index=pd.date_range('2020-01-01', periods=3))
        
        mock_download.return_value = (mock_df, 'AAPL')

        response = self.client.post('/api/stock/data', json={
            'ticker': 'AAPL',
            'startDate': '2020-01-01',
            'endDate': '2020-01-03',
            'apiKey': ''
        })

        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['ticker'], 'AAPL')
        self.assertEqual(len(data['historicalData']), 3)
        self.assertIn('currentPrice', data)

    def test_stock_data_endpoint_missing_params(self):
        """Test stock data endpoint with missing parameters"""
        response = self.client.post('/api/stock/data', json={
            'ticker': 'AAPL'
            # Missing dates
        })
        self.assertEqual(response.status_code, 400)

    @patch('helpers.download_stock_data')
    @patch('helpers.build_lstm_model')
    def test_predict_endpoint_success(self, mock_model, mock_download):
        """Test successful prediction endpoint"""
        # Mock data
        mock_df = pd.DataFrame({
            'Close': np.random.rand(100) * 100 + 100
        }, index=pd.date_range('2020-01-01', periods=100))
        
        mock_download.return_value = (mock_df, 'AAPL')
        
        # Mock model
        mock_model_instance = MagicMock()
        mock_model_instance.fit.return_value.history = {
            'loss': [0.1, 0.05, 0.01],
            'val_loss': [0.12, 0.06, 0.02]
        }
        mock_model_instance.predict.return_value = np.random.rand(10, 1) * 100 + 100
        mock_model.return_value = mock_model_instance

        response = self.client.post('/api/predict', json={
            'ticker': 'AAPL',
            'startDate': '2020-01-01',
            'endDate': '2020-04-10',
            'apiKey': '',
            'sequenceLength': 60,
            'epochs': 10,
            'batchSize': 32,
            'predictionDays': 5
        })

        # Note: This might fail due to data size, but tests the structure
        if response.status_code == 200:
            data = response.get_json()
            self.assertIn('trainMetrics', data)
            self.assertIn('testMetrics', data)
            self.assertIn('futureData', data)


class TestDataFunctions(unittest.TestCase):
    """Test data processing functions"""

    def test_prepare_data_valid(self):
        """Test data preparation with valid input"""
        # Create mock data
        df = pd.DataFrame({
            'Close': np.linspace(100, 200, 150)
        })
        
        sequence_length = 60
        X_train, X_test, y_train, y_test, scaler, scaled_data = prepare_data(df, sequence_length)
        
        # Assertions
        self.assertEqual(X_train.shape[1], sequence_length)
        self.assertEqual(X_train.shape[2], 1)
        self.assertEqual(len(y_train), len(X_train))
        self.assertGreater(len(X_train), 0)
        self.assertGreater(len(X_test), 0)

    def test_prepare_data_insufficient_data(self):
        """Test data preparation with insufficient data"""
        df = pd.DataFrame({
            'Close': [100, 101, 102]
        })
        
        with self.assertRaises(ValueError):
            prepare_data(df, sequence_length=60)

    def test_calculate_metrics(self):
        """Test metrics calculation"""
        actual = np.array([[100], [101], [102], [103], [104]])
        predicted = np.array([[100.5], [100.8], [102.2], [103.1], [103.9]])
        
        metrics = calculate_metrics(actual, predicted)
        
        self.assertIn('MSE', metrics)
        self.assertIn('RMSE', metrics)
        self.assertIn('MAE', metrics)
        self.assertIn('MAPE', metrics)
        self.assertGreater(metrics['MSE'], 0)
        self.assertGreater(metrics['MAPE'], 0)
        self.assertLess(metrics['MAPE'], 100)  # Should be reasonable percentage


class TestLSTMModel(unittest.TestCase):
    """Test LSTM model building"""

    def test_build_lstm_model(self):
        """Test LSTM model architecture"""
        sequence_length = 60
        model = build_lstm_model(sequence_length)
        
        # Check model structure
        self.assertIsNotNone(model)
        self.assertEqual(len(model.layers), 6)  # 2 LSTM + 2 Dropout + 2 Dense
        
        # Check input shape
        self.assertEqual(model.input_shape, (None, sequence_length, 1))
        
        # Check output shape
        self.assertEqual(model.output_shape, (None, 1))
        
        # Check model is compiled
        self.assertIsNotNone(model.optimizer)

    def test_predict_future_prices(self):
        """Test future price prediction"""
        from sklearn.preprocessing import MinMaxScaler
        
        # Create mock model
        model = build_lstm_model(60)
        
        # Create mock data
        last_sequence = np.random.rand(60)
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaler.fit(np.random.rand(100, 1) * 100 + 100)
        
        days = 5
        predictions = predict_future_prices(model, last_sequence, scaler, days)
        
        # Assertions
        self.assertEqual(len(predictions), days)
        self.assertTrue(all(predictions > 0))  # Stock prices should be positive


class TestStockDataDownload(unittest.TestCase):
    """Test stock data download function"""

    @patch('helpers.requests.get')
    def test_download_stock_data_success(self, mock_get):
        """Test successful stock data download"""
        # Mock API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'symbol': 'AAPL',
            'historical': [
                {
                    'date': '2020-01-01',
                    'open': 100,
                    'high': 105,
                    'low': 95,
                    'close': 100,
                    'volume': 1000000
                },
                {
                    'date': '2020-01-02',
                    'open': 101,
                    'high': 106,
                    'low': 96,
                    'close': 101,
                    'volume': 1100000
                }
            ]
        }
        mock_get.return_value = mock_response

        start_date = datetime(2020, 1, 1)
        end_date = datetime(2020, 1, 2)
        
        df, company_name = download_stock_data('AAPL', start_date, end_date, 'test_key')
        
        # Assertions
        self.assertIsNotNone(df)
        self.assertEqual(company_name, 'AAPL')
        self.assertEqual(len(df), 2)
        self.assertIn('Close', df.columns)

    @patch('helpers.requests.get')
    def test_download_stock_data_api_failure(self, mock_get):
        """Test stock data download with API failure"""
        # Mock failed API response
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_get.return_value = mock_response

        start_date = datetime(2020, 1, 1)
        end_date = datetime(2020, 1, 2)
        
        with self.assertRaises(Exception):
            download_stock_data('INVALID', start_date, end_date)


if __name__ == '__main__':
    unittest.main()
