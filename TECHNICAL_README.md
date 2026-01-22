# LSTM Stock Predictor - Technical Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Data Flow](#data-flow)
3. [LSTM Model Architecture](#lstm-model-architecture)
4. [How the Model Works](#how-the-model-works)
5. [API Documentation](#api-documentation)
6. [Frontend Architecture](#frontend-architecture)
7. [Machine Learning Pipeline](#machine-learning-pipeline)

---

## System Architecture

The application follows a client-server architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React + TypeScript)       │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Config    │  │   Stock      │  │   Prediction     │   │
│  │  Panel     │  │   Charts     │  │   Results        │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
│                         ↓                                    │
│                   Axios HTTP Client                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API (JSON)
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Server Layer (Flask + Python)            │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  API       │  │   Data       │  │   LSTM Model     │   │
│  │  Endpoints │→ │   Fetcher    │→ │   Trainer        │   │
│  └────────────┘  └──────────────┘  └──────────────────┘   │
│                           ↓                  ↓               │
│                   Financial APIs      TensorFlow/Keras      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ↓
                  ┌───────────────────┐
                  │  External APIs    │
                  │  - FMP API        │
                  │  - Alpha Vantage  │
                  └───────────────────┘
```

---

## Data Flow

### Complete Request-Response Cycle

#### 1. User Configuration Flow
```
User Input → ConfigPanel Component → App State → API Request
```

**User Configures:**
- Stock ticker (e.g., AAPL)
- Date range (start/end dates)
- Model parameters:
  - Sequence length (30-120 days)
  - Training epochs (20-100)
  - Batch size (16, 32, or 64)
  - Prediction horizon (1-30 days)

#### 2. Data Fetching Flow
```
React → POST /api/stock/data → Flask → Financial API → Data Processing → Response
```

**Step-by-step:**
1. **React sends request** with ticker, dates, and optional API key
2. **Flask endpoint** validates parameters
3. **Data fetcher** attempts multiple sources:
   - Primary: Financial Modeling Prep (FMP) API
   - Fallback 1: FMP with timeseries parameter
   - Fallback 2: Alpha Vantage API
4. **Data processing:**
   - Convert to pandas DataFrame
   - Parse dates and set as index
   - Rename columns to standard format (Open, High, Low, Close, Volume)
   - Sort chronologically
5. **Calculate metrics:**
   - Current price (last closing price)
   - Daily change (vs previous day)
   - Period high/low
6. **Return JSON response** to React

#### 3. Prediction Flow
```
React → POST /api/predict → Data Preparation → Model Training → Predictions → Response
```

**Detailed breakdown:**

**A. Data Preparation (`prepare_data` function):**
```python
Raw Stock Data
    ↓
Extract Closing Prices (shape: [n, 1])
    ↓
Min-Max Normalization (scale to 0-1 range)
    ↓
Create Sequences:
  For i in range(sequence_length, len(data)):
    X[i] = prices[i-sequence_length : i]  # Input: last N days
    y[i] = prices[i]                       # Target: next day
    ↓
Split into Training (80%) and Testing (20%)
    ↓
Reshape for LSTM: (samples, sequence_length, features)
```

**B. Model Building (`build_lstm_model` function):**
```python
Input Layer: (sequence_length, 1)
    ↓
LSTM Layer 1: 50 units, return_sequences=True
    ↓
Dropout Layer: 20% (prevent overfitting)
    ↓
LSTM Layer 2: 50 units, return_sequences=False
    ↓
Dropout Layer: 20%
    ↓
Dense Layer: 25 units, ReLU activation
    ↓
Output Layer: 1 unit (predicted price)
```

**C. Training Process:**
```python
1. Compile model:
   - Optimizer: Adam
   - Loss function: Mean Squared Error (MSE)
   - Metrics: Mean Absolute Error (MAE)

2. Fit model:
   - Training data: X_train, y_train
   - Validation data: X_test, y_test
   - Batch size: configurable (16/32/64)
   - Epochs: configurable (20-100)
   - Early stopping: patience=10 on validation loss

3. Track history:
   - Training loss per epoch
   - Validation loss per epoch
```

**D. Making Predictions:**
```python
Historical Predictions:
  - Predict on training set → training predictions
  - Predict on test set → test predictions
  - Inverse transform to original price scale

Future Predictions:
  For each future day (1 to prediction_days):
    1. Take last sequence_length days
    2. Predict next day
    3. Append prediction to sequence
    4. Remove oldest day from sequence
    5. Repeat
```

**E. Metrics Calculation:**
```python
For training and test sets:
  MSE = mean((actual - predicted)²)
  RMSE = √MSE
  MAE = mean(|actual - predicted|)
  MAPE = mean(|actual - predicted| / actual) × 100%
```

#### 4. Response Flow
```
Flask Response → React State Update → UI Rendering
```

**React receives:**
- Historical data with predictions
- Future predictions
- Training/testing metrics
- Training history (loss curves)
- Model information
- Accuracy assessment

---

## LSTM Model Architecture

### Why LSTM for Stock Prediction?

**Traditional Neural Networks' Limitations:**
- Cannot remember information over time
- Treat each input independently
- Poor for sequential/time-series data

**LSTM Advantages:**
- **Memory cells**: Remember important patterns
- **Gates mechanism**: Control information flow
  - **Forget gate**: Decides what to discard
  - **Input gate**: Decides what new info to store
  - **Output gate**: Decides what to output
- **Long-term dependencies**: Can learn from patterns spanning many time steps

### Detailed Layer Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Input Layer                               │
│  Shape: (batch_size, 60, 1)                                  │
│  - 60 time steps (60 days of historical prices)              │
│  - 1 feature (closing price)                                 │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────┐
│              LSTM Layer 1 (Encoder)                          │
│  - 50 LSTM units                                             │
│  - return_sequences=True (output for each time step)         │
│  - Learns temporal patterns and relationships                │
│                                                              │
│  Hidden State Transition:                                    │
│  h_t = tanh(W_h · [h_{t-1}, x_t] + b_h)                     │
│  c_t = f_t * c_{t-1} + i_t * tanh(W_c · [h_{t-1}, x_t])    │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────┐
│                  Dropout Layer (20%)                          │
│  - Randomly drops 20% of connections                          │
│  - Prevents overfitting                                       │
│  - Forces network to learn robust features                    │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────┐
│              LSTM Layer 2 (Decoder)                          │
│  - 50 LSTM units                                             │
│  - return_sequences=False (only final output)                │
│  - Processes encoded sequence information                     │
│  - Extracts high-level features                              │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────┐
│                  Dropout Layer (20%)                          │
│  - Additional regularization                                  │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────┐
│              Dense Layer (25 units)                          │
│  - Fully connected layer                                     │
│  - ReLU activation: f(x) = max(0, x)                         │
│  - Non-linear transformation                                  │
│  - Feature extraction and combination                         │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ↓
┌──────────────────────────────────────────────────────────────┐
│              Output Layer (1 unit)                           │
│  - Linear activation (no activation function)                │
│  - Outputs: Predicted stock price                            │
└──────────────────────────────────────────────────────────────┘
```

### Training Process Details

#### 1. Forward Pass
```
Input Sequence (60 days)
    ↓
LSTM Layer 1 processes sequentially:
  Day 1: h_1, c_1 = LSTM(x_1, h_0, c_0)
  Day 2: h_2, c_2 = LSTM(x_2, h_1, c_1)
  ...
  Day 60: h_60, c_60 = LSTM(x_60, h_59, c_59)
    ↓
Dropout (training only)
    ↓
LSTM Layer 2: Final hidden state h_final
    ↓
Dropout (training only)
    ↓
Dense Layer: Linear transformation
    ↓
Output: Predicted price for day 61
```

#### 2. Loss Calculation
```python
Loss = MSE = (1/n) * Σ(actual_price - predicted_price)²
```

#### 3. Backward Pass (Backpropagation Through Time)
```
Calculate gradients:
  ∂Loss/∂W for each weight matrix
    ↓
Update weights using Adam optimizer:
  W_new = W_old - learning_rate * gradient
  (with momentum and adaptive learning rates)
```

#### 4. Validation
```
After each epoch:
  - Evaluate on validation set
  - Calculate validation loss
  - Early stopping if no improvement for 10 epochs
```

---

## How the Model Works

### Step-by-Step Prediction Process

#### Example: Predicting AAPL stock for next 5 days

**Input Data:**
```
Historical data: Jan 1, 2020 - Jan 21, 2026
Total days: ~1,500 trading days
```

**1. Data Normalization:**
```python
Original prices: [150.50, 151.20, 149.80, ...]
Normalized:      [0.45, 0.47, 0.43, ...]  # Scaled to [0, 1]
```

**2. Sequence Creation:**
```python
Sequence 1: Days [0:60]   → Predict Day 61
Sequence 2: Days [1:61]   → Predict Day 62
...
Sequence N: Days [N:N+60] → Predict Day N+61
```

**3. Training:**
```
Epoch 1: Loss = 0.0245, Val Loss = 0.0289
Epoch 2: Loss = 0.0198, Val Loss = 0.0245
...
Epoch 45: Loss = 0.0023, Val Loss = 0.0028
Early stopping triggered
```

**4. Prediction for Future Days:**

**Day 1 (Jan 22, 2026):**
```python
Input: Last 60 days [Dec 1, 2025 - Jan 21, 2026]
LSTM processing...
Output: $152.45 (predicted price)
```

**Day 2 (Jan 23, 2026):**
```python
Input: Last 60 days [Dec 2, 2025 - Jan 22, 2026]
  (includes Day 1 prediction)
LSTM processing...
Output: $153.10
```

**Day 3-5:** Repeat process, each time including previous predictions

**5. Denormalization:**
```python
Normalized: [0.48, 0.49, 0.47, 0.50, 0.51]
Original:   [$152.45, $153.10, $151.20, $154.80, $155.60]
```

### Model Accuracy Interpretation

The model provides several metrics to assess prediction quality:

#### MAPE (Mean Absolute Percentage Error)
```
MAPE = (1/n) * Σ|(actual - predicted) / actual| * 100%

Interpretation:
  < 5%:  Excellent - Very reliable predictions
  < 10%: Good - Reliable for general trends
  < 20%: Fair - Use with caution
  > 20%: Poor - Consider more data or different parameters
```

#### RMSE (Root Mean Squared Error)
```
RMSE = √[(1/n) * Σ(actual - predicted)²]

- Penalizes large errors more heavily
- Same unit as stock price ($)
- Lower is better
```

#### MAE (Mean Absolute Error)
```
MAE = (1/n) * Σ|actual - predicted|

- Average prediction error in dollars
- Easy to interpret
- Less sensitive to outliers than RMSE
```

---

## API Documentation

### Base URL
```
Development: http://localhost:5000
```

### Endpoints

#### 1. Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Flask server is running"
}
```

#### 2. Fetch Stock Data
```http
POST /api/stock/data
```

**Request Body:**
```json
{
  "ticker": "AAPL",
  "startDate": "2020-01-01",
  "endDate": "2026-01-21",
  "apiKey": "optional_api_key"
}
```

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "AAPL",
  "historicalData": [
    {
      "date": "2020-01-02",
      "open": 74.06,
      "high": 75.15,
      "low": 73.80,
      "close": 75.09,
      "volume": 135480400
    },
    ...
  ],
  "currentPrice": 152.45,
  "dailyChange": 2.35,
  "dailyChangePct": 1.57,
  "periodHigh": 195.80,
  "periodLow": 53.15,
  "dataPoints": 1500
}
```

#### 3. Run Prediction
```http
POST /api/predict
```

**Request Body:**
```json
{
  "ticker": "AAPL",
  "startDate": "2020-01-01",
  "endDate": "2026-01-21",
  "apiKey": "",
  "sequenceLength": 60,
  "epochs": 50,
  "batchSize": 32,
  "predictionDays": 5
}
```

**Response:**
```json
{
  "ticker": "AAPL",
  "companyName": "AAPL",
  "trainMetrics": {
    "MSE": 2.34,
    "RMSE": 1.53,
    "MAE": 1.12,
    "MAPE": 3.45
  },
  "testMetrics": {
    "MSE": 3.21,
    "RMSE": 1.79,
    "MAE": 1.34,
    "MAPE": 4.12
  },
  "historicalData": [
    {
      "date": "2020-01-02",
      "actual": 75.09,
      "predicted": null
    },
    ...
    {
      "date": "2026-01-21",
      "actual": 152.45,
      "predicted": 152.10
    }
  ],
  "futureData": [
    {
      "date": "2026-01-22",
      "predicted": 152.89
    },
    ...
  ],
  "trainingHistory": {
    "loss": [0.0245, 0.0198, ..., 0.0023],
    "valLoss": [0.0289, 0.0245, ..., 0.0028]
  },
  "accuracyStatus": "good",
  "accuracyMessage": "Good accuracy! MAPE < 10% indicates reliable predictions.",
  "modelInfo": {
    "sequenceLength": 60,
    "epochs": 45,
    "trainSamples": 1152,
    "testSamples": 288
  }
}
```

#### 4. Download Predictions
```http
POST /api/download
```

**Request Body:**
```json
{
  "results": [...],  // Historical data with predictions
  "ticker": "AAPL"
}
```

**Response:**
```json
{
  "csv": "Date,Actual_Price,Predicted_Price\n2020-01-02,75.09,\n...",
  "filename": "AAPL_lstm_predictions.csv"
}
```

---

## Frontend Architecture

### Technology Stack
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Recharts**: Data visualization
- **Axios**: HTTP client
- **CSS3**: Styling

### Component Hierarchy
```
App (Root)
├── ConfigPanel (Configuration sidebar)
├── StockChart (Price visualization)
├── MetricsDisplay (Accuracy metrics)
└── PredictionResults (Future predictions & model info)
```

### State Management
```typescript
interface AppState {
  loading: boolean;              // Loading state
  error: string | null;          // Error messages
  stockData: StockDataResponse;  // Initial stock data
  predictionResults: PredictionResponse;  // Model results
  status: string;                // Status messages
}
```

### Type System
All data structures are strongly typed:
- `PredictionConfig`: User input configuration
- `StockDataResponse`: Stock data from API
- `PredictionResponse`: Complete prediction results
- `PredictionMetrics`: Accuracy metrics
- `HistoricalDataWithPrediction`: Chart data
- `FutureDataItem`: Future predictions

---

## Machine Learning Pipeline

### Complete ML Workflow

```
1. Data Acquisition
   ↓
2. Data Preprocessing
   ├── Cleaning (handle missing values)
   ├── Normalization (Min-Max scaling)
   └── Sequence generation
   ↓
3. Train/Test Split (80/20)
   ↓
4. Model Architecture Definition
   ↓
5. Model Compilation
   ├── Optimizer: Adam
   ├── Loss: MSE
   └── Metrics: MAE
   ↓
6. Training
   ├── Mini-batch gradient descent
   ├── Early stopping
   └── History tracking
   ↓
7. Evaluation
   ├── Training metrics
   └── Test metrics
   ↓
8. Future Prediction
   ├── Recursive forecasting
   └── Denormalization
   ↓
9. Results Visualization
```

### Key Hyperparameters

| Parameter | Default | Range | Impact |
|-----------|---------|-------|--------|
| Sequence Length | 60 | 30-120 | More history = better patterns, but slower |
| Epochs | 50 | 20-100 | More epochs = better fit, risk overfitting |
| Batch Size | 32 | 16-64 | Larger = faster training, less precise |
| LSTM Units | 50 | 25-100 | More units = more capacity, slower |
| Dropout Rate | 0.2 | 0.1-0.5 | Higher = more regularization |

### Best Practices

1. **Data Quality:**
   - Use at least 2 years of historical data
   - Ensure data continuity (no large gaps)
   - Verify data source reliability

2. **Model Tuning:**
   - Start with default parameters
   - Adjust sequence length based on stock volatility
   - Increase epochs if training loss is still decreasing
   - Use early stopping to prevent overfitting

3. **Interpretation:**
   - Always check MAPE for accuracy assessment
   - Compare training vs test metrics (large difference = overfitting)
   - View training history for convergence
   - Consider predictions as guidance, not certainty

4. **Limitations:**
   - Cannot predict black swan events
   - Market sentiment not captured
   - External factors (news, regulations) not included
   - Works best for short-term predictions (1-7 days)

---

## Performance Optimization

### Backend Optimizations
- Early stopping prevents unnecessary training
- Batch processing for efficiency
- Caching could be added for repeated requests
- Async processing for multiple predictions

### Frontend Optimizations
- Component memoization with React.memo
- Lazy loading for charts
- Debounced API calls
- Progressive data loading

---

## Security Considerations

1. **API Keys:** Never hardcode, use environment variables
2. **CORS:** Configured for localhost, adjust for production
3. **Input Validation:** All inputs validated on backend
4. **Rate Limiting:** Consider adding for production
5. **Error Handling:** Comprehensive error messages without exposing internals

---

## Future Enhancements

1. **Model Improvements:**
   - Multi-feature inputs (volume, technical indicators)
   - Attention mechanisms
   - Ensemble models
   - Transfer learning

2. **Features:**
   - Model persistence (save/load trained models)
   - Comparison of multiple stocks
   - Real-time predictions
   - Technical indicators overlay
   - Sentiment analysis integration

3. **Infrastructure:**
   - Model training queue
   - Distributed training
   - Model versioning
   - A/B testing framework

---

## References

- **LSTM Paper:** Hochreiter & Schmidhuber (1997) - "Long Short-Term Memory"
- **Time Series Forecasting:** Jason Brownlee's guides
- **TensorFlow/Keras Documentation:** https://www.tensorflow.org/
- **Financial Data APIs:** FMP, Alpha Vantage documentation

---

**Note:** This is an educational project. Stock predictions are inherently uncertain. Always conduct proper research and consult financial advisors before making investment decisions.
