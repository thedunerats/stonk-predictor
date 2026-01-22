# Pytest Fixtures Guide

This document explains the pytest fixture-based testing approach used in this project.

## What Are Fixtures?

Fixtures are reusable test components that provide data, mock objects, or setup/teardown functionality. They're defined once and can be used across multiple tests.

## Benefits Over Patches

**Before (unittest with @patch decorators):**
```python
@patch('app.download_stock_data')
def test_something(self, mock_download):
    mock_download.return_value = (dataframe, 'AAPL')
    # test code...
```

**After (pytest with fixtures):**
```python
def test_something(client, mock_download_stock_data):
    # Fixture automatically provides mocked function
    # test code...
```

### Advantages:
- ✅ **Reusability**: Define mock once, use in many tests
- ✅ **Readability**: Test signatures show dependencies clearly
- ✅ **Composition**: Fixtures can depend on other fixtures
- ✅ **Scope Control**: Share fixtures across tests, classes, or modules
- ✅ **Cleaner Code**: No decorator stacking or parameter ordering issues

## Available Fixtures

### Test Client Fixtures

#### `client`
Flask test client for making HTTP requests.

**Usage:**
```python
def test_health_check(client):
    response = client.get('/api/health')
    assert response.status_code == 200
```

### Data Fixtures

#### `mock_stock_dataframe`
Small DataFrame with 3 days of stock data.

**Contains:**
- Open, High, Low, Close, Volume columns
- Date index from 2020-01-01 to 2020-01-03

**Usage:**
```python
def test_with_data(mock_stock_dataframe):
    assert len(mock_stock_dataframe) == 3
    assert 'Close' in mock_stock_dataframe.columns
```

#### `mock_large_dataframe`
Larger DataFrame with 100 days for prediction tests.

**Usage:**
```python
def test_prediction(mock_large_dataframe):
    X_train, X_test, *_ = prepare_data(mock_large_dataframe, 60)
```

#### `sample_dataframe` (test_helpers.py)
DataFrame with 150 data points, evenly distributed.

#### `small_dataframe` (test_helpers.py)
Only 3 data points for edge case testing.

#### `large_dataframe` (test_helpers.py)
200 data points for comprehensive testing.

### Mock Fixtures

#### `mock_download_stock_data`
Mocks the `app.download_stock_data` function.

**Returns:** `(mock_stock_dataframe, 'AAPL')`

**Usage:**
```python
def test_stock_endpoint(client, mock_download_stock_data):
    response = client.post('/api/stock/data', json={
        'ticker': 'AAPL',
        'startDate': '2020-01-01',
        'endDate': '2020-01-03'
    })
    assert response.status_code == 200
```

#### `mock_lstm_model`
Mocks the `app.build_lstm_model` function.

**Returns:** Mock model with:
- `fit()` method returning training history
- `predict()` method returning random predictions

**Usage:**
```python
def test_with_model(mock_lstm_model):
    # Model is already mocked
    # Just use build_lstm_model() in your code
```

#### `mock_api_response`
Mocks `requests.get` with successful API response.

**Returns:** 200 status with valid stock data JSON.

**Usage:**
```python
def test_download(mock_api_response):
    df, name = download_stock_data('AAPL', start, end)
    assert name == 'AAPL'
```

#### `mock_failed_api_response`
Mocks `requests.get` with failed API response (404).

**Usage:**
```python
def test_download_failure(mock_failed_api_response):
    with pytest.raises(Exception):
        download_stock_data('INVALID', start, end)
```

## Creating Custom Fixtures

### Basic Fixture

```python
@pytest.fixture
def my_fixture():
    """Provide some test data"""
    return {'key': 'value'}

def test_something(my_fixture):
    assert my_fixture['key'] == 'value'
```

### Fixture with Setup/Teardown

```python
@pytest.fixture
def database():
    """Set up and tear down database"""
    db = create_test_database()
    yield db  # Test runs here
    db.cleanup()  # Cleanup after test
```

