#!/bin/bash

set -e

separator() {
    echo
    echo "============================================================"
    echo " $1"
    echo "============================================================"
    echo
}

echo "Starting CI/CD Pipeline..."

# Check if required commands exist
separator "Checking prerequisites..."
if ! command -v node >/dev/null 2>&1; then
    echo " Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo " npm is not installed. Please install npm first."
    exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
    echo " Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose >/dev/null 2>&1; then
    echo " Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "All prerequisites are available."

# Step 1: Install dependencies
separator "Installing dependencies..."
if npm install; then
    echo " Dependencies installed successfully."
else
    echo " Failed to install dependencies."
    exit 1
fi

# Step 2: Check and fix code formatting
separator "Checking code formatting..."
if npm run format:check; then
    echo "Code formatting is correct."
else
    echo "Code formatting issues found. Fixing automatically..."
    if npm run format; then
        echo "Code formatting fixed successfully."
    else
        echo "Failed to fix code formatting."
        exit 1
    fi
fi

# Step 3: Check and fix code quality (linting)
separator "Checking code quality..."
if npm run lint; then
    echo " Code quality check passed."
else
    echo " Code quality issues found. Fixing automatically..."
    if npm run lint:fix; then
        echo " Code quality issues fixed successfully."
    else
        echo " Failed to fix code quality issues."
        exit 1
    fi
fi

# Step 4: Run tests (if test files exist)
separator "Checking for tests..."
if find . -name "*.test.js" -o -name "*.spec.js" | grep -q .; then
    echo "Running tests..."
    if npm run test; then
        echo " All tests passed."
    else
        echo " Tests failed."
        exit 1
    fi
else
    echo "No test files found. Skipping test step."
fi

# Step 5: Build Docker image
separator "Building Docker image..."
if docker build -t teamavail-test:latest .; then
    echo "Docker image built successfully."
else
    echo "Docker image build failed."
    exit 1
fi

# Step 6: Start application
separator "Starting application..."
if docker-compose up -d; then
    echo "Application started successfully."
    echo "Application is running at: http://localhost:3000"
    echo "To stop: docker-compose down"
else
    echo "Failed to start application."
    exit 1
fi

echo "CI/CD Pipeline completed successfully!"
