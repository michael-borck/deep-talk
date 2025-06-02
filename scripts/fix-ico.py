#!/usr/bin/env python3
from PIL import Image
import os

# Use the existing 256x256 PNG
source_png = '/home/michael/projects/local-listen/public/assets/icon-256x256.png'
ico_path = '/home/michael/projects/local-listen/public/assets/icon.ico'

# Open the 256x256 PNG
img = Image.open(source_png)

# Save as ICO with 256x256 size
img.save(ico_path, format='ICO', sizes=[(256, 256)])

print(f"Created Windows ICO with 256x256 icon")