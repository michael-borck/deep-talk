#!/usr/bin/env python3
import struct
import os
from PIL import Image

def create_icns_from_pngs(output_path):
    """Create ICNS file from PNG images (Linux compatible)"""
    
    assets_path = '/home/michael/projects/local-listen/public/assets'
    
    # ICNS file structure
    icns_header = b'icns'
    
    # Icon types and their sizes - use the PNG files we already generated
    icon_types = [
        (b'icp4', 16),    # 16x16
        (b'icp5', 32),    # 32x32  
        (b'icp6', 64),    # 64x64
        (b'ic07', 128),   # 128x128
        (b'ic08', 256),   # 256x256
        (b'ic09', 512),   # 512x512
        (b'ic10', 1024),  # 1024x1024
    ]
    
    # Collect all icon data
    icon_data = []
    total_size = 8  # Header size
    
    for icon_type, size in icon_types:
        # Use our generated PNG files
        png_path = os.path.join(assets_path, f'icon-{size}x{size}.png')
        
        if os.path.exists(png_path):
            with open(png_path, 'rb') as f:
                png_data = f.read()
            
            # Each icon entry: 4 bytes type + 4 bytes size + data
            entry_size = 8 + len(png_data)
            icon_data.append((icon_type, entry_size, png_data))
            total_size += entry_size
            print(f"Added {size}x{size} icon ({len(png_data)} bytes)")
    
    if not icon_data:
        print("No icon files found!")
        return
    
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
    
    print(f"Created ICNS file: {output_path} ({total_size} bytes)")

if __name__ == "__main__":
    create_icns_from_pngs('/home/michael/projects/local-listen/public/assets/icon.icns')