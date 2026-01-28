"""
Logging configuration for the Ultimate Frisbee Stats API.

Provides structured logging for production debugging with:
- Application lifecycle events (startup/shutdown)
- Request errors and exceptions
- Database operation failures
- Business logic errors
"""
import logging
import sys
from typing import Any


def setup_logging(log_level: str = "INFO") -> None:
    """
    Configure application logging.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    """
    # Create formatter with detailed context
    formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Console handler (always enabled)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    root_logger.addHandler(console_handler)

    # Configure app logger
    app_logger = logging.getLogger("app")
    app_logger.setLevel(getattr(logging, log_level.upper()))

    # Reduce noise from external libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance for a specific module."""
    return logging.getLogger(f"app.{name}")
