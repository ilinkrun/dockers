#!/bin/bash

# Docker Manager Start Script (Development Mode)
# Starts both API and Web servers in development mode with hot reload

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

echo ""
echo "==================================================================="
echo "Starting Docker Manager in DEVELOPMENT mode..."
echo "==================================================================="
echo "API Server: http://1.231.118.217:$MANAGER_API_PORT"
echo "  - Swagger: http://1.231.118.217:$MANAGER_API_PORT/docs"
echo "  - Health: http://1.231.118.217:$MANAGER_API_PORT/health"
echo ""
echo "Web Server: http://1.231.118.217:$MANAGER_WEB_PORT"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "==================================================================="
echo ""

# Start both servers using npm workspace scripts
npm run dev
