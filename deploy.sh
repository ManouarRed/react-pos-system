#!/bin/bash

echo "? Installing npm dependencies..."

# Install with legacy-peer-deps to avoid some conflicts
npm install --legacy-peer-deps || { echo "❌ npm install failed"; exit 1; }

echo "? Installing xlsx package..."
npm install xlsx || { echo "❌ xlsx install failed"; exit 1; }

echo "? Ensuring vite@4.x is installed..."
npm install --save-dev vite@4 || { echo "❌ vite install failed"; exit 1; }

echo "⚙️ Building the project..."
npm run build || { echo "❌ build failed"; exit 1; }

echo "✅ Installation and build complete."
