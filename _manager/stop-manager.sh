#!/bin/bash

# Docker Manager Stop Script
# Stops both API and Web servers

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if PID files exist
API_PID_FILE="logs/api.pid"
WEB_PID_FILE="logs/web.pid"

echo "Stopping Docker Manager..."

# Function to stop process
stop_process() {
    local name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping $name (PID: $pid)..."
            kill $pid
            
            # Wait for process to stop (max 10 seconds)
            local count=0
            while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                echo "Force killing $name..."
                kill -9 $pid 2>/dev/null || true
            fi
            
            echo "$name stopped"
        else
            echo "$name is not running (PID $pid not found)"
        fi
        rm -f "$pid_file"
    else
        echo "$name PID file not found ($pid_file)"
    fi
}

# Stop Web server first
stop_process "Web server" "$WEB_PID_FILE"

# Then stop API server
stop_process "API server" "$API_PID_FILE"

# Clean up log files (optional)
if [ "$1" == "--clean-logs" ]; then
    echo "Cleaning up log files..."
    rm -f logs/api.log logs/web.log
    echo "Log files cleaned"
fi

echo ""
echo "Docker Manager stopped successfully!"
