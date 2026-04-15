#!/usr/bin/env python3
"""Convert Piggy Bank SVG icon to PNG at various sizes needed for the app"""

import subprocess
import sys
from pathlib import Path

# Sizes needed for different platforms
ICON_SIZES = {
    "icon.png": 192,  # General app icon
    "favicon.png": 192,  # Web favicon
    "splash-icon.png": 200,  # Splash screen
    "android-icon-foreground.png": 192,  # Android foreground
    "android-icon-background.png": 192,  # Android background
    "android-icon-monochrome.png": 192,  # Android monochrome
}

def convert_svg_to_png():
    """Convert SVG to PNG using ImageMagick or similar tool"""
    
    svg_path = Path("assets/images/Piggy-bank-icon.svg")
    assets_dir = Path("assets/images")
    
    if not svg_path.exists():
        print(f"Error: SVG file not found at {svg_path}")
        sys.exit(1)
    
    # Try using ImageMagick convert command
    print(f"Converting SVG icon to PNG formats...")
    
    for filename, size in ICON_SIZES.items():
        output_path = assets_dir / filename
        
        # Using ImageMagick's convert command
        cmd = [
            "convert",
            "-background", "none",
            "-resize", f"{size}x{size}",
            str(svg_path),
            str(output_path)
        ]
        
        try:
            print(f"  Creating {filename} ({size}x{size})...")
            subprocess.run(cmd, check=True, capture_output=True)
            print(f"    ✓ Created {filename}")
        except FileNotFoundError:
            print(f"  Error: ImageMagick 'convert' command not found")
            print(f"  Please install ImageMagick or use an online SVG to PNG converter")
            return False
        except subprocess.CalledProcessError as e:
            print(f"  Error converting {filename}: {e.stderr.decode()}")
            return False
    
    return True

if __name__ == "__main__":
    if not convert_svg_to_png():
        print("\nConversion failed. You can:")
        print("1. Install ImageMagick from: https://imagemagick.org/")
        print("2. Or use an online converter like: https://convertio.co/svg-png/")
        sys.exit(1)
    
    print("\n✓ All icons converted successfully!")
