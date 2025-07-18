# Fuyou Optimization Service

Phase 4 implementation of the shift optimization algorithms for the fuyou management app.

## 🎯 Overview

The Optimization Service is a Python microservice that provides advanced shift scheduling optimization algorithms. It uses mathematical optimization techniques to help users maximize income while staying within fuyou (dependency) limits and other constraints.

## 🏗️ Architecture

- **FastAPI**: Web framework for high-performance APIs
- **scipy.optimize**: Linear programming and optimization algorithms
- **pydantic**: Data validation and serialization
- **loguru**: Advanced logging
- **uvicorn**: ASGI server for production

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- pip or poetry
- Optional: Docker

### Development Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   python start_dev.py
   ```

   Or manually:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Access the service:**
   - API: http://localhost:8000
   - Health check: http://localhost:8000/health
   - API docs: http://localhost:8000/docs

### Docker Setup

```bash
# Build image
docker build -t fuyou-optimization-service .

# Run container
docker run -p 8000:8000 --env-file .env fuyou-optimization-service
```

## 📋 Available Algorithms

### 1. Linear Programming (Free Tier)
- **Use Case**: Maximize income with linear constraints
- **Performance**: Fast (< 1 second)
- **Best For**: Simple optimization problems
- **Implementation**: scipy.optimize.linprog

### 2. Genetic Algorithm (Standard Tier)
- **Use Case**: Complex constraints and non-linear objectives
- **Performance**: Medium (5-30 seconds)
- **Best For**: Multi-modal optimization
- **Implementation**: Custom GA with scipy

### 3. Multi-Objective NSGA-II (Pro Tier)
- **Use Case**: Balance multiple objectives (income, hours, balance)
- **Performance**: Slow (30-120 seconds)
- **Best For**: Complex trade-off analysis
- **Implementation**: NSGA-II algorithm

## 🔧 API Endpoints

### Core Optimization

```bash
# Synchronous optimization
POST /optimize
Content-Type: application/json
{
  "user_id": "string",
  "objective": "maximize_income",
  "time_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "constraints": [...],
  "job_sources": [...],
  "preferences": {
    "algorithm": "linear_programming"
  }
}

# Asynchronous optimization
POST /optimize/async
# Check status
GET /optimize/status/{run_id}
```

### Validation

```bash
# Validate constraints
POST /validate/constraints
[
  {
    "constraint_type": "fuyou_limit",
    "constraint_value": 1500000,
    "constraint_unit": "yen"
  }
]
```

### Utilities

```bash
# Available algorithms
GET /algorithms

# Service metrics
GET /metrics

# Health check
GET /health
```

## 🎨 Request/Response Examples

### Optimization Request

```json
{
  "user_id": "12345",
  "objective": "maximize_income",
  "time_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "constraints": [
    {
      "constraint_type": "fuyou_limit",
      "constraint_value": 1500000,
      "constraint_unit": "yen",
      "priority": 1
    },
    {
      "constraint_type": "weekly_hours",
      "constraint_value": 40,
      "constraint_unit": "hours",
      "priority": 1
    }
  ],
  "job_sources": [
    {
      "id": "job1",
      "name": "Restaurant",
      "hourly_rate": 1200,
      "is_active": true
    }
  ],
  "preferences": {
    "algorithm": "linear_programming",
    "max_iterations": 1000
  },
  "tier_level": "free"
}
```

### Optimization Response

```json
{
  "success": true,
  "optimization_run_id": "run_123",
  "solution": {
    "suggested_shifts": [
      {
        "id": "shift_1",
        "job_source_name": "Restaurant",
        "date": "2024-01-01",
        "start_time": "10:00",
        "end_time": "16:00",
        "hourly_rate": 1200,
        "working_hours": 5.5,
        "calculated_earnings": 6600,
        "confidence": 0.9,
        "reasoning": "Optimized for maximum income"
      }
    ],
    "objective_value": 150000,
    "constraints_satisfied": {
      "fuyou_limit": true,
      "weekly_hours": true
    },
    "algorithm_used": "linear_programming",
    "confidence_score": 0.9,
    "total_income": 150000,
    "total_hours": 120,
    "total_shifts": 25
  }
}
```

## 🔒 Security

- **Authentication**: Optional API key authentication
- **Rate Limiting**: Tier-based request limits
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Secure error responses

## 🎯 Configuration

### Environment Variables

```bash
# Service
HOST=0.0.0.0
PORT=8000
DEBUG=false
LOG_LEVEL=INFO

