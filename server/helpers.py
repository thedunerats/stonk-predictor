"""
Helper functions for LSTM stock prediction model.
Contains data processing, model building, and metric calculation functions.
"""

import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout


def download_stock_data(ticker, start_date, end_date, api_key=""):
    """Download stock data from Financial Modeling Prep API
    
    Args:
        ticker (str): Stock ticker symbol
        start_date (datetime): Start date for historical data
        end_date (datetime): End date for historical data
        api_key (str): API key for Financial Modeling Prep (default: "demo")
        
    Returns:
        tuple: (DataFrame with stock data, company name)
        
    Raises:
        Exception: If data cannot be fetched from any source
    """
    try:
        if not api_key:
            api_key = "demo"
        
        start_str = start_date.strftime('%Y-%m-%d')
        end_str = end_date.strftime('%Y-%m-%d')
        
        # Try FMP historical price API
        try:
            url = f"https://financialmodelingprep.com/api/v3/historical-price-full/{ticker}"
            params = {
                'from': start_str,
                'to': end_str,
                'apikey': api_key
            }
            
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'historical' in data and data['historical']:
                    df = pd.DataFrame(data['historical'])
                    df['date'] = pd.to_datetime(df['date'])
                    df.set_index('date', inplace=True)
                    df.sort_index(inplace=True)
                    
                    column_mapping = {
                        'open': 'Open',
                        'high': 'High', 
                        'low': 'Low',
                        'close': 'Close',
                        'volume': 'Volume'
                    }
                    df.rename(columns=column_mapping, inplace=True)
                    
                    company_name = data.get('symbol', ticker)
                    
                    return df, company_name
                else:
                    raise Exception("No historical data found in API response")
            else:
                raise Exception(f"API request failed with status {response.status_code}")
                
        except Exception as e1:
            # Try with timeseries parameter
            try:
                url = f"https://financialmodelingprep.com/api/v3/historical-price-full/{ticker}"
                params = {
                    'timeseries': 1500,
                    'apikey': api_key
                }
                
                response = requests.get(url, params=params, timeout=30)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if 'historical' in data and data['historical']:
                        df = pd.DataFrame(data['historical'])
                        df['date'] = pd.to_datetime(df['date'])
                        df.set_index('date', inplace=True)
                        df.sort_index(inplace=True)
                        
                        # Filter to requested date range
                        df = df.loc[start_date:end_date]
                        
                        if df.empty:
                            raise Exception("No data in requested date range")
                        
                        column_mapping = {
                            'open': 'Open',
                            'high': 'High', 
                            'low': 'Low',
                            'close': 'Close',
                            'volume': 'Volume'
                        }
                        df.rename(columns=column_mapping, inplace=True)
                        
                        company_name = data.get('symbol', ticker)
                        return df, company_name
                    else:
                        raise Exception("No historical data found")
                else:
                    raise Exception(f"Fallback API request failed with status {response.status_code}")
                    
            except Exception as e2:
                # Try Alpha Vantage as backup
                try:
                    av_url = "https://www.alphavantage.co/query"
                    av_params = {
                        'function': 'TIME_SERIES_DAILY',
                        'symbol': ticker,
                        'outputsize': 'full',
                        'apikey': 'demo'
                    }
                    
                    response = requests.get(av_url, params=av_params, timeout=30)
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        if 'Time Series (Daily)' in data:
                            time_series = data['Time Series (Daily)']
                            
                            df = pd.DataFrame(time_series).T
                            df.index = pd.to_datetime(df.index)
                            df.sort_index(inplace=True)
                            
                            for col in df.columns:
                                df[col] = pd.to_numeric(df[col], errors='coerce')
                            
                            df.rename(columns={
                                '1. open': 'Open',
                                '2. high': 'High',
                                '3. low': 'Low',
                                '4. close': 'Close',
                                '5. volume': 'Volume'
                            }, inplace=True)
                            
                            df = df.loc[start_date:end_date]
                            
                            if df.empty:
                                raise Exception("No data in Alpha Vantage date range")
                            
                            return df, ticker
                        else:
                            raise Exception("No time series data from Alpha Vantage")
                    else:
                        raise Exception(f"Alpha Vantage request failed with status {response.status_code}")
                        
                except Exception as e3:
                    raise Exception(f"All data sources failed: FMP: {str(e1)}, Fallback: {str(e2)}, AV: {str(e3)}")
                
    except Exception as e:
        raise Exception(f"Critical error downloading {ticker}: {str(e)}")


