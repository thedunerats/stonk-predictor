import unittest
import sys
import os
import numpy as np
import pandas as pd
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import calculate_metrics, prepare_data


class TestMetricsCalculation(unittest.TestCase):
    """Test metrics calculation accuracy"""

    def test_mse_calculation(self):
        """Test Mean Squared Error calculation"""
        actual = np.array([[100], [101], [102]])
        predicted = np.array([[100], [101], [102]])
        
        metrics = calculate_metrics(actual, predicted)
        
        # Perfect prediction should have MSE close to 0
        self.assertAlmostEqual(metrics['MSE'], 0, places=5)

    def test_rmse_calculation(self):
        """Test Root Mean Squared Error calculation"""
        actual = np.array([[100], [104]])
        predicted = np.array([[100], [100]])
        
        metrics = calculate_metrics(actual, predicted)
        
        # RMSE should be sqrt((0 + 16)/2) = sqrt(8) ≈ 2.83
        self.assertAlmostEqual(metrics['RMSE'], 2.83, places=1)

    def test_mae_calculation(self):
        """Test Mean Absolute Error calculation"""
        actual = np.array([[100], [105], [110]])
        predicted = np.array([[101], [104], [111]])
        
        metrics = calculate_metrics(actual, predicted)
        
        # MAE should be (1 + 1 + 1) / 3 = 1
        self.assertAlmostEqual(metrics['MAE'], 1.0, places=5)

    def test_mape_calculation(self):
        """Test Mean Absolute Percentage Error calculation"""
        actual = np.array([[100], [200]])
        predicted = np.array([[110], [190]])
        
        metrics = calculate_metrics(actual, predicted)
        
        # MAPE should be ((10/100 + 10/200) / 2) * 100 = 7.5%
        self.assertAlmostEqual(metrics['MAPE'], 7.5, places=1)

    def test_metrics_with_zero_values(self):
        """Test metrics with edge case of zero values"""
        actual = np.array([[0.01], [100]])
        predicted = np.array([[0.01], [100]])
        
        metrics = calculate_metrics(actual, predicted)
        
        # Should handle small values without error
        self.assertIsNotNone(metrics['MAPE'])
        self.assertGreaterEqual(metrics['MAPE'], 0)


class TestDataPreparation(unittest.TestCase):
    """Test data preparation and sequencing"""

    def test_sequence_creation(self):
        """Test that sequences are created correctly"""
        df = pd.DataFrame({
            'Close': list(range(100, 200))
        })
        
        sequence_length = 10
        X_train, X_test, y_train, y_test, scaler, scaled_data = prepare_data(df, sequence_length)
        
        # Check sequence shapes
        self.assertEqual(X_train.shape[1], sequence_length)
        self.assertEqual(X_train.shape[2], 1)

    def test_train_test_split_ratio(self):
        """Test 80/20 train-test split"""
        df = pd.DataFrame({
            'Close': list(range(100, 300))
        })
        
        sequence_length = 60
        X_train, X_test, y_train, y_test, scaler, scaled_data = prepare_data(df, sequence_length)
        
        total_samples = len(X_train) + len(X_test)
        train_ratio = len(X_train) / total_samples
        
        # Should be approximately 80%
        self.assertGreater(train_ratio, 0.75)
        self.assertLess(train_ratio, 0.85)

    def test_data_normalization(self):
        """Test that data is normalized between 0 and 1"""
        df = pd.DataFrame({
            'Close': [100, 150, 200, 250, 300]
        })
        
        sequence_length = 3
        X_train, X_test, y_train, y_test, scaler, scaled_data = prepare_data(df, sequence_length)
        
        # Check that scaled data is between 0 and 1
        self.assertGreaterEqual(scaled_data.min(), 0)
        self.assertLessEqual(scaled_data.max(), 1)

    def test_minimum_data_requirement(self):
        """Test that function requires sufficient data"""
        df = pd.DataFrame({
            'Close': [100, 101, 102]
        })
        
        with self.assertRaises(ValueError):
            prepare_data(df, sequence_length=10)


if __name__ == '__main__':
    unittest.main()
