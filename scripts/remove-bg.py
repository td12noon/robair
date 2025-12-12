#!/usr/bin/env python3
"""
Remove background from Rob Air logo image.
Usage: python3 scripts/remove-bg.py <input_image> <output_image>
"""

import sys
from pathlib import Path

def remove_background(input_path: str, output_path: str):
    """Remove background from image using rembg."""
    try:
        from rembg import remove
        from PIL import Image
    except ImportError:
        print("Installing required packages...")
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "rembg", "pillow", "-q"])
        from rembg import remove
        from PIL import Image
    
    print(f"Processing: {input_path}")
    
    # Open the input image
    input_image = Image.open(input_path)
    
    # Remove background
    output_image = remove(input_image)
    
    # Save as PNG with transparency
    output_image.save(output_path, "PNG")
    print(f"Saved: {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        # Default paths
        input_file = "public/robair-logo-original.png"
        output_file = "public/robair-logo.png"
    else:
        input_file = sys.argv[1]
        output_file = sys.argv[2]
    
    remove_background(input_file, output_file)
