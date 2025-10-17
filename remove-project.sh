#!/bin/bash

# Remove project (local, remote, or both)
# Usage: ./remove-project.sh -n <project-name> [-r remote|local|all]

set -e

# Load DOCKER_ROOT_PATH from .env
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
fi

# Use DOCKER_ROOT_PATH or fallback to default
DOCKER_ROOT_PATH="${DOCKER_ROOT_PATH:-/var/services/homes/jungsam/dockers}"

# Manager data directory
MANAGER_DATA_DIR="$DOCKER_ROOT_PATH/_manager/data"
PROJECTS_JSON="$MANAGER_DATA_DIR/projects.json"
REPOSITORIES_JSON="$MANAGER_DATA_DIR/repositories.json"

# Scripts directory
SCRIPTS_DIR="$DOCKER_ROOT_PATH/_manager/scripts"
UPDATE_REPOSITORIES="$SCRIPTS_DIR/update-repositories.js"

# Default values
PROJECT_NAME=""
REMOVE_TYPE="remote"  # remote, local, all

# Get project data from repositories.json
get_project_data() {
    local project_name="$1"

    if [ ! -f "$REPOSITORIES_JSON" ]; then
        echo "Error: repositories.json not found at $REPOSITORIES_JSON" >&2
        return 1
    fi

    # Get GitHub user and local path from repositories.json
    PROJECT_DATA=$(node -e "
        const fs = require('fs');
        const data = JSON.parse(fs.readFileSync('$REPOSITORIES_JSON', 'utf-8'));
        if (data.github && data.github['$project_name']) {
            console.log(JSON.stringify({
                user: data.github['$project_name'].user,
                localPath: data.github['$project_name'].path.local
            }));
        } else {
            console.log('');
        }
    ")

    if [ -z "$PROJECT_DATA" ]; then
        echo "Warning: Project '$project_name' not found in repositories.json" >&2
        echo "Proceeding with local deletion only..." >&2
        return 1
    fi

    # Parse JSON data
    GITHUB_USER=$(echo "$PROJECT_DATA" | node -e "
        const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
        console.log(data.user);
    ")

    LOCAL_PATH=$(echo "$PROJECT_DATA" | node -e "
        const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
        console.log(data.localPath);
    ")

    return 0
}

# Remove remote repository using xgit
remove_remote_repository() {
    local project_name="$1"
    local github_user="$2"

    echo "Removing remote repository..."
    echo "  Project: $project_name"
    echo "  User: $github_user"

    if command -v xgit >/dev/null 2>&1; then
        XGIT_CMD="xgit -e del -n \"$project_name\" -u \"$github_user\""
        echo "Running: $XGIT_CMD"

        if eval "$XGIT_CMD"; then
            echo "  ✓ Remote repository deleted successfully"
        else
            echo "  ⚠ Failed to delete remote repository (may not exist or already deleted)"
        fi
    else
        echo "  ⚠ Warning: xgit command not found. Skipping remote deletion."
        echo "  You can manually delete: https://github.com/$github_user/$project_name"
    fi
}

# Remove local repository
remove_local_repository() {
    local project_name="$1"
    local local_path="$2"
    local project_path="$DOCKER_ROOT_PATH/$local_path"

    echo "Removing local repository..."
    echo "  Path: $project_path"

    if [ -d "$project_path" ]; then
        rm -rf "$project_path"
        echo "  ✓ Local repository deleted successfully"
    else
        echo "  ⚠ Local repository not found (may already be deleted)"
    fi
}

# Update projects.json - remove project entry
update_projects_json() {
    local project_name="$1"

    if [ ! -f "$PROJECTS_JSON" ]; then
        echo "  ⚠ Warning: projects.json not found. Skipping update."
        return
    fi

    echo "Updating projects.json..."

    node -e "
    const fs = require('fs');
    const path = '$PROJECTS_JSON';

    try {
        const data = JSON.parse(fs.readFileSync(path, 'utf-8'));

        if (data.projects && data.projects['$project_name']) {
            delete data.projects['$project_name'];

            // Update metadata
            if (!data.metadata) data.metadata = {};
            data.metadata.lastUpdated = new Date().toISOString();
            data.metadata.totalProjects = Object.keys(data.projects).length;

            fs.writeFileSync(path, JSON.stringify(data, null, 2));
            console.log('  ✓ Removed project from projects.json');
        } else {
            console.log('  ⚠ Project not found in projects.json');
        }
    } catch (error) {
        console.error('  ⚠ Error updating projects.json:', error.message);
    }
    "
}

# Update repositories.json - remove repository entry
update_repositories_json() {
    local project_name="$1"

    if [ ! -f "$UPDATE_REPOSITORIES" ]; then
        echo "  ⚠ Warning: update-repositories.js not found. Skipping repository update."
        return
    fi

    echo "Updating repositories.json..."
    node "$UPDATE_REPOSITORIES" remove "$project_name"
}

# Parse command line arguments
while getopts "n:r:h" opt; do
    case $opt in
        n)
            PROJECT_NAME="$OPTARG"
            ;;
        r)
            REMOVE_TYPE="$OPTARG"
            ;;
        h)
            echo "Usage: $0 -n <project-name> [-r remote|local|all]"
            echo ""
            echo "Options:"
            echo "  -n  Project name (required, e.g., ubuntu-project-2)"
            echo "  -r  Remove type: remote, local, or all (default: remote)"
            echo "      remote - Remove only GitHub repository"
            echo "      local  - Remove only local files"
            echo "      all    - Remove both remote and local"
            echo "  -h  Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0 -n ubuntu-project-2                    # Remove remote only"
            echo "  $0 -n ubuntu-project-2 -r local           # Remove local only"
            echo "  $0 -n ubuntu-project-2 -r all             # Remove both"
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
if [ -z "$PROJECT_NAME" ]; then
    echo "Error: Project name (-n) is required" >&2
    exit 1
