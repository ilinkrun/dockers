#!/bin/bash

# Docker Manager Start Script
# Starts both API and Web servers in production mode using nohup

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables from .env
if [ -f .env ]; then
    echo "Loading environment variables from .env..."
    export $(grep -v '^#' .env | grep -v '^$' | xargs)
else
    echo "Error: .env file not found in $SCRIPT_DIR"
    exit 1
fi

# Map API port (handle both naming conventions)
if [ -n "$MANAGER_API_REST_PORT" ]; then
    export MANAGER_API_PORT="$MANAGER_API_REST_PORT"
elif [ -z "$MANAGER_API_PORT" ]; then
    export MANAGER_API_PORT=20101
    echo "Warning: MANAGER_API_PORT not set, using default: 20101"
fi

# Set Web port default if not set
if [ -z "$MANAGER_WEB_PORT" ]; then
    export MANAGER_WEB_PORT=20100
    echo "Warning: MANAGER_WEB_PORT not set, using default: 20100"
fi

# Create logs directory
mkdir -p logs

# Update web/.env.local with API port from .env
echo "Updating web/.env.local with current API port..."
cat > web/.env.local << EOF
NEXT_PUBLIC_API_REST_URL=http://1.231.118.217:$MANAGER_API_PORT
NEXT_PUBLIC_API_LOCAL_URL=http://localhost:$MANAGER_API_PORT

# Disable file watching to prevent ENOSPC errors
WATCHPACK_POLLING=true
CHOKIDAR_USEPOLLING=true
EOF
echo "web/.env.local updated with API port: $MANAGER_API_PORT"

# Check if build exists, if not build it
echo "Checking build status..."
if [ ! -d "api/dist" ] || [ ! -d "web/.next" ]; then
    echo "Build not found, building both API and Web..."
    npm run build
fi

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Check if API is already running
if check_port $MANAGER_API_PORT; then
    echo "Warning: API port $MANAGER_API_PORT is already in use"
    echo "Please stop the existing process or change the port in .env"
    exit 1
fi

# Check if Web is already running
if check_port $MANAGER_WEB_PORT; then
    echo "Warning: Web port $MANAGER_WEB_PORT is already in use"
    echo "Please stop the existing process or change the port in .env"
    exit 1
fi

# Start API server
echo "Starting API server on port $MANAGER_API_PORT..."
nohup npm run start:api > logs/api.log 2>&1 &
API_PID=$!
echo $API_PID > logs/api.pid
echo "API server started (PID: $API_PID)"

# Wait a moment for API to initialize
sleep 2

# Start Web server
echo "Starting Web server on port $MANAGER_WEB_PORT..."
nohup npm run start:web > logs/web.log 2>&1 &
WEB_PID=$!
echo $WEB_PID > logs/web.pid
echo "Web server started (PID: $WEB_PID)"

# Wait a moment for servers to start
sleep 3

# Check if processes are still running
if ! ps -p $API_PID > /dev/null 2>&1; then
    echo "Error: API server failed to start. Check logs/api.log for details"
    exit 1
fi

if ! ps -p $WEB_PID > /dev/null 2>&1; then
    echo "Error: Web server failed to start. Check logs/web.log for details"
    kill $API_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "==================================================================="
echo "Docker Manager started successfully!"
echo "==================================================================="
echo "API Server:"
echo "  - PID: $API_PID"
echo "  - Port: $MANAGER_API_PORT"
echo "  - Swagger: http://1.231.118.217:$MANAGER_API_PORT/docs"
echo "  - Health: http://1.231.118.217:$MANAGER_API_PORT/health"
echo "  - Log: $SCRIPT_DIR/logs/api.log"
echo ""
echo "Web Server:"
echo "  - PID: $WEB_PID"
echo "  - Port: $MANAGER_WEB_PORT"
echo "  - URL: http://1.231.118.217:$MANAGER_WEB_PORT"
echo "  - Log: $SCRIPT_DIR/logs/web.log"
echo ""
echo "To view logs:"
echo "  tail -f logs/api.log"
echo "  tail -f logs/web.log"
echo ""
echo "To stop servers:"
echo "  ./stop-manager.sh"
echo "  or manually: kill $API_PID $WEB_PID"
echo "==================================================================="
