# Quick Start Guide - LSTM Stock Predictor

## ✅ Application Status

**Backend (Flask):** ✅ Running on http://localhost:5000  
**Frontend (React + TypeScript):** ✅ Running on http://localhost:3000

Both servers are now active and ready to use!

## 🎯 What Was Done

### 1. **Backend Setup (Flask API)**
- Converted Streamlit app to REST API
- Created 3 main endpoints:
  - `/api/health` - Server health check
  - `/api/stock/data` - Fetch historical stock data
  - `/api/predict` - Run LSTM predictions
  - `/api/download` - Download predictions as CSV
- Installed dependencies: Flask, TensorFlow, pandas, scikit-learn, etc.

### 2. **Frontend Conversion (JavaScript → TypeScript)**
- ✅ Converted all `.js` files to `.tsx`
- ✅ Created comprehensive type definitions in `src/types/index.ts`
- ✅ Added `tsconfig.json` for TypeScript configuration
- ✅ Fixed all TypeScript type errors
- **Benefits of TypeScript:**
  - Type safety prevents runtime errors
  - Better IntelliSense/autocomplete
  - Easier refactoring
  - Self-documenting code

### 3. **Technical Documentation**
- Created `TECHNICAL_README.md` with:
  - Complete system architecture diagram
  - Data flow visualization
  - LSTM model architecture explained
  - Step-by-step how the model works
  - API documentation with examples
  - ML pipeline details
  - Best practices and optimization tips

## 📂 Project Structure

```
stonk-predictor/
├── client/                          # React + TypeScript Frontend
│   ├── src/
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript type definitions
│   │   ├── components/
│   │   │   ├── ConfigPanel.tsx     # Configuration sidebar
│   │   │   ├── StockChart.tsx      # Interactive charts
│   │   │   ├── MetricsDisplay.tsx  # Accuracy metrics
│   │   │   └── PredictionResults.tsx # Future predictions
│   │   ├── App.tsx                 # Main application
│   │   └── index.tsx               # Entry point
│   ├── tsconfig.json               # TypeScript configuration
│   └── package.json
│
├── server/                          # Flask Backend
│   ├── app.py                       # Flask API (NEW)
│   ├── main.py                      # Original Streamlit app (LEGACY)
│   └── requirements.txt
│
├── README.md                        # User documentation
└── TECHNICAL_README.md              # Technical deep-dive (NEW)
```

## 🚀 How to Use the Application

### Open the App
Navigate to: **http://localhost:3000**

### Configure Parameters (Left Sidebar)
1. **Stock Ticker:** Enter any stock symbol (AAPL, GOOGL, TSLA, etc.)
2. **Date Range:** Select historical data period
3. **Model Parameters:**
   - Sequence Length: 30-120 days (default: 60)
   - Training Epochs: 20-100 (default: 50)
   - Batch Size: 16, 32, or 64 (default: 32)
   - Prediction Days: 1-30 days ahead (default: 5)

### Run Prediction
1. Click **"🚀 Run Prediction"** button
2. Wait for:
   - Data download
   - Model training
   - Prediction generation
3. View results:
   - Historical price chart with predictions
   - Training/testing accuracy metrics (MAPE, RMSE, MAE)
   - Future price predictions table
   - Training progress chart
   - Model information

### Download Results
Click **"📥 Download Predictions CSV"** to export data

## 📊 Understanding the Results

### Accuracy Metrics (MAPE)
- **< 5%** 🟢 Excellent - Very reliable predictions
- **< 10%** 🟢 Good - Reliable for general trends  
- **< 20%** 🟡 Fair - Use with caution
- **> 20%** 🔴 Poor - Consider more data or different parameters

### Charts
1. **Historical Prices:** Blue line (actual stock prices)
2. **Model Predictions:** Green line (LSTM predictions on test data)
3. **Future Predictions:** Green dots/line (forecasted prices)
4. **Training Progress:** Shows model learning over epochs

## 🔧 TypeScript Features Added

### Type Definitions (`src/types/index.ts`)
```typescript
interface PredictionConfig {
  apiKey: string;
  ticker: string;
  startDate: string;
  endDate: string;
  sequenceLength: number;
  epochs: number;
  batchSize: number;
  predictionDays: number;
}

interface PredictionResponse {
  ticker: string;
  companyName: string;
  trainMetrics: PredictionMetrics;
  testMetrics: PredictionMetrics;
  // ... and more
}
```

### Component Props
All components now have strongly-typed props:
```typescript
interface ConfigPanelProps {
  onPredict: (config: PredictionConfig) => void;
  loading: boolean;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ onPredict, loading }) => {
  // Component logic
}
```

## 📖 Documentation

### For Users
- **README.md** - Installation, usage, and basic information

### For Developers  
- **TECHNICAL_README.md** - Comprehensive technical documentation:
  - System architecture
  - Data flow diagrams
  - LSTM model explained
  - How predictions work
  - API documentation
  - ML pipeline details
  - Performance optimization
  - Best practices

## 🎓 Learning Resources

### In TECHNICAL_README.md
- Visual diagrams of data flow
- Step-by-step prediction process
- LSTM architecture breakdown
- Training process explained
- Example predictions with real numbers
- Hyperparameter tuning guide

### LSTM Model Basics
The model uses:
- **2 LSTM layers** (50 units each) - Learn temporal patterns
- **Dropout layers** (20%) - Prevent overfitting
- **Dense layer** (25 units) - Feature extraction
- **Output layer** (1 unit) - Price prediction

### How It Works
1. Takes last 60 days of prices
2. Learns patterns and relationships
3. Predicts next day's price
4. Repeats for future days

## ⚠️ Important Notes

- This is an **educational project** for learning ML/AI
- Stock predictions are **inherently uncertain**
- **Not financial advice** - always do your own research
- Use predictions as **guidance**, not certainty
- Best for **short-term trends** (1-7 days)

## 🔍 Troubleshooting

### Backend Issues
- Check Flask is running on port 5000
- Verify Python dependencies installed
- Check terminal for error messages

### Frontend Issues
- Check React is running on port 3000
- Clear browser cache if stale data
- Check browser console for errors

### TypeScript Errors
- All type errors have been fixed
- Types are defined in `src/types/index.ts`
- If you see new errors, check prop types match

## 🎉 Success!

Your LSTM Stock Predictor is now:
- ✅ Running with Flask backend
- ✅ Converted to TypeScript
- ✅ Fully documented
- ✅ Ready to use!

Try predicting some stocks and explore the technical documentation to learn how it all works!

---

**Next Steps:**
1. Try different stocks and date ranges
2. Experiment with model parameters
3. Read TECHNICAL_README.md for deep understanding
4. Explore the code and make improvements!