# Backend Integration
BACKEND_URL=http://localhost:3001
BACKEND_TIMEOUT=30

# Optimization
MAX_OPTIMIZATION_TIME=300
MAX_CONCURRENT_OPTIMIZATIONS=10

# Algorithms
LINEAR_PROGRAMMING_SOLVER=ECOS
GA_POPULATION=50
GA_GENERATIONS=100
```

### Tier Limits

| Feature | Free | Standard | Pro |
|---------|------|----------|-----|
| Optimization runs/month | 5 | 50 | Unlimited |
| Available algorithms | Linear Programming | + Genetic Algorithm | + Multi-Objective |
| Max constraints | 5 | 15 | Unlimited |
| Max time horizon | 30 days | 90 days | 365 days |
| Analytics access | ❌ | ✅ | ✅ |

## 📊 Monitoring

### Metrics

- Request count and success rate
- Average processing time
- Algorithm usage statistics
- Constraint violation rates
- Memory and CPU usage

### Logging

- Structured JSON logging
- Automatic log rotation
- Error tracking and alerting
- Performance monitoring

## 🧪 Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest

# Run with coverage
pytest --cov=.
```

## 🚀 Deployment

### Production Deployment

1. **Docker Compose:**
   ```yaml
   version: '3.8'
   services:
     optimization-service:
       build: .
       ports:
         - "8000:8000"
       environment:
         - DEBUG=false
         - LOG_LEVEL=INFO
       restart: unless-stopped
   ```

2. **Kubernetes:**
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: optimization-service
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: optimization-service
     template:
       metadata:
         labels:
           app: optimization-service
       spec:
         containers:
         - name: optimization-service
           image: fuyou-optimization-service:latest
           ports:
           - containerPort: 8000
   ```

### Load Balancing

For production, use a load balancer (nginx, AWS ALB, etc.) to distribute requests across multiple service instances.

## 🔄 Integration

### Node.js Backend Integration

```typescript
// backend/src/services/optimizationService.ts
import axios from 'axios';

export class OptimizationService {
  private serviceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';
  
  async runOptimization(request: OptimizationRequest): Promise<OptimizationResult> {
    const response = await axios.post(`${this.serviceUrl}/optimize`, request);
    return response.data;
  }
}
```

## 🛠️ Development

### Project Structure

```
optimization_service/
├── main.py                  # FastAPI application
├── models/                  # Pydantic models
├── services/                # Business logic
├── algorithms/              # Optimization algorithms
├── utils/                   # Utilities
├── tests/                   # Test suites
├── logs/                    # Log files
├── requirements.txt         # Python dependencies
├── Dockerfile              # Container definition
└── README.md               # Documentation
```

### Adding New Algorithms

1. Create algorithm class in `algorithms/`
2. Implement the `optimize` method
3. Add to algorithm registry in `services/optimizer.py`
4. Update tier limits and documentation

## 📈 Future Enhancements

- **Reinforcement Learning**: Q-learning for adaptive optimization
- **Distributed Computing**: Parallel optimization across multiple workers
- **Real-time Optimization**: Streaming optimization for dynamic schedules
- **ML-based Constraints**: Learned constraints from user behavior
- **Advanced Visualization**: Interactive optimization result exploration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## 📄 License

This project is part of the fuyou management app. See the main project LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the API documentation at `/docs`
- Review the logs in the `logs/` directory
- Contact the development team

---

**Phase 4 Status**: Basic linear programming implementation complete. Genetic algorithm and multi-objective optimization are placeholder implementations pending full development.