fi

# Validate remove type
if [[ ! "$REMOVE_TYPE" =~ ^(remote|local|all)$ ]]; then
    echo "Error: Invalid remove type. Must be: remote, local, or all" >&2
    exit 1
fi

echo "========================================="
echo "Project Removal"
echo "========================================="
echo "Project: $PROJECT_NAME"
echo "Remove Type: $REMOVE_TYPE"
echo "========================================="
echo ""

# Get project data
get_project_data "$PROJECT_NAME"
PROJECT_EXISTS=$?

# Confirmation prompt
read -p "Are you sure you want to remove project '$PROJECT_NAME'? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

echo ""

# Execute removal based on type
case "$REMOVE_TYPE" in
    remote)
        if [ $PROJECT_EXISTS -eq 0 ]; then
            remove_remote_repository "$PROJECT_NAME" "$GITHUB_USER"
        else
            echo "Cannot remove remote repository: Project data not found"
        fi
        ;;
    local)
        if [ $PROJECT_EXISTS -eq 0 ]; then
            remove_local_repository "$PROJECT_NAME" "$LOCAL_PATH"
        else
            # Fallback: try to find local path from projects.json
            echo "⚠ Project data not found in repositories.json"
            echo "Attempting to find local path from projects.json..."

            FALLBACK_PATH=$(node -e "
                const fs = require('fs');
                const projectsPath = '$PROJECTS_JSON';
                if (fs.existsSync(projectsPath)) {
                    const data = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));
                    if (data.projects && data.projects['$PROJECT_NAME']) {
                        const platformId = data.projects['$PROJECT_NAME'].platformId;
                        console.log('platforms/' + platformId + '/projects/$PROJECT_NAME');
                    }
                }
            ")

            if [ -n "$FALLBACK_PATH" ]; then
                remove_local_repository "$PROJECT_NAME" "$FALLBACK_PATH"
            else
                echo "  ⚠ Could not determine project path"
            fi
        fi
        ;;
    all)
        if [ $PROJECT_EXISTS -eq 0 ]; then
            remove_remote_repository "$PROJECT_NAME" "$GITHUB_USER"
            remove_local_repository "$PROJECT_NAME" "$LOCAL_PATH"
        else
            echo "Cannot remove remote repository: Project data not found"
            echo "Attempting local removal only..."

            FALLBACK_PATH=$(node -e "
                const fs = require('fs');
                const projectsPath = '$PROJECTS_JSON';
                if (fs.existsSync(projectsPath)) {
                    const data = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));
                    if (data.projects && data.projects['$PROJECT_NAME']) {
                        const platformId = data.projects['$PROJECT_NAME'].platformId;
                        console.log('platforms/' + platformId + '/projects/$PROJECT_NAME');
                    }
                }
            ")

            if [ -n "$FALLBACK_PATH" ]; then
                remove_local_repository "$PROJECT_NAME" "$FALLBACK_PATH"
            fi
        fi
        ;;
esac

# Update data files (for all cases)
echo ""
echo "Updating data files..."
update_projects_json "$PROJECT_NAME"
update_repositories_json "$PROJECT_NAME"

echo ""
echo "========================================="
echo "✅ Project removal completed!"
echo "========================================="
echo "Project: $PROJECT_NAME"
echo "Remove Type: $REMOVE_TYPE"
echo "========================================="
