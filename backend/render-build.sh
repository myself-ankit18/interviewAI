#!/usr/bin/env bash
# exit on error
set -o errexit

# Install Google Chrome Stable for Puppeteer PDF generation on Render.
# Using the official Google Chrome package is far more reliable than Puppeteer's
# bundled Chromium, which often fails in container environments.
echo "--- Installing Google Chrome Stable for Puppeteer ---"
apt-get update
apt-get install -y wget gnupg ca-certificates --no-install-recommends

wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-linux-signing-key.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-linux-signing-key.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list

apt-get update
apt-get install -y google-chrome-stable --no-install-recommends

echo "--- Chrome installed at: $(which google-chrome-stable) ---"

# Skip downloading Puppeteer's bundled Chromium since we use the system Chrome
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Run standard npm install
echo "--- Running npm install ---"
npm install

echo "--- Build process complete ---"
