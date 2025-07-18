#!/usr/bin/env python3
"""
Configuration management for the optimization service.
"""

import os
from typing import List, Optional
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Service configuration
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    debug: bool = Field(default=False, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # CORS configuration
    allowed_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173",
            "http://172.26.93.180:3000",
            "http://172.26.93.180:3001",
            "http://172.26.93.180:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:5173"
        ],
        env="ALLOWED_ORIGINS"
    )
    
    # Backend service configuration
    backend_url: str = Field(default="http://localhost:3001", env="BACKEND_URL")
    backend_timeout: int = Field(default=30, env="BACKEND_TIMEOUT")
    
    # Optimization configuration
    max_optimization_time: int = Field(default=300, env="MAX_OPTIMIZATION_TIME")  # 5 minutes
    max_shifts_per_optimization: int = Field(default=1000, env="MAX_SHIFTS_PER_OPTIMIZATION")
    max_concurrent_optimizations: int = Field(default=10, env="MAX_CONCURRENT_OPTIMIZATIONS")
    
    # Algorithm configuration
    linear_programming_solver: str = Field(default="ECOS", env="LINEAR_PROGRAMMING_SOLVER")
    genetic_algorithm_population: int = Field(default=50, env="GA_POPULATION")
    genetic_algorithm_generations: int = Field(default=100, env="GA_GENERATIONS")
    simulated_annealing_max_iter: int = Field(default=1000, env="SA_MAX_ITER")
    
    # Memory and performance
    max_memory_mb: int = Field(default=1024, env="MAX_MEMORY_MB")
    enable_caching: bool = Field(default=True, env="ENABLE_CACHING")
    cache_ttl: int = Field(default=3600, env="CACHE_TTL")  # 1 hour
    
    # Monitoring and logging
    enable_metrics: bool = Field(default=True, env="ENABLE_METRICS")
    metrics_port: int = Field(default=8001, env="METRICS_PORT")
    log_format: str = Field(default="JSON", env="LOG_FORMAT")
    
    # Security
    api_key: Optional[str] = Field(default=None, env="API_KEY")
    enable_auth: bool = Field(default=False, env="ENABLE_AUTH")
    
    # Database for caching (optional)
    redis_url: Optional[str] = Field(default=None, env="REDIS_URL")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get the global settings instance."""
    global _settings
    
    if _settings is None:
        _settings = Settings()
    
    return _settings


def reload_settings() -> Settings:
    """Reload settings from environment variables."""
    global _settings
    _settings = Settings()
    return _settings