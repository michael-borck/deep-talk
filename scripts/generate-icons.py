#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw, ImageFont
import subprocess

def create_base_icon(size=1024):
    """Create a modern base icon for LocalListen"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background circle with gradient effect
    padding = size // 8
    circle_bbox = [padding, padding, size - padding, size - padding]
    
    # Main circle - dark blue/purple gradient
    draw.ellipse(circle_bbox, fill='#4A5568')
    
    # Inner circle - lighter shade
    inner_padding = size // 6
    inner_bbox = [inner_padding, inner_padding, size - inner_padding, size - inner_padding]
    draw.ellipse(inner_bbox, fill='#5B6B7F')
    
    # Microphone icon in the center
    mic_width = size // 4
    mic_height = size // 2.5
    mic_x = (size - mic_width) // 2
    mic_y = (size - mic_height) // 2 - size // 20
    
    # Microphone body
    mic_body = [
        mic_x + mic_width // 3,
        mic_y,
        mic_x + 2 * mic_width // 3,
        mic_y + mic_height // 2
    ]
    draw.rounded_rectangle(mic_body, radius=mic_width//6, fill='#E2E8F0')
    
    # Microphone grille lines
    line_spacing = mic_height // 12
    for i in range(3):
        y = mic_y + line_spacing * (i + 1)
        draw.line(
            [(mic_body[0] + 5, y), (mic_body[2] - 5, y)],
            fill='#A0AEC0',
            width=max(2, size // 200)
        )
    
    # Microphone stand
    stand_width = mic_width // 6
    stand_x = (size - stand_width) // 2
    stand_y = mic_y + mic_height // 2
    stand_height = mic_height // 4
    
    # Vertical stand
    draw.rectangle(
        [stand_x, stand_y, stand_x + stand_width, stand_y + stand_height],
        fill='#E2E8F0'
    )
    
    # Base
    base_width = mic_width // 2
    base_x = (size - base_width) // 2
    base_y = stand_y + stand_height - size // 50
    base_height = size // 20
    draw.ellipse(
        [base_x, base_y, base_x + base_width, base_y + base_height],
        fill='#E2E8F0'
    )
    
    # Sound waves
    wave_color = '#94A3B8'
    wave_width = max(3, size // 150)
    
    # Left waves
    for i in range(3):
        offset = (i + 1) * size // 16
        arc_bbox = [
            mic_x - offset,
            mic_y - size // 20,
            mic_x,
            mic_y + mic_height // 2 + size // 20
        ]
        draw.arc(arc_bbox, start=120, end=240, fill=wave_color, width=wave_width)
    
    # Right waves
    for i in range(3):
        offset = (i + 1) * size // 16
        arc_bbox = [
            mic_x + mic_width,
            mic_y - size // 20,
            mic_x + mic_width + offset,
            mic_y + mic_height // 2 + size // 20
        ]
        draw.arc(arc_bbox, start=300, end=60, fill=wave_color, width=wave_width)
    
    return img

def generate_png_sizes(base_icon):
    """Generate PNG files in various sizes"""
    sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024]
    
    for size in sizes:
        resized = base_icon.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(f'/home/michael/projects/local-listen/public/assets/icon-{size}x{size}.png', 'PNG')
    
    # Also save the main icon.png at 512x512
    main_icon = base_icon.resize((512, 512), Image.Resampling.LANCZOS)
    main_icon.save('/home/michael/projects/local-listen/public/assets/icon.png', 'PNG')
    print("Generated PNG icons")

def generate_ico(base_icon):
    """Generate Windows ICO file"""
    # Windows ICO typically includes these sizes
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (256, 256)]
    
    # Create ICO file manually with all sizes
    ico_path = '/home/michael/projects/local-listen/public/assets/icon.ico'
    
    # First, save individual PNG files
    temp_files = []
    for i, size in enumerate(sizes):
        img = base_icon.resize(size, Image.Resampling.LANCZOS)
        temp_path = f'/tmp/icon_{i}_{size[0]}.png'
        img.save(temp_path, 'PNG')
        temp_files.append(temp_path)
    
    # Create the ICO file
    images = []
    for size in sizes:
        img = base_icon.resize(size, Image.Resampling.LANCZOS)
        images.append(img)
    
    # Save multi-size ICO
    images[0].save(
        ico_path,
        format='ICO',
        sizes=sizes
    )
    
    # Clean up temp files
    for temp_file in temp_files:
        if os.path.exists(temp_file):
            os.remove(temp_file)
    
    print("Generated Windows ICO file")

def generate_icns(base_icon):
    """Generate macOS ICNS file using iconutil"""
    iconset_path = '/home/michael/projects/local-listen/public/assets/icon.iconset'
    os.makedirs(iconset_path, exist_ok=True)
    
    # macOS icon sizes
    sizes = [
        (16, 'icon_16x16.png'),
        (32, 'icon_16x16@2x.png'),
        (32, 'icon_32x32.png'),
        (64, 'icon_32x32@2x.png'),
        (128, 'icon_128x128.png'),
        (256, 'icon_128x128@2x.png'),
        (256, 'icon_256x256.png'),
        (512, 'icon_256x256@2x.png'),
        (512, 'icon_512x512.png'),
        (1024, 'icon_512x512@2x.png')
    ]
    
    for size, filename in sizes:
        resized = base_icon.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(os.path.join(iconset_path, filename), 'PNG')
    
    # Check if we're on macOS and can use iconutil
    if os.path.exists('/usr/bin/iconutil'):
        subprocess.run([
            'iconutil', '-c', 'icns', '-o',
            '/home/michael/projects/local-listen/public/assets/icon.icns',
            iconset_path
        ])
        print("Generated macOS ICNS file using iconutil")
    else:
        print("Note: iconutil not found. ICNS file generation requires macOS.")
        print("PNG files for iconset have been created in:", iconset_path)
    
    # Clean up iconset directory if ICNS was created
    if os.path.exists('/home/michael/projects/local-listen/public/assets/icon.icns'):
        import shutil
        shutil.rmtree(iconset_path)

def main():
    print("Generating LocalListen app icons...")
    
    # Create base icon
    base_icon = create_base_icon(1024)
    
    # Generate all formats
    generate_png_sizes(base_icon)
    generate_ico(base_icon)
    generate_icns(base_icon)
    
    print("\nIcon generation complete!")
    print("Generated files:")
    print("- PNG icons (various sizes)")
    print("- icon.ico (Windows)")
    if os.path.exists('/home/michael/projects/local-listen/public/assets/icon.icns'):
        print("- icon.icns (macOS)")

if __name__ == "__main__":
    main()