#!/usr/bin/env bash
# Git Flow Visualizer - Hook Installation Script

set -euo pipefail

REPO="${1:-}"

if [ -z "$REPO" ]; then
  echo "Usage: scripts/install-hooks.sh /path/to/repo"
  echo ""
  echo "This script installs Git hooks for the Git Flow Visualizer"
  echo "to track commit, merge, checkout, and push events."
  exit 1
fi

if [ ! -d "$REPO/.git" ]; then
  echo "Error: '$REPO' is not a valid Git repository"
  exit 1
fi

HOOKS_DIR="$REPO/.git/hooks"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_HOOKS_DIR="$SCRIPT_DIR/hooks"

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

echo "Installing Git hooks to $HOOKS_DIR"

# Install each hook
for hook in post-commit post-merge post-checkout pre-push; do
  SOURCE="$SOURCE_HOOKS_DIR/$hook"
  TARGET="$HOOKS_DIR/$hook"
  
  if [ ! -f "$SOURCE" ]; then
    echo "Warning: Hook script not found: $SOURCE"
    continue
  fi
  
  # Backup existing hook if present
  if [ -f "$TARGET" ]; then
    BACKUP="$TARGET.backup.$(date +%s)"
    echo "Backing up existing $hook to $BACKUP"
    cp "$TARGET" "$BACKUP"
  fi
  
  # Copy hook
  cp "$SOURCE" "$TARGET"
  chmod +x "$TARGET"
  
  echo "✓ Installed $hook"
done

echo ""
echo "Git hooks installed successfully!"
echo ""
echo "The following events will now be tracked:"
echo "  • Commits (post-commit)"
echo "  • Merges (post-merge)"
echo "  • Branch checkouts (post-checkout)"
echo "  • Pushes (pre-push)"
echo ""
echo "Make sure the Git Flow Visualizer app is running to receive events."