def prepare_data(data, sequence_length):
    """Prepare data for LSTM training
    
    Args:
        data (DataFrame): Stock data with 'Close' column
        sequence_length (int): Number of time steps to use for prediction
        
    Returns:
        tuple: (X_train, X_test, y_train, y_test, scaler, scaled_data)
        
    Raises:
        ValueError: If insufficient data for given sequence length
    """
    if len(data) < sequence_length + 1:
        raise ValueError(f"Not enough data. Need at least {sequence_length + 1} days, got {len(data)}")
    
    prices = data['Close'].values.reshape(-1, 1)
    
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(prices)
    
    X, y = [], []
    for i in range(sequence_length, len(scaled_data)):
        X.append(scaled_data[i-sequence_length:i, 0])
        y.append(scaled_data[i, 0])
    
    X, y = np.array(X), np.array(y)
    
    split_point = max(int(len(X) * 0.8), 1)
    X_train, X_test = X[:split_point], X[split_point:]
    y_train, y_test = y[:split_point], y[split_point:]
    
    X_train = X_train.reshape((X_train.shape[0], X_train.shape[1], 1))
    X_test = X_test.reshape((X_test.shape[0], X_test.shape[1], 1))
    
    return X_train, X_test, y_train, y_test, scaler, scaled_data


def build_lstm_model(sequence_length):
    """Build LSTM model architecture
    
    Args:
        sequence_length (int): Number of time steps for input
        
    Returns:
        Sequential: Compiled Keras LSTM model
    """
    model = Sequential([
        LSTM(50, return_sequences=True, input_shape=(sequence_length, 1)),
        Dropout(0.2),
        LSTM(50, return_sequences=False),
        Dropout(0.2),
        Dense(25, activation='relu'),
        Dense(1)
    ])
    
    model.compile(optimizer='adam', loss='mean_squared_error', metrics=['mae'])
    return model


def calculate_metrics(actual, predicted):
    """Calculate prediction metrics
    
    Args:
        actual (array): Actual values
        predicted (array): Predicted values
        
    Returns:
        dict: Dictionary containing MSE, RMSE, MAE, and MAPE
    """
    mse = np.mean((actual - predicted) ** 2)
    rmse = np.sqrt(mse)
    mae = np.mean(np.abs(actual - predicted))
    mape = np.mean(np.abs((actual - predicted) / actual)) * 100
    
    return {
        'MSE': float(mse),
        'RMSE': float(rmse),
        'MAE': float(mae),
        'MAPE': float(mape)
    }


def predict_future_prices(model, last_sequence, scaler, days):
    """Predict future prices using trained model
    
    Args:
        model (Sequential): Trained LSTM model
        last_sequence (array): Last sequence of scaled prices
        scaler (MinMaxScaler): Scaler used for data normalization
        days (int): Number of days to predict
        
    Returns:
        array: Predicted prices for future days
    """
    predictions = []
    current_sequence = last_sequence.copy()
    
    for _ in range(days):
        next_pred = model.predict(current_sequence.reshape(1, -1, 1), verbose=0)
        predictions.append(next_pred[0, 0])
        current_sequence = np.append(current_sequence[1:], next_pred[0, 0])
    
    predictions = scaler.inverse_transform(np.array(predictions).reshape(-1, 1))
    return predictions.flatten()
