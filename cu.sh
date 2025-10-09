#!/bin/bash

# create new ubuntu platform from template
# Usage: ./cu.sh -n <platform-name> -u <github-user-name> -d "<platform-description>" -l <target location> -t <template directory>

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

# Scripts directory
SCRIPTS_DIR="$MY_ROOT_PATH/_manager/scripts"
PORT_ALLOCATOR="$SCRIPTS_DIR/port-allocator.js"
UPDATE_REPOSITORIES="$SCRIPTS_DIR/update-repositories.js"

# Default values
TARGET_LOCATION="$MY_ROOT_PATH/platforms"
TEMPLATE_DIRECTORY="$MY_ROOT_PATH/_templates/docker-ubuntu"
PLATFORM_NAME=""
GITHUB_USER=""
PLATFORM_DESCRIPTION=""
PLATFORM_SN=""

# Generate secure passwords and secrets
generate_password() {
    if command -v openssl &> /dev/null; then
        openssl rand -hex 16
    else
        echo "$(date +%s)_$(whoami)_$(hostname)" | sha256sum | cut -d' ' -f1 | head -c 32
    fi
}

generate_jwt_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -hex 32
    else
        echo "$(date +%s)_jwt_$(whoami)" | sha256sum | cut -d' ' -f1
    fi
}

# Get platform SN (existing or next available) and calculate ports
get_platform_port_allocation() {
    local platform_name="$1"

    echo "Calculating port allocation..."

    # Get platform SN (reuse if exists, otherwise get next available)
    if [ -f "$PORT_ALLOCATOR" ] && [ -f "$PLATFORMS_JSON" ]; then
        PLATFORM_SN=$(node "$PORT_ALLOCATOR" get-platform-sn "$PLATFORMS_JSON" "$platform_name")

        # Check if platform already exists
        if grep -q "\"$platform_name\"" "$PLATFORMS_JSON" 2>/dev/null; then
            echo "  ℹ Platform '$platform_name' already exists. Reusing SN: $PLATFORM_SN"
        else
            echo "  ℹ New platform. Assigned SN: $PLATFORM_SN"
        fi

        # Get platform port allocation details
        local port_info=$(node "$PORT_ALLOCATOR" platform "$PLATFORM_SN")
        BASE_PLATFORM_PORT=$(echo "$port_info" | grep -o '"basePort": [0-9]*' | grep -o '[0-9]*')

        echo "  Base Port: $BASE_PLATFORM_PORT"
        echo "  Port Range: $BASE_PLATFORM_PORT - $((BASE_PLATFORM_PORT + 199))"
    else
        echo "  ⚠ Warning: Port allocator not found. Using default values."
        PLATFORM_SN=0
        BASE_PLATFORM_PORT=11000
    fi

    # Calculate PLATFORM_PORT_END
    PLATFORM_PORT_END=$((BASE_PLATFORM_PORT + 199))

    # Export for use in template substitution
    export PLATFORM_SN
    export BASE_PLATFORM_PORT
    export PLATFORM_PORT_END
}

