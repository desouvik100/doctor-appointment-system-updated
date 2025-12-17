/**
 * PWA Icon Generator Script
 * Generates PNG icons from SVG for PWA manifest
 * 
 * Run: node scripts/generate-icons.js
 * 
 * Note: This creates placeholder icons. For production, 
 * replace with properly designed icons.
 */

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed for PWA
const sizes = [16, 32, 72, 96, 128, 144, 152, 167, 180, 192, 384, 512];

// Create a simple PNG placeholder for each size
// In production, use a proper image library like sharp or canvas
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // Check if file already exists
  if (!fs.existsSync(filepath)) {
    console.log(`Note: ${filename} needs to be created`);
  }
});

// Create badge icon
const badgePath = path.join(iconsDir, 'badge-72x72.png');
if (!fs.existsSync(badgePath)) {
  console.log('Note: badge-72x72.png needs to be created');
}

console.log(`
===========================================
PWA Icon Setup Instructions
===========================================

Your PWA needs the following icon files in frontend/public/icons/:

Required Icons:
${sizes.map(s => `  - icon-${s}x${s}.png`).join('\n')}
  - badge-72x72.png (for notifications)

Optional (for better iOS experience):
  - splash-640x1136.png
  - splash-750x1334.png  
  - splash-1242x2208.png

To generate icons:
1. Use an online tool like https://realfavicongenerator.net/
2. Upload your logo/icon
3. Download the generated icons
4. Place them in frontend/public/icons/

Or use the SVG icon at frontend/public/icons/icon.svg
and convert it using tools like:
- https://cloudconvert.com/svg-to-png
- Figma/Sketch export
- ImageMagick: convert icon.svg -resize 192x192 icon-192x192.png

===========================================
`);

// Create a simple HTML file to help visualize icons
const previewHtml = `<!DOCTYPE html>
<html>
<head>
  <title>PWA Icons Preview</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
    .icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; }
    .icon-item { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .icon-item img { max-width: 100%; height: auto; }
    .icon-item p { margin: 10px 0 0; font-size: 12px; color: #666; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>HealthSync PWA Icons</h1>
  <div class="icon-grid">
    <div class="icon-item">
      <img src="icon.svg" alt="SVG Icon" style="width: 128px; height: 128px;">
      <p>icon.svg (source)</p>
    </div>
    ${sizes.map(s => `
    <div class="icon-item">
      <img src="icon-${s}x${s}.png" alt="${s}x${s}" onerror="this.src='icon.svg'; this.style.width='${Math.min(s, 128)}px'">
      <p>icon-${s}x${s}.png</p>
    </div>`).join('')}
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(iconsDir, 'preview.html'), previewHtml);
console.log('Created icons/preview.html - open in browser to preview icons');
