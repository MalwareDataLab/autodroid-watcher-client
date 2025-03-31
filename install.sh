#!/bin/bash

INSTALL_DIR="./autodroid-watcher-client"
TOKEN=""
URL=""
NAME=""

show_help() {
    echo "Usage: $0 [OPTIONS] --token TOKEN --url URL --name NAME"
    echo
    echo "Required Parameters:"
    echo "  --token, -t TOKEN    Authentication token for worker"
    echo "  --url, -u URL        The server URL"
    echo "  --name, -n NAME      Name of the worker"
    echo
    echo "Options:"
    echo "  -d, --dir DIR        Installation directory (default: ./autodroid-watcher-client)"
    echo "  -h, --help           Show this help message"
    echo
    echo "Example:"
    echo "  $0 --token abc123 --url http://server:3000 --name worker1"
    echo "  $0 -t abc123 -u http://server:3000 -n worker1 -d /opt/autodroid"
}

command_exists() { command -v "$1" >/dev/null 2>&1; }
version_gt() { test "$(printf '%s\n' "$@" | sort -V | head -n 1)" != "$1"; }

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dir) INSTALL_DIR="$2"; shift 2 ;;
        -h|--help) show_help; exit 0 ;;
        -t|--token) TOKEN="$2"; shift 2 ;;
        -u|--url) URL="$2"; shift 2 ;;
        -n|--name) NAME="$2"; shift 2 ;;
        *) echo "Unknown option: $1"; show_help; exit 1 ;;
    esac
done

# Check if required parameters are present
if [ -z "$TOKEN" ]; then
    echo "Error: --token or -t is required"
    show_help
    exit 1
fi

if [ -z "$URL" ]; then
    echo "Error: --url or -u is required"
    show_help
    exit 1
fi

if [ -z "$NAME" ]; then
    echo "Error: --name or -n is required"
    show_help
    exit 1
fi

echo "Starting AutoDroid Watcher Client installation..."

if ! command_exists node; then
    echo "Error: Node.js is not installed. Please install Node.js version 22 or higher."
    exit 1
fi

if ! command_exists npm; then
    echo "Error: npm is not installed. Please install npm."
    exit 1
fi

CURRENT_NODE_VERSION=$(node -v | sed 's/^v//')
if version_gt "22.0.0" "$CURRENT_NODE_VERSION"; then
    echo "Error: Node.js version must be 22 or higher. Current version: $CURRENT_NODE_VERSION"
    exit 1
fi

if ! command_exists pm2; then
    echo "Installing pm2..."
    npm install -g pm2
fi

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "Downloading latest dist folder..."
curl -s -H "Cache-Control: no-cache" -L "https://github.com/MalwareDataLab/autodroid-watcher-client/archive/main.zip" -o repo.zip
unzip -q repo.zip
rm repo.zip

echo "Updating files..."
rm -rf "$INSTALL_DIR"/*
cp -r autodroid-watcher-client-main/dist/* "$INSTALL_DIR/"

cd "$INSTALL_DIR"
rm -rf "$TEMP_DIR"

echo "Starting service..."
pm2 stop autodroid-watcher 2>/dev/null || true
pm2 delete autodroid-watcher 2>/dev/null || true
pm2 start ./index.js --name autodroid-watcher -- --token "$TOKEN" --url "$URL" --name "$NAME"
pm2 save && pm2 startup

echo "Installation completed!"
echo "Useful commands:"
echo "• pm2 logs autodroid-watcher  # View logs"
echo "• pm2 monit                   # Monitor resources"
echo "• pm2 stop autodroid-watcher  # Stop service"
echo "• pm2 delete autodroid-watcher # Delete service"