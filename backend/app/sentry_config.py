"""
Sentry error tracking configuration
"""
import os
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.logging import LoggingIntegration


def init_sentry():
    """
    Initialize Sentry error tracking
    Set SENTRY_DSN environment variable to enable
    """
    sentry_dsn = os.getenv("SENTRY_DSN")
    
    if not sentry_dsn:
        # Sentry not configured - this is OK for development
        return False
    
    # Get environment (development, staging, production)
    environment = os.getenv("ENVIRONMENT", "development")
    
    # Get release version (optional)
    release = os.getenv("RELEASE_VERSION", None)
    
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=environment,
        release=release,
        
        # Set traces_sample_rate to 1.0 to capture 100% of transactions
        # In production, use a lower value (e.g., 0.1)
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
        
        # Set profiles_sample_rate to profile performance
        # In production, use a lower value (e.g., 0.1)
        profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.1")),
        
        # Integrations
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            SqlalchemyIntegration(),
            LoggingIntegration(
                level=None,  # Capture all log levels
                event_level=None  # Send all log events as Sentry events
            ),
        ],
        
        # Filter out health check endpoints
        ignore_errors=[
            "KeyboardInterrupt",
        ],
        
        # Additional options
        send_default_pii=False,  # Don't send PII by default
        attach_stacktrace=True,
        max_breadcrumbs=50,
    )
    
    return True

