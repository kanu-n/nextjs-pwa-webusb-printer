#!/bin/bash

# Create simple placeholder icons for PWA
# This script creates PNG icons from the SVG

echo "Creating placeholder PWA icons..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick not found. Creating placeholder files..."
    
    # Create placeholder files
    echo "Placeholder icon 192x192" > public/icon-192x192.png
    echo "Placeholder icon 512x512" > public/icon-512x512.png
    echo "Placeholder favicon" > public/favicon.ico
    
    echo "Note: Install ImageMagick to generate proper icons from SVG"
else
    # Convert SVG to PNG icons
    convert -background none -resize 192x192 public/icon.svg public/icon-192x192.png
    convert -background none -resize 512x512 public/icon.svg public/icon-512x512.png
    convert -background none -resize 32x32 public/icon.svg public/favicon.ico
    
    echo "Icons generated successfully!"
fi
