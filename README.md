# LSTM Stock Price Predictor

A full-stack web application that uses LSTM (Long Short-Term Memory) neural networks to predict stock prices. Built with React TypeScript frontend and Flask backend.

## 🚀 Features

- **Real-time Stock Data**: Fetches historical stock data from Financial Modeling Prep API
- **LSTM Neural Network**: Advanced AI model for time series prediction
- **Interactive Charts**: Visualize historical data and predictions with Recharts
- **Customizable Parameters**: Adjust sequence length, epochs, batch size, and prediction horizon
- **Accuracy Metrics**: View MAPE, RMSE, and MAE for model evaluation
- **Download Results**: Export predictions as CSV files
- **Type-Safe**: Full TypeScript implementation for frontend
- **Unit Tests**: Comprehensive test coverage for both backend and frontend
- **Docker Support**: Containerized deployment for consistent environments

## 📋 Prerequisites

### Standard Installation
- Python 3.11 or higher
- Node.js 18 or higher
- npm or yarn

### Docker Installation (Recommended)
- Docker Engine (see installation guides below) or Docker Desktop
- Docker Compose v2.0+
- At least 4GB RAM available

**Don't have Docker?** See [Docker Installation Guide](DOCKER.md#docker-installation-without-docker-desktop) for installing Docker Engine without Docker Desktop on Windows (WSL2), macOS (Colima), or Linux.

## 🛠️ Installation & Running

### Option 1: Docker (Recommended)

**Quick start with Docker Compose:**

**If using WSL2 on Windows:**
```bash
# Open Ubuntu terminal (or run: wsl -d Ubuntu)
cd /mnt/c/Git\ Repos/stonk-predictor

# Start Docker service
sudo service docker start

# Production build
sudo docker compose up -d

# Development build (with hot-reload)
sudo docker compose -f docker-compose.dev.yml up
```

**If using native Docker on Linux/macOS:**
```bash
# Navigate to project directory
cd stonk-predictor

# Production build
docker compose up -d

# Development build (with hot-reload)
docker compose -f docker-compose.dev.yml up
```

Access the application:
- Frontend: http://localhost (production) or http://localhost:3000 (dev)
- Backend API: http://localhost:5000

For detailed Docker instructions, see [DOCKER.md](DOCKER.md)

### Option 2: Manual Installation

#### Backend Setup (Flask)

1. Navigate to the server directory:
```bash
cd server
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows: `venv\Scripts\activate`
- macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run the Flask app:
```bash
python app.py
```

Backend runs on `http://localhost:5000`

#### Frontend Setup (React + TypeScript)

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
# or for development mode with hot-reload
npm run dev
```

Frontend runs on `http://localhost:3000`

For a complete quickstart guide, see [QUICKSTART.md](QUICKSTART.md)

## 📖 Usage

1. **Configure Parameters**: Use the sidebar to set:
   - Stock ticker symbol (e.g., AAPL, GOOGL, TSLA)
   - Date range for historical data
   - Model parameters (sequence length, epochs, batch size)
   - Number of future days to predict

2. **Optional API Key**: Get a free API key from [Financial Modeling Prep](https://financialmodelingprep.com/) for more reliable data access

3. **Run Prediction**: Click the "Run Prediction" button to:
   - Download stock data
   - Train the LSTM model
   - Generate predictions

4. **View Results**: Analyze:
   - Historical price chart
   - Prediction accuracy metrics
   - Future price predictions
   - Training progress

5. **Download Data**: Export predictions as CSV for further analysis

## 🏗️ Project Structure

```
stonk-predictor/
├── client/                      # React TypeScript frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── ConfigPanel.tsx
│   │   │   ├── StockChart.tsx
│   │   │   ├── MetricsDisplay.tsx
│   │   │   └── PredictionResults.tsx
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript type definitions
│   │   ├── tests/          # Unit tests
│   │   │   ├── App.test.tsx
│   │   │   ├── ConfigPanel.test.tsx
│   │   │   ├── MetricsDisplay.test.tsx
│   │   │   ├── StockChart.test.tsx
│   │   │   └── PredictionResults.test.tsx
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── index.tsx
│   ├── Dockerfile              # Production Docker build
│   ├── Dockerfile.dev          # Development Docker build
│   ├── nginx.conf              # Nginx configuration
│   ├── tsconfig.json           # TypeScript configuration
│   └── package.json
├── server/                     # Flask backend
│   ├── app.py                  # Flask API with LSTM model
│   ├── main.py                 # Original Streamlit app (legacy)
│   ├── test/                   # Unit tests
│   │   ├── test_app.py
│   │   ├── test_helpers.py
│   │   └── requirements-test.txt
│   ├── Dockerfile              # Backend Docker build
│   └── requirements.txt
├── docker-compose.yml          # Production orchestration
├── docker-compose.dev.yml      # Development orchestration
├── DOCKER.md                   # Docker deployment guide
├── TECHNICAL_README.md         # Technical architecture documentation
├── QUICKSTART.md               # Quick start guide
└── README.md
```

## 🔌 API Endpoints

### `GET /api/health`
Health check endpoint

### `POST /api/stock/data`
Fetch historical stock data
```json
{
  "ticker": "AAPL",
  "startDate": "2020-01-01",
  "endDate": "2025-01-21",
  "apiKey": "optional"
}
```

### `POST /api/predict`
Run LSTM prediction
```json
{
  "ticker": "AAPL",
  "startDate": "2020-01-01",
  "endDate": "2025-01-21",
  "apiKey": "optional",
  "sequenceLength": 60,
  "epochs": 50,
  "batchSize": 32,
  "predictionDays": 5
}
```

### `POST /api/download`
Download predictions as CSV

## 🧪 Testing

### Backend Tests

```bash
# Install test dependencies
cd server
pip install -r test/requirements-test.txt

# Run tests
pytest test/ -v

# Run with coverage
pytest test/ --cov=. --cov-report=html
```

### Frontend Tests

```bash
# Run tests
cd client
npm test

# Run with coverage
npm test -- --coverage --watchAll=false
```

### Docker Testing

```bash
# Backend tests in Docker
docker compose exec backend pytest test/ -v

# Frontend tests in Docker
docker compose -f docker-compose.dev.yml exec frontend npm test
```

## 📚 Documentation

- [DOCKER.md](DOCKER.md) - Complete Docker deployment guide
- [TECHNICAL_README.md](TECHNICAL_README.md) - Technical architecture and data flow
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide for developers

## 🙏 Acknowledgments

- Built with React, TypeScript, Flask, and TensorFlow
- Stock data provided by Financial Modeling Prep
- Charts powered by Recharts
- Containerized with Dockert rate)
- Dense layer (25 neurons, ReLU activation)
- Output layer (1 neuron for price prediction)
- Adam optimizer
- Mean Squared Error loss function

## ⚠️ Disclaimer

This tool is for educational purposes only. Stock market predictions are inherently uncertain, and this model should not be used as the sole basis for investment decisions. Always conduct your own research and consider consulting with financial professionals before making investment choices. Past performance does not guarantee future results.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with React, Flask, and TensorFlow
- Stock data provided by Financial Modeling Prep
- Charts powered by Recharts

---

Made with ❤️ by TradeDots