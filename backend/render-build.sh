#!/usr/bin/env bash
# exit on error
set -o errexit

# Install system dependencies for Puppeteer/Chromium on Linux (Render Environment)
# We need these libraries to allow Chromium to render HTML to PDF in a headless state.
echo "--- Installing Puppeteer system dependencies ---"
apt-get update && apt-get install -y \
    libnss3 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libxshmfence1 \
    libnss3-dev \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    ca-certificates \
    fonts-liberation \
    lsb-release \
    xdg-utils \
    wget \
    --no-install-recommends

# Run standard npm install
echo "--- Running npm install ---"
npm install

echo "--- Build process complete ---"
