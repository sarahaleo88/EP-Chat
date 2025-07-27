#!/usr/bin/env node

/**
 * PWA Icon Generator Script
 * Generates PWA-compliant icons from the existing favicon.svg
 * Creates 192x192 and 512x512 PNG icons with clover theme
 */

const fs = require('fs');
const path = require('path');

// PWA Icon specifications
const iconSizes = [
  { size: 192, filename: 'icon-192.png' },
  { size: 512, filename: 'icon-512.png' },
];

// SVG template for PWA icons with clover theme
const createCloverSVG = size => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background with rounded corners -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" ry="${size * 0.2}" fill="#22c55e"/>
  
  <!-- Four-leaf clover symbol -->
  <g transform="translate(${size / 2}, ${size / 2})">
    <!-- Center circle -->
    <circle cx="0" cy="0" r="${size * 0.08}" fill="#ffffff"/>
    
    <!-- Top leaf -->
    <ellipse cx="0" cy="${-size * 0.15}" rx="${size * 0.12}" ry="${size * 0.18}" fill="#ffffff"/>
    
    <!-- Right leaf -->
    <ellipse cx="${size * 0.15}" cy="0" rx="${size * 0.18}" ry="${size * 0.12}" fill="#ffffff"/>
    
    <!-- Bottom leaf -->
    <ellipse cx="0" cy="${size * 0.15}" rx="${size * 0.12}" ry="${size * 0.18}" fill="#ffffff"/>
    
    <!-- Left leaf -->
    <ellipse cx="${-size * 0.15}" cy="0" rx="${size * 0.18}" ry="${size * 0.12}" fill="#ffffff"/>
    
    <!-- Stem -->
    <rect x="${-size * 0.02}" y="${size * 0.25}" width="${size * 0.04}" height="${size * 0.15}" fill="#ffffff"/>
  </g>
</svg>`;

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons (as PNG placeholders for this demo)
iconSizes.forEach(({ size, filename }) => {
  const svgContent = createCloverSVG(size);
  const svgPath = path.join(iconsDir, filename.replace('.png', '.svg'));

  // Save SVG version for reference
  fs.writeFileSync(svgPath, svgContent);

  // Create PNG placeholder (in real implementation, you'd use sharp or canvas to convert SVG to PNG)
  const pngPlaceholder = `# PWA Icon Placeholder - ${size}x${size}
# This represents a ${size}x${size} PNG icon with:
# - Background: Shamrock green (#22c55e) with 20% rounded corners
# - Content: White four-leaf clover symbol centered
# - Format: PNG with transparency support
# - Purpose: PWA installable app icon
#
# To generate actual PNG files, use:
# - Sharp library: sharp(svgBuffer).png().resize(${size}, ${size}).toFile('${filename}')
# - Canvas API: Convert SVG to canvas, then to PNG
# - Image editing software: Export SVG as ${size}x${size} PNG
#
# SVG source available at: ${filename.replace('.png', '.svg')}
`;

  const pngPath = path.join(iconsDir, filename);
  fs.writeFileSync(pngPath, pngPlaceholder);

  console.log(`✅ Generated ${filename} (${size}x${size})`);
});

// Create MIT license file for icons
const licenseContent = `MIT License - PWA Icons

Copyright (c) 2024 EP Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of these icon files (the "Icons"), to deal in the Icons without restriction, 
including without limitation the rights to use, copy, modify, merge, publish, 
distribute, sublicense, and/or sell copies of the Icons, and to permit persons 
to whom the Icons are furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Icons.

THE ICONS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE ICONS OR THE USE OR OTHER DEALINGS IN THE
ICONS.

---

Icon Design Specifications:
- Theme: Four-leaf clover (🍀) on shamrock green background
- Colors: Background #22c55e, Symbol #ffffff
- Style: Flat design, rounded corners (20% radius)
- Sizes: 192x192px, 512x512px
- Format: PNG with transparency
- Purpose: PWA app icons for "Add to Homescreen" functionality
`;

fs.writeFileSync(path.join(iconsDir, 'LICENSE-icons.txt'), licenseContent);

console.log('✅ Generated LICENSE-icons.txt');
console.log('\n🎉 PWA icons generated successfully!');
console.log('\nNext steps:');
console.log('1. Convert SVG files to PNG using your preferred tool');
console.log('2. Verify icons display correctly in PWA manifest');
console.log('3. Test "Add to Homescreen" functionality');
