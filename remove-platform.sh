#!/bin/bash

# Remove platform (local, remote, or both)
# Usage: ./remove-platform.sh -n <platform-name> [-r remote|local|all]

set -e

# Load MY_ROOT_PATH from .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
fi

# Use MY_ROOT_PATH or fallback to default
MY_ROOT_PATH="${MY_ROOT_PATH:-/var/services/homes/jungsam/dockers}"

# Manager data directory
MANAGER_DATA_DIR="$MY_ROOT_PATH/_manager/data"
PLATFORMS_JSON="$MANAGER_DATA_DIR/platforms.json"
REPOSITORIES_JSON="$MANAGER_DATA_DIR/repositories.json"

# Scripts directory
SCRIPTS_DIR="$MY_ROOT_PATH/_manager/scripts"
UPDATE_REPOSITORIES="$SCRIPTS_DIR/update-repositories.js"

# Default values
PLATFORM_NAME=""
REMOVE_TYPE="remote"  # remote, local, all
PLATFORMS_DIR="$MY_ROOT_PATH/platforms"

# Get platform data from repositories.json
get_platform_data() {
    local platform_name="$1"

    if [ ! -f "$REPOSITORIES_JSON" ]; then
        echo "Error: repositories.json not found at $REPOSITORIES_JSON" >&2
        return 1
    fi

    # Get GitHub user from repositories.json
    GITHUB_USER=$(node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$REPOSITORIES_JSON', 'utf-8'));
        if (data.github && data.github['$platform_name']) {
            console.log(data.github['$platform_name'].user);
        } else {
            console.log('');
        }
    ")

    if [ -z "$GITHUB_USER" ]; then
        echo "Warning: Platform '$platform_name' not found in repositories.json" >&2
        echo "Proceeding with local deletion only..." >&2
        return 1
    fi

    return 0
}

# Remove remote repository using xgit
remove_remote_repository() {
    local platform_name="$1"
    local github_user="$2"

    echo "Removing remote repository..."
    echo "  Platform: $platform_name"
    echo "  User: $github_user"

    if command -v xgit >/dev/null 2>&1; then
        XGIT_CMD="xgit -e del -n \"$platform_name\" -u \"$github_user\""
        echo "Running: $XGIT_CMD"

        if eval "$XGIT_CMD"; then
            echo "  ✓ Remote repository deleted successfully"
        else
            echo "  ⚠ Failed to delete remote repository (may not exist or already deleted)"
        fi
    else
        echo "  ⚠ Warning: xgit command not found. Skipping remote deletion."
        echo "  You can manually delete: https://github.com/$github_user/$platform_name"
    fi
}

# Remove local repository
remove_local_repository() {
    local platform_name="$1"
    local platform_path="$PLATFORMS_DIR/$platform_name"

    echo "Removing local repository..."
    echo "  Path: $platform_path"

    if [ -d "$platform_path" ]; then
        rm -rf "$platform_path"
        echo "  ✓ Local repository deleted successfully"
    else
        echo "  ⚠ Local repository not found (may already be deleted)"
    fi
}

# Update platforms.json - remove platform entry
update_platforms_json() {
    local platform_name="$1"

    if [ ! -f "$PLATFORMS_JSON" ]; then
        echo "  ⚠ Warning: platforms.json not found. Skipping update."
        return
    fi

    echo "Updating platforms.json..."

    node -e "
    const fs = require('fs');
    const path = '$PLATFORMS_JSON';

    try {
        const data = JSON.parse(fs.readFileSync(path, 'utf-8'));

        if (data.platforms && data.platforms['$platform_name']) {
            delete data.platforms['$platform_name'];

            // Update metadata
            if (!data.metadata) data.metadata = {};
            data.metadata.lastUpdated = new Date().toISOString();
            data.metadata.totalPlatforms = Object.keys(data.platforms).length;

            fs.writeFileSync(path, JSON.stringify(data, null, 2));
            console.log('  ✓ Removed platform from platforms.json');
        } else {
            console.log('  ⚠ Platform not found in platforms.json');
        }
    } catch (error) {
        console.error('  ⚠ Error updating platforms.json:', error.message);
    }
    "
}

# Update repositories.json - remove repository entry
update_repositories_json() {
    local platform_name="$1"

    if [ ! -f "$UPDATE_REPOSITORIES" ]; then
        echo "  ⚠ Warning: update-repositories.js not found. Skipping repository update."
        return
    fi

    echo "Updating repositories.json..."
    node "$UPDATE_REPOSITORIES" remove "$platform_name"
}

# Parse command line arguments
while getopts "n:r:h" opt; do
    case $opt in
        n)
            PLATFORM_NAME="$OPTARG"
            ;;
        r)
            REMOVE_TYPE="$OPTARG"
            ;;
        h)
            echo "Usage: $0 -n <platform-name> [-r remote|local|all]"
            echo ""
            echo "Options:"
            echo "  -n  Platform name (required)"
            echo "  -r  Remove type: remote, local, or all (default: remote)"
            echo "      remote - Remove only GitHub repository"
            echo "      local  - Remove only local files"
            echo "      all    - Remove both remote and local"
            echo "  -h  Show this help message"
            exit 0
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            echo "Use -h for help."
            exit 1
            ;;
        :)
            echo "Option -$OPTARG requires an argument." >&2
            exit 1
            ;;
    esac
done

# Validate required arguments
if [ -z "$PLATFORM_NAME" ]; then
    echo "Error: Platform name (-n) is required" >&2
    exit 1
fi

# Validate remove type
if [[ ! "$REMOVE_TYPE" =~ ^(remote|local|all)$ ]]; then
    echo "Error: Invalid remove type. Must be: remote, local, or all" >&2
    exit 1
fi

echo "========================================="
echo "Platform Removal"
echo "========================================="
echo "Platform: $PLATFORM_NAME"
echo "Remove Type: $REMOVE_TYPE"
echo "========================================="
echo ""

# Get platform data
get_platform_data "$PLATFORM_NAME"
PLATFORM_EXISTS=$?

# Confirmation prompt
read -p "Are you sure you want to remove platform '$PLATFORM_NAME'? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

echo ""

# Execute removal based on type
case "$REMOVE_TYPE" in
    remote)
        if [ $PLATFORM_EXISTS -eq 0 ]; then
            remove_remote_repository "$PLATFORM_NAME" "$GITHUB_USER"
        else
            echo "Cannot remove remote repository: Platform data not found"
        fi
        ;;
    local)
        remove_local_repository "$PLATFORM_NAME"
        ;;
    all)
        if [ $PLATFORM_EXISTS -eq 0 ]; then
            remove_remote_repository "$PLATFORM_NAME" "$GITHUB_USER"
        fi
        remove_local_repository "$PLATFORM_NAME"
        ;;
esac

# Update data files (for all cases)
echo ""
echo "Updating data files..."
update_platforms_json "$PLATFORM_NAME"
update_repositories_json "$PLATFORM_NAME"

echo ""
echo "========================================="
echo "✅ Platform removal completed!"
echo "========================================="
echo "Platform: $PLATFORM_NAME"
echo "Remove Type: $REMOVE_TYPE"
echo "========================================="