# Update platforms.json with platform information
update_platforms_json() {
    local platform_name="$1"
    local github_user="$2"
    local platform_description="$3"

    if [ ! -f "$PLATFORMS_JSON" ]; then
        echo "  ⚠ Warning: platforms.json not found. Skipping update."
        return
    fi

    echo "Updating platforms.json..."

    # Use Node.js to update the JSON file safely
    node -e "
    const fs = require('fs');
    const path = '$PLATFORMS_JSON';

    try {
        const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
        const now = new Date().toISOString();

        // Check if platform exists
        const platformExists = data.platforms && data.platforms['$platform_name'];

        if (!platformExists) {
            // Add new platform
            if (!data.platforms) data.platforms = {};

            data.platforms['$platform_name'] = {
                id: '$platform_name',
                sn: $PLATFORM_SN,
                name: '$platform_name',
                description: '$platform_description',
                githubUser: '$github_user',
                createdAt: now,
                updatedAt: now,
                status: 'active',
                settings: {
                    basePort: $BASE_PLATFORM_PORT,
                    network: {
                        subnet: '172.20.0.0/16',
                        gateway: '172.20.0.1'
                    }
                },
                projectCount: 0,
                projectIds: []
            };

            // Update metadata
            if (!data.metadata) data.metadata = {};
            data.metadata.lastUpdated = now;
            data.metadata.totalPlatforms = Object.keys(data.platforms).length;

            console.log('  ✓ Added new platform to platforms.json');
        } else {
            // Update existing platform
            data.platforms['$platform_name'].description = '$platform_description';
            data.platforms['$platform_name'].githubUser = '$github_user';
            data.platforms['$platform_name'].updatedAt = now;
            data.platforms['$platform_name'].settings.basePort = $BASE_PLATFORM_PORT;

            // Update metadata
            data.metadata.lastUpdated = now;

            console.log('  ✓ Updated existing platform in platforms.json');
        }

        fs.writeFileSync(path, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('  ⚠ Error updating platforms.json:', error.message);
        process.exit(1);
    }
    "
}

# Generate platform settings (without creating settings files)
generate_platform_settings() {
    local platform_name="$1"
    local github_user="$2"
    local platform_description="$3"

    echo "Generating platform settings..."

    # Get port allocation
    get_platform_port_allocation "$platform_name"

    # Generate secure values
    local mysql_root_password=$(generate_password)
    local postgres_password=$(generate_password)
    local jwt_secret_salt=$(generate_jwt_secret)
    local encryption_key=$(generate_jwt_secret)

    echo "  Platform SN: $PLATFORM_SN"
    echo "  Base Port: $BASE_PLATFORM_PORT"

    # Export important variables for use in template substitution
    export PLATFORM_MYSQL_ROOT_PASSWORD="$mysql_root_password"
    export PLATFORM_POSTGRES_PASSWORD="$postgres_password"
    export PLATFORM_JWT_SECRET_SALT="$jwt_secret_salt"
    export PLATFORM_ENCRYPTION_KEY="$encryption_key"
}

# Parse command line arguments
while getopts "n:u:d:l:t:h" opt; do
    case $opt in
        n)
            PLATFORM_NAME="$OPTARG"
            ;;
        u)
            GITHUB_USER="$OPTARG"
            ;;
        d)
            PLATFORM_DESCRIPTION="$OPTARG"
            ;;
        l)
            TARGET_LOCATION="$OPTARG"
            ;;
        t)
            TEMPLATE_DIRECTORY="$OPTARG"
            ;;
        h)
            echo "Usage: $0 -n <platform-name> -u <github-user-name> -d \"<platform-description>\" [-l <target-location>] [-t <template-directory>]"
            echo ""
            echo "Options:"
            echo "  -n  Platform name (required)"
            echo "  -u  GitHub username (required)"
            echo "  -d  Platform description (required)"
            echo "  -l  Target location (default: ./)"
            echo "  -t  Template directory (default: $MY_ROOT_PATH/_templates/docker-ubuntu)"
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

if [ -z "$GITHUB_USER" ]; then
    echo "Error: GitHub username (-u) is required" >&2
    exit 1
fi

if [ -z "$PLATFORM_DESCRIPTION" ]; then
    echo "Error: Platform description (-d) is required" >&2
    exit 1
fi

# Check if template directory exists
if [ ! -d "$TEMPLATE_DIRECTORY" ]; then
    echo "Error: Template directory '$TEMPLATE_DIRECTORY' does not exist" >&2
    exit 1
fi

# Generate platform settings (without creating settings files)
generate_platform_settings "$PLATFORM_NAME" "$GITHUB_USER" "$PLATFORM_DESCRIPTION"

