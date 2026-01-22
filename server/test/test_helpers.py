import pytest
import sys
import os
import numpy as np
import pandas as pd
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from helpers import calculate_metrics, prepare_data


# Pytest Fixtures
@pytest.fixture
def sample_dataframe():
    """Create sample DataFrame for testing"""
    return pd.DataFrame({
        'Close': np.linspace(100, 200, 150)
    })


@pytest.fixture
def small_dataframe():
    """Create small DataFrame for edge case testing"""
    return pd.DataFrame({
        'Close': [100, 101, 102]
    })


@pytest.fixture
def large_dataframe():
    """Create larger DataFrame for comprehensive testing"""
    return pd.DataFrame({
        'Close': list(range(100, 300))
    })


# Test Metrics Calculation
class TestMetricsCalculation:
    """Test metrics calculation accuracy"""

    def test_mse_calculation(self):
        """Test Mean Squared Error calculation"""
        actual = np.array([[100], [101], [102]])
        predicted = np.array([[100], [101], [102]])
        
        metrics = calculate_metrics(actual, predicted)
        
        # Perfect prediction should have MSE close to 0
        assert abs(metrics['MSE']) < 1e-5

    def test_rmse_calculation(self):
        """Test Root Mean Squared Error calculation"""
        actual = np.array([[100], [104]])
        predicted = np.array([[100], [100]])
        
        metrics = calculate_metrics(actual, predicted)
        
        # RMSE should be sqrt((0 + 16)/2) = sqrt(8) ≈ 2.83
        assert abs(metrics['RMSE'] - 2.83) < 0.1

    def test_mae_calculation(self):
        """Test Mean Absolute Error calculation"""
        actual = np.array([[100], [105], [110]])
        predicted = np.array([[101], [104], [111]])
        
        metrics = calculate_metrics(actual, predicted)
        
        # MAE should be (1 + 1 + 1) / 3 = 1
        assert abs(metrics['MAE'] - 1.0) < 1e-5

    def test_mape_calculation(self):
        """Test Mean Absolute Percentage Error calculation"""
        actual = np.array([[100], [200]])
        predicted = np.array([[110], [190]])
        
        metrics = calculate_metrics(actual, predicted)
        
        # MAPE should be ((10/100 + 10/200) / 2) * 100 = 7.5%
        assert abs(metrics['MAPE'] - 7.5) < 0.1

    def test_metrics_with_zero_values(self):
        """Test metrics with edge case of zero values"""
        actual = np.array([[0.01], [100]])
        predicted = np.array([[0.01], [100]])
        
        metrics = calculate_metrics(actual, predicted)
        
        # Should handle small values without error
        assert metrics['MAPE'] is not None
        assert metrics['MAPE'] >= 0


class TestDataPreparation:
    """Test data preparation and sequencing"""

    def test_sequence_creation(self, sample_dataframe):
        """Test that sequences are created correctly"""
        sequence_length = 10
        X_train, X_test, y_train, y_test, scaler, scaled_data = prepare_data(
            sample_dataframe, sequence_length
        )
        
        # Check sequence shapes
        assert X_train.shape[1] == sequence_length
        assert X_train.shape[2] == 1

    def test_train_test_split_ratio(self, large_dataframe):
        """Test 80/20 train-test split"""
        sequence_length = 60
        X_train, X_test, y_train, y_test, scaler, scaled_data = prepare_data(
            large_dataframe, sequence_length
        )
        
        total_samples = len(X_train) + len(X_test)
        train_ratio = len(X_train) / total_samples
        
        # Should be approximately 80%
        assert 0.75 < train_ratio < 0.85

    def test_data_normalization(self):
        """Test that data is normalized between 0 and 1"""
        df = pd.DataFrame({
            'Close': [100, 150, 200, 250, 300]
        })
        
        sequence_length = 3
        X_train, X_test, y_train, y_test, scaler, scaled_data = prepare_data(df, sequence_length)
        
        # Check that scaled data is between 0 and 1
        assert scaled_data.min() >= 0
        assert scaled_data.max() <= 1

    def test_minimum_data_requirement(self, small_dataframe):
        """Test that function requires sufficient data"""
        with pytest.raises(ValueError):
            prepare_data(small_dataframe, sequence_length=10)

    def test_output_shapes_consistency(self, sample_dataframe):
        """Test that all outputs have consistent shapes"""
        sequence_length = 60
        X_train, X_test, y_train, y_test, scaler, scaled_data = prepare_data(
            sample_dataframe, sequence_length
        )
        
        # X and y should have matching sample counts
        assert len(X_train) == len(y_train)
        assert len(X_test) == len(y_test)
        
        # Total samples should match
        total_samples = len(X_train) + len(X_test)
        expected_samples = len(sample_dataframe) - sequence_length
        assert total_samples == expected_samples
