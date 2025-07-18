#!/usr/bin/env python3
"""
Logger configuration for the optimization service.
"""

import sys
from loguru import logger


def setup_logger(log_level: str = "INFO") -> None:
    """Setup loguru logger with custom configuration."""
    
    # Remove default handler
    logger.remove()
    
    # Add console handler with custom format
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=log_level.upper(),
        colorize=True,
        backtrace=True,
        diagnose=True
    )
    
    # Add file handler for errors
    logger.add(
        "logs/optimization_service.log",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
        level="INFO",
        rotation="100 MB",
        retention="30 days",
        compression="gz",
        backtrace=True,
        diagnose=True
    )
    
    # Add error file handler
    logger.add(
        "logs/errors.log",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
        level="ERROR",
        rotation="50 MB",
        retention="30 days",
        compression="gz",
        backtrace=True,
        diagnose=True
    )
    
    logger.info(f"Logger configured with level: {log_level}")


def get_logger(name: str = None):
    """Get a logger instance."""
    if name:
        return logger.bind(name=name)
    return logger