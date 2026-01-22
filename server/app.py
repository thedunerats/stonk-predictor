from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from tensorflow.keras.callbacks import EarlyStopping
import warnings
import io

from helpers import (
    download_stock_data,
    prepare_data,
    build_lstm_model,
    calculate_metrics,
    predict_future_prices
)

warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend


# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'message': 'Flask server is running'})


@app.route('/api/stock/data', methods=['POST'])
def get_stock_data():
    """Endpoint to fetch stock data"""
    try:
        data = request.json
        ticker = data.get('ticker', 'AAPL').upper()
        start_date = datetime.strptime(data.get('startDate'), '%Y-%m-%d')
        end_date = datetime.strptime(data.get('endDate'), '%Y-%m-%d')
        api_key = data.get('apiKey', '')
        
        df, company_name = download_stock_data(ticker, start_date, end_date, api_key)
        
        if df is None or df.empty:
            return jsonify({'error': 'Could not fetch stock data'}), 400
        
        # Convert DataFrame to JSON-serializable format
        historical_data = []
        for date, row in df.iterrows():
            historical_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'open': float(row['Open']),
                'high': float(row['High']),
                'low': float(row['Low']),
                'close': float(row['Close']),
                'volume': int(row['Volume']) if 'Volume' in row else 0
            })
        
        # Calculate basic metrics
        current_price = float(df['Close'].iloc[-1])
        prev_price = float(df['Close'].iloc[-2]) if len(df) > 1 else current_price
        daily_change = current_price - prev_price
        daily_change_pct = (daily_change / prev_price * 100) if prev_price != 0 else 0
        
        return jsonify({
            'ticker': ticker,
            'companyName': company_name,
            'historicalData': historical_data,
            'currentPrice': current_price,
            'dailyChange': daily_change,
            'dailyChangePct': daily_change_pct,
            'periodHigh': float(df['Close'].max()),
            'periodLow': float(df['Close'].min()),
            'dataPoints': len(df)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/predict', methods=['POST'])
def predict():
    """Endpoint to run LSTM prediction"""
    try:
        data = request.json
        ticker = data.get('ticker', 'AAPL').upper()
        start_date = datetime.strptime(data.get('startDate'), '%Y-%m-%d')
        end_date = datetime.strptime(data.get('endDate'), '%Y-%m-%d')
        api_key = data.get('apiKey', '')
        sequence_length = int(data.get('sequenceLength', 60))
        epochs = int(data.get('epochs', 50))
        batch_size = int(data.get('batchSize', 32))
        prediction_days = int(data.get('predictionDays', 5))
        
        # Download data
        df, company_name = download_stock_data(ticker, start_date, end_date, api_key)
        
        if df is None or df.empty:
            return jsonify({'error': 'Could not fetch stock data'}), 400
        
        # Prepare data
        X_train, X_test, y_train, y_test, scaler, scaled_data = prepare_data(df, sequence_length)
        
        # Build and train model
        model = build_lstm_model(sequence_length)
        early_stopping = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)
        
        history = model.fit(
            X_train, y_train,
            batch_size=batch_size,
            epochs=epochs,
            validation_data=(X_test, y_test),
            verbose=0,
            callbacks=[early_stopping]
        )
        
        # Make predictions
        train_predictions = model.predict(X_train, verbose=0)
        test_predictions = model.predict(X_test, verbose=0)
        
        # Convert back to original scale
        train_predictions = scaler.inverse_transform(train_predictions)
        test_predictions = scaler.inverse_transform(test_predictions)
        y_train_actual = scaler.inverse_transform(y_train.reshape(-1, 1))
        y_test_actual = scaler.inverse_transform(y_test.reshape(-1, 1))
        
        # Calculate metrics
        train_metrics = calculate_metrics(y_train_actual, train_predictions)
        test_metrics = calculate_metrics(y_test_actual, test_predictions)
        
        # Predict future prices
        last_sequence = scaled_data[-sequence_length:]
        future_predictions = predict_future_prices(model, last_sequence, scaler, prediction_days)
        
        # Prepare historical data with predictions
        historical_data = []
        for i, (date, row) in enumerate(df.iterrows()):
            item = {
                'date': date.strftime('%Y-%m-%d'),
                'actual': float(row['Close']),
                'predicted': None
            }
            
            # Add training predictions
            if i >= sequence_length and i < sequence_length + len(train_predictions):
                pred_idx = i - sequence_length
                if pred_idx < len(train_predictions):
                    item['predicted'] = float(train_predictions[pred_idx][0])
            
            # Add test predictions
            split_point = int(len(df) * 0.8)
            test_start = max(sequence_length, split_point)
            if i >= test_start and i < test_start + len(test_predictions):
                pred_idx = i - test_start
                if pred_idx < len(test_predictions):
                    item['predicted'] = float(test_predictions[pred_idx][0])
            
            historical_data.append(item)
        
        # Prepare future predictions
        last_date = df.index[-1]
        future_data = []
        for i in range(prediction_days):
            future_date = last_date + pd.Timedelta(days=i+1)
            future_data.append({
                'date': future_date.strftime('%Y-%m-%d'),
                'predicted': float(future_predictions[i])
            })
        
        # Calculate accuracy interpretation
        mape = test_metrics['MAPE']
        if mape < 5:
            accuracy_status = 'excellent'
            accuracy_message = 'Excellent accuracy! MAPE < 5% indicates very reliable predictions.'
        elif mape < 10:
            accuracy_status = 'good'
            accuracy_message = 'Good accuracy! MAPE < 10% indicates reliable predictions.'
        elif mape < 20:
            accuracy_status = 'fair'
            accuracy_message = 'Fair accuracy. Use predictions with caution.'
        else:
            accuracy_status = 'poor'
            accuracy_message = 'Poor accuracy. Consider using more data or different parameters.'
        
        return jsonify({
            'ticker': ticker,
            'companyName': company_name,
            'trainMetrics': train_metrics,
            'testMetrics': test_metrics,
            'historicalData': historical_data,
            'futureData': future_data,
            'trainingHistory': {
                'loss': [float(x) for x in history.history['loss']],
                'valLoss': [float(x) for x in history.history['val_loss']]
            },
            'accuracyStatus': accuracy_status,
            'accuracyMessage': accuracy_message,
            'modelInfo': {
                'sequenceLength': sequence_length,
                'epochs': len(history.history['loss']),
                'trainSamples': len(X_train),
                'testSamples': len(X_test)
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/download', methods=['POST'])
def download_predictions():
    """Endpoint to download predictions as CSV"""
    try:
        data = request.json
        results = data.get('results', [])
        ticker = data.get('ticker', 'STOCK')
        
        # Create DataFrame
        df = pd.DataFrame(results)
        
        # Convert to CSV
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        # Create response
        return jsonify({
            'csv': output.getvalue(),
            'filename': f"{ticker}_lstm_predictions.csv"
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    app.run(debug=True, port=5000)
