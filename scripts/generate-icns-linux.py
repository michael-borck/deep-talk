#!/usr/bin/env python3
import struct
import os
from PIL import Image

def create_icns_from_pngs(output_path):
    """Create ICNS file from PNG images (Linux compatible)"""
    
    # ICNS file structure
    icns_header = b'icns'
    
    # Icon types and their sizes
    icon_types = [
        (b'icp4', 16),    # 16x16
        (b'icp5', 32),    # 32x32
        (b'icp6', 64),    # 64x64
        (b'ic07', 128),   # 128x128
        (b'ic08', 256),   # 256x256
        (b'ic09', 512),   # 512x512
        (b'ic10', 1024),  # 1024x1024 (macOS 10.7+)
    ]
    
    # Collect all icon data
    icon_data = []
    total_size = 8  # Header size
    
    iconset_path = '/home/michael/projects/local-listen/public/assets/icon.iconset'
    
    for icon_type, size in icon_types:
        # Find the appropriate PNG file
        png_files = [
            f'icon_{size}x{size}.png',
            f'icon_{size}x{size}@2x.png'
        ]
        
        png_data = None
        for png_file in png_files:
            png_path = os.path.join(iconset_path, png_file)
            if os.path.exists(png_path):
                with open(png_path, 'rb') as f:
                    png_data = f.read()
                break
        
        if png_data:
            # Each icon entry: 4 bytes type + 4 bytes size + data
            entry_size = 8 + len(png_data)
            icon_data.append((icon_type, entry_size, png_data))
            total_size += entry_size
    
    # Write ICNS file
    with open(output_path, 'wb') as f:
        # Write header
        f.write(icns_header)
        f.write(struct.pack('>I', total_size))
        
        # Write each icon
        for icon_type, entry_size, png_data in icon_data:
            f.write(icon_type)
            f.write(struct.pack('>I', entry_size))
            f.write(png_data)
    
    print(f"Created ICNS file: {output_path}")

if __name__ == "__main__":
    create_icns_from_pngs('/home/michael/projects/local-listen/public/assets/icon.icns')