### Fixture Depending on Other Fixtures

```python
@pytest.fixture
def mock_data(mocker):
    """This fixture uses the mocker fixture"""
    mock = mocker.patch('module.function')
    mock.return_value = 'test'
    return mock
```

### Parametrized Fixture

```python
@pytest.fixture(params=['data1', 'data2', 'data3'])
def test_data(request):
    """Run tests with multiple data sets"""
    return request.param

def test_with_params(test_data):
    # This test runs 3 times, once for each param
    assert test_data is not None
```

## Fixture Scopes

Control how long fixtures live:

```python
@pytest.fixture(scope='function')  # Default: new for each test
def function_scoped():
    return expensive_setup()

@pytest.fixture(scope='class')  # Shared across test class
def class_scoped():
    return expensive_setup()

@pytest.fixture(scope='module')  # Shared across file
def module_scoped():
    return expensive_setup()

@pytest.fixture(scope='session')  # Shared across entire test run
def session_scoped():
    return expensive_setup()
```

## Using pytest-mock

The `mocker` fixture (from pytest-mock) provides mock functionality:

```python
def test_with_mock(mocker):
    # Create a mock
    mock_func = mocker.patch('module.function')
    mock_func.return_value = 42
    
    # Or mock an object
    mock_obj = mocker.MagicMock()
    mock_obj.method.return_value = 'test'
```

### Common Patterns

**Mock a function:**
```python
def test_download(mocker):
    mock = mocker.patch('app.download_stock_data')
    mock.return_value = (dataframe, 'AAPL')
```

**Mock a class:**
```python
def test_model(mocker):
    mock_model = mocker.MagicMock()
    mock = mocker.patch('app.build_lstm_model')
    mock.return_value = mock_model
```

**Mock an attribute:**
```python
def test_config(mocker):
    mocker.patch.object(app, 'config', {'TESTING': True})
```

## Running Tests

**Run all tests:**
```bash
pytest test/
```

**Run specific file:**
```bash
pytest test/test_app.py
```

**Run specific test:**
```bash
pytest test/test_app.py::TestFlaskApp::test_health_check
```

**Run with coverage:**
```bash
pytest test/ --cov=. --cov-report=html
```

**Run verbose:**
```bash
pytest test/ -v
```

**Show print statements:**
```bash
pytest test/ -s
```

## Best Practices

1. **Name fixtures descriptively**: `mock_stock_dataframe` not `df`
2. **Document fixtures**: Add docstrings explaining what they provide
3. **Keep fixtures simple**: Complex logic should be in helper functions
4. **Use appropriate scope**: Don't make everything session-scoped
5. **Avoid side effects**: Fixtures should be independent
6. **Combine fixtures**: Build complex setups from simple fixtures
7. **Use conftest.py**: Share fixtures across multiple test files

## Migration from unittest

**Old (unittest):**
```python
class TestClass(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
    
    @patch('app.function')
    def test_something(self, mock_func):
        mock_func.return_value = 'value'
        response = self.client.get('/endpoint')
        self.assertEqual(response.status_code, 200)
```

**New (pytest):**
```python
@pytest.fixture
def mock_function(mocker):
    mock = mocker.patch('app.function')
    mock.return_value = 'value'
    return mock

class TestClass:
    def test_something(self, client, mock_function):
        response = client.get('/endpoint')
        assert response.status_code == 200
```

## Common Assertions

**unittest → pytest:**
- `self.assertEqual(a, b)` → `assert a == b`
- `self.assertIn(a, b)` → `assert a in b`
- `self.assertTrue(x)` → `assert x`
- `self.assertRaises(E)` → `with pytest.raises(E)`
- `self.assertGreater(a, b)` → `assert a > b`

## Further Reading

- [Pytest Fixtures Documentation](https://docs.pytest.org/en/latest/fixture.html)
- [pytest-mock Documentation](https://pytest-mock.readthedocs.io/)
- [Pytest Best Practices](https://docs.pytest.org/en/latest/goodpractices.html)
