#!/usr/bin/env python3
"""
Development startup script for the optimization service.
"""

import os
import sys
import subprocess
from pathlib import Path

# Add current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

def main():
    """Start the optimization service in development mode."""
    print("🚀 Starting Optimization Service (Development Mode)")
    print("=" * 60)
    
    # Check if .env file exists
    env_file = current_dir / ".env"
    if not env_file.exists():
        print("⚠️  No .env file found. Creating from .env.example...")
        example_file = current_dir / ".env.example"
        if example_file.exists():
            example_file.rename(env_file)
            print("✅ Created .env file from .env.example")
        else:
            print("❌ No .env.example file found")
            return
    
    # Check if logs directory exists
    logs_dir = current_dir / "logs"
    if not logs_dir.exists():
        logs_dir.mkdir(parents=True)
        print("✅ Created logs directory")
    
    # Set environment variables for development
    os.environ.setdefault("DEBUG", "true")
    os.environ.setdefault("LOG_LEVEL", "DEBUG")
    os.environ.setdefault("HOST", "0.0.0.0")
    os.environ.setdefault("PORT", "8000")
    
    print(f"📁 Working directory: {current_dir}")
    print(f"🌐 Service will start on: http://localhost:{os.environ.get('PORT', '8000')}")
    print(f"📊 Health check: http://localhost:{os.environ.get('PORT', '8000')}/health")
    print(f"📋 API docs: http://localhost:{os.environ.get('PORT', '8000')}/docs")
    print("=" * 60)
    
    try:
        # Start the service using uvicorn
        subprocess.run([
            sys.executable, "-m", "uvicorn",
            "main:app",
            "--host", os.environ.get("HOST", "0.0.0.0"),
            "--port", os.environ.get("PORT", "8000"),
            "--reload",
            "--log-level", os.environ.get("LOG_LEVEL", "debug").lower()
        ], cwd=current_dir, check=True)
        
    except KeyboardInterrupt:
        print("\n🛑 Service stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Service failed to start: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()