# Create variable transformations
PLATFORM_NAME_UPPER=$(echo "$PLATFORM_NAME" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
PLATFORM_NAME_LOWER=$(echo "$PLATFORM_NAME" | tr '[:upper:]' '[:lower:]' | tr '-' '_')

echo "Creating new Ubuntu platform: $PLATFORM_NAME"
echo "GitHub user: $GITHUB_USER"
echo "Description: $PLATFORM_DESCRIPTION"
echo "Target location: $TARGET_LOCATION"
echo "Template directory: $TEMPLATE_DIRECTORY"
echo ""

# Step 0: Create target directory
echo "Step 0: Creating target directory..."
cd "$TARGET_LOCATION"
mkdir -p "$PLATFORM_NAME"
echo "Created directory: $TARGET_LOCATION/$PLATFORM_NAME"

# Step 1: Copy template directory contents
echo ""
echo "Step 1: Copying template contents..."
cp -rp "$TEMPLATE_DIRECTORY"/* "$PLATFORM_NAME"/
cp -rp "$TEMPLATE_DIRECTORY"/.[!.]* "$PLATFORM_NAME"/ 2>/dev/null || true
echo "Template contents copied successfully"

# Step 2: Variable substitution for PLATFORM_NAME
echo ""
echo "Step 2: Performing PLATFORM_NAME variable substitution..."

# List of files to process for PLATFORM_NAME variables
FILES_TO_SUBSTITUTE=(
    "$PLATFORM_NAME/.env"
    "$PLATFORM_NAME/.env.sample"
    "$PLATFORM_NAME/scripts/dev-start.sh"
    "$PLATFORM_NAME/README.md"
    "$PLATFORM_NAME/package.json"
    "$PLATFORM_NAME/environments/development/.env"
    "$PLATFORM_NAME/environments/staging/.env"
    "$PLATFORM_NAME/environments/production/.env"
)

for file in "${FILES_TO_SUBSTITUTE[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        # Create backup
        cp "$file" "$file.bak"

        # Perform variable substitutions
        sed -i "s/\${PLATFORM_NAME}/$PLATFORM_NAME/g" "$file"
        sed -i "s/\${PLATFORM_NAME_UPPER}/$PLATFORM_NAME_UPPER/g" "$file"
        sed -i "s/\${PLATFORM_NAME_LOWER}/$PLATFORM_NAME_LOWER/g" "$file"
        sed -i "s/\${GITHUB_USER}/$GITHUB_USER/g" "$file"
        sed -i "s/\${PLATFORM_DESCRIPTION}/$PLATFORM_DESCRIPTION/g" "$file"
        sed -i "s/\${PLATFORM_SN}/$PLATFORM_SN/g" "$file"
        sed -i "s/\${BASE_PLATFORM_PORT}/$BASE_PLATFORM_PORT/g" "$file"
        sed -i "s/\${PLATFORM_PORT_END}/$PLATFORM_PORT_END/g" "$file"
        sed -i "s/\${MYSQL_ROOT_PASSWORD}/$PLATFORM_MYSQL_ROOT_PASSWORD/g" "$file"
        sed -i "s/\${POSTGRES_PASSWORD}/$PLATFORM_POSTGRES_PASSWORD/g" "$file"
        sed -i "s/\${JWT_SECRET_SALT}/$PLATFORM_JWT_SECRET_SALT/g" "$file"
        sed -i "s/\${ENCRYPTION_KEY}/$PLATFORM_ENCRYPTION_KEY/g" "$file"

        # Remove backup if substitution was successful
        rm "$file.bak"
        echo "  ✓ Substituted variables in $file"
    else
        echo "  ⚠ File not found: $file"
    fi
done

echo "Variable substitution completed"

# Step 2.5: docker-compose.yml PLATFORM_NAME substitution only
echo ""
echo "Step 2.5: Performing docker-compose.yml PLATFORM_NAME substitution..."

DOCKER_COMPOSE_FILE="$PLATFORM_NAME/docker-compose.yml"
if [ -f "$DOCKER_COMPOSE_FILE" ]; then
    echo "Processing: $DOCKER_COMPOSE_FILE"
    # Create backup
    cp "$DOCKER_COMPOSE_FILE" "$DOCKER_COMPOSE_FILE.bak"

    # Only substitute PLATFORM_NAME in docker-compose.yml
    sed -i "s/\${PLATFORM_NAME}/$PLATFORM_NAME/g" "$DOCKER_COMPOSE_FILE"

    # Remove backup if substitution was successful
    rm "$DOCKER_COMPOSE_FILE.bak"
    echo "  ✓ Substituted PLATFORM_NAME in $DOCKER_COMPOSE_FILE"
else
    echo "  ⚠ File not found: $DOCKER_COMPOSE_FILE"
fi

# Step 3: Change to target directory
echo ""
echo "Step 3: Changing to target directory..."
cd "$PLATFORM_NAME"
echo "Current directory: $(pwd)"

# Step 4: Execute xgit command
echo ""
echo "Step 4: Executing xgit command..."
XGIT_CMD="xgit -e make -n \"$PLATFORM_NAME\" -u \"$GITHUB_USER\" -l \"$TARGET_LOCATION\" -d \"$PLATFORM_DESCRIPTION\""
echo "Running: $XGIT_CMD"

if command -v xgit >/dev/null 2>&1; then
    eval "$XGIT_CMD"
    echo "xgit command executed successfully"
else
    echo "⚠ Warning: xgit command not found. Skipping git initialization."
    echo "You can manually run: $XGIT_CMD"
fi

# Step 5: Update platforms.json
echo ""
echo "Step 5: Updating platforms.json..."
cd "$MY_ROOT_PATH"
update_platforms_json "$PLATFORM_NAME" "$GITHUB_USER" "$PLATFORM_DESCRIPTION"

# Step 6: Update repositories.json
echo ""
echo "Step 6: Updating repositories.json..."
if [ -f "$UPDATE_REPOSITORIES" ]; then
    # Calculate relative path from MY_ROOT_PATH
    RELATIVE_PATH="platforms/$PLATFORM_NAME"
    node "$UPDATE_REPOSITORIES" add-github "$PLATFORM_NAME" "platform" "$GITHUB_USER" "$PLATFORM_DESCRIPTION" "$RELATIVE_PATH"
else
    echo "  ⚠ Warning: update-repositories.js not found. Skipping repository registration."
fi

echo ""
echo "✅ Platform '$PLATFORM_NAME' created successfully!"
echo "Location: $TARGET_LOCATION/$PLATFORM_NAME"
echo "Platform SN: $PLATFORM_SN"
echo "Base Port: $BASE_PLATFORM_PORT"