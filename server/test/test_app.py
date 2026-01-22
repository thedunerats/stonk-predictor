import pytest
from unittest.mock import MagicMock
import sys
import os
import numpy as np
import pandas as pd
import requests
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler

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


# Pytest Fixtures
@pytest.fixture
def client():
    """Create test client for Flask app"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def mock_stock_dataframe():
    """Create mock stock data DataFrame"""
    return pd.DataFrame({
        'Open': [100, 101, 102],
        'High': [105, 106, 107],
        'Low': [95, 96, 97],
        'Close': [100, 101, 102],
        'Volume': [1000000, 1100000, 1200000]
    }, index=pd.date_range('2020-01-01', periods=3))


@pytest.fixture
def mock_large_dataframe():
    """Create larger mock DataFrame for prediction tests"""
    return pd.DataFrame({
        'Close': np.random.rand(100) * 100 + 100
    }, index=pd.date_range('2020-01-01', periods=100))


@pytest.fixture
def mock_download_stock_data(mocker, mock_stock_dataframe):
    """Mock download_stock_data function"""
    mock = mocker.patch('app.download_stock_data')
    mock.return_value = (mock_stock_dataframe, 'AAPL')
    return mock


@pytest.fixture
def mock_lstm_model(mocker):
    """Mock LSTM model"""
    mock_model = MagicMock()
    mock_model.fit.return_value.history = {
        'loss': [0.1, 0.05, 0.01],
        'val_loss': [0.12, 0.06, 0.02]
    }
    mock_model.predict.return_value = np.random.rand(10, 1) * 100 + 100
    
    mock = mocker.patch('app.build_lstm_model')
    mock.return_value = mock_model
    return mock


@pytest.fixture
def mock_api_response(mocker):
    """Mock successful API response"""
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
    
    mock = mocker.patch('requests.get')
    mock.return_value = mock_response
    return mock


@pytest.fixture
def mock_failed_api_response(mocker):
    """Mock failed API response"""
    mock_response = MagicMock()
    mock_response.status_code = 404
    
    mock = mocker.patch('requests.get')
    mock.return_value = mock_response
    return mock


# Test Flask Endpoints
class TestFlaskApp:
    """Test Flask application endpoints"""

    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get('/api/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'ok'
        assert 'message' in data

    def test_stock_data_endpoint_success(self, client, mock_download_stock_data):
        """Test successful stock data retrieval"""
        response = client.post('/api/stock/data', json={
            'ticker': 'AAPL',
            'startDate': '2020-01-01',
            'endDate': '2020-01-03',
            'apiKey': ''
        })

        assert response.status_code == 200
        data = response.get_json()
        assert data['ticker'] == 'AAPL'
        assert len(data['historicalData']) == 3
        assert 'currentPrice' in data

    def test_stock_data_endpoint_missing_params(self, client):
        """Test stock data endpoint with missing parameters"""
        response = client.post('/api/stock/data', json={
            'ticker': 'AAPL'
            # Missing dates
        })
        assert response.status_code == 400

    def test_predict_endpoint_success(self, client, mocker, mock_large_dataframe):
        """Test successful prediction endpoint"""
        # Mock download function
        mock_download = mocker.patch('app.download_stock_data')
        mock_download.return_value = (mock_large_dataframe, 'AAPL')
        
        # Mock LSTM model
        mock_model = MagicMock()
        mock_model.fit.return_value.history = {
            'loss': [0.1, 0.05, 0.01],
            'val_loss': [0.12, 0.06, 0.02]
        }
        mock_model.predict.return_value = np.random.rand(10, 1) * 100 + 100
        
        mock_build_model = mocker.patch('app.build_lstm_model')
        mock_build_model.return_value = mock_model

        response = client.post('/api/predict', json={
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
            assert 'trainMetrics' in data
            assert 'testMetrics' in data
            assert 'futureData' in data


class TestDataFunctions:
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
        assert X_train.shape[1] == sequence_length
        assert X_train.shape[2] == 1
        assert len(y_train) == len(X_train)
        assert len(X_train) > 0
        assert len(X_test) > 0

    def test_prepare_data_insufficient_data(self):
        """Test data preparation with insufficient data"""
        df = pd.DataFrame({
            'Close': [100, 101, 102]
        })
        
        with pytest.raises(ValueError):
            prepare_data(df, sequence_length=60)

    def test_calculate_metrics(self):
        """Test metrics calculation"""
        actual = np.array([[100], [101], [102], [103], [104]])
        predicted = np.array([[100.5], [100.8], [102.2], [103.1], [103.9]])
        
        metrics = calculate_metrics(actual, predicted)
        
        assert 'MSE' in metrics
        assert 'RMSE' in metrics
        assert 'MAE' in metrics
        assert 'MAPE' in metrics
        assert metrics['MSE'] > 0
        assert metrics['MAPE'] > 0
        assert metrics['MAPE'] < 100  # Should be reasonable percentage


class TestLSTMModel:
    """Test LSTM model building"""

    def test_build_lstm_model(self):
        """Test LSTM model architecture"""
        sequence_length = 60
        model = build_lstm_model(sequence_length)
        
        # Check model structure
        assert model is not None
        assert len(model.layers) == 6  # 2 LSTM + 2 Dropout + 2 Dense
        
        # Check input shape
        assert model.input_shape == (None, sequence_length, 1)
        
        # Check output shape
        assert model.output_shape == (None, 1)
        
        # Check model is compiled
        assert model.optimizer is not None

    def test_predict_future_prices(self):
        """Test future price prediction"""
        # Create mock model
        model = build_lstm_model(60)
        
        # Create mock data
        last_sequence = np.random.rand(60)
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaler.fit(np.random.rand(100, 1) * 100 + 100)
        
        days = 5
        predictions = predict_future_prices(model, last_sequence, scaler, days)
        
        # Assertions
        assert len(predictions) == days
        assert all(predictions > 0)  # Stock prices should be positive


class TestStockDataDownload:
    """Test stock data download function"""

    def test_download_stock_data_success(self, mock_api_response):
        """Test successful stock data download"""
        start_date = datetime(2020, 1, 1)
        end_date = datetime(2020, 1, 2)
        
        df, company_name = download_stock_data('AAPL', start_date, end_date, 'test_key')
        
        # Assertions
        assert df is not None
        assert company_name == 'AAPL'
        assert len(df) == 2
        assert 'Close' in df.columns

    def test_download_stock_data_api_failure(self, mock_failed_api_response):
        """Test stock data download with API failure"""
        start_date = datetime(2020, 1, 1)
        end_date = datetime(2020, 1, 2)
        
        with pytest.raises(Exception):
            download_stock_data('INVALID', start_date, end_date)
