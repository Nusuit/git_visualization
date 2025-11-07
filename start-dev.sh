#!/bin/bash

echo "=== Git Flow Visualizer - Development Mode ==="
echo ""

# Step 1: Clean up
echo "Step 1: Cleaning up old processes..."
taskkill //F //IM electron.exe 2>/dev/null || true
taskkill //F //IM node.exe 2>/dev/null || true
sleep 2

# Step 2: Build TypeScript
echo ""
echo "Step 2: Compiling TypeScript..."
npm run build:main
if [ $? -ne 0 ]; then
    echo "ERROR: Main process compilation failed!"
    exit 1
fi

npm run build:preload
if [ $? -ne 0 ]; then
    echo "ERROR: Preload compilation failed!"
    exit 1
fi

echo "✓ TypeScript compiled successfully"

# Step 3: Verify files
echo ""
echo "Step 3: Verifying compiled files..."
if [ ! -f "dist/main/index.js" ]; then
    echo "ERROR: dist/main/index.js not found!"
    exit 1
fi
if [ ! -f "dist/preload/index.js" ]; then
    echo "ERROR: dist/preload/index.js not found!"
    exit 1
fi
echo "✓ All files present"

# Step 4: Start Vite in background
echo ""
echo "Step 4: Starting Vite dev server..."
npm run dev:vite &
VITE_PID=$!
echo "✓ Vite started (PID: $VITE_PID)"

# Step 5: Wait for Vite
echo ""
echo "Step 5: Waiting for Vite to be ready..."
sleep 5

# Step 6: Start Electron
echo ""
echo "Step 6: Starting Electron..."
echo ""
echo "=== APP SHOULD OPEN NOW ==="
echo ""
NODE_ENV=development npx electron .

# Cleanup
echo ""
echo "Cleaning up..."
kill $VITE_PID 2>/dev/null || true

