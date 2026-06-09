const path = require('path');
const fs = require('fs');

// Path to canvas in backend node_modules (relative or absolute)
const canvasPath = path.join(__dirname, '../../backend/node_modules/canvas');
let canvas;
try {
  canvas = require(canvasPath);
} catch (e) {
  console.error(`Failed to load canvas from ${canvasPath}. Error:`, e.message);
  process.exit(1);
}

const { createCanvas, loadImage } = canvas;

const sourceDir = "C:/Users/Souvik/.gemini/antigravity-ide/brain/e5be3fa7-d1cd-4bbd-affd-525f0a84cc45";
const resDir = path.join(__dirname, '../android/app/src/main/res');

// Sources
const srcLegacy = path.join(sourceDir, "play_store_icon_1780306937661.png");
const srcForeground = path.join(sourceDir, "app_icon_foreground_1780306956091.png");

// Densities and sizes
const densities = [
  { dir: "mipmap-mdpi", legacy: 48, adaptive: 108 },
  { dir: "mipmap-hdpi", legacy: 72, adaptive: 162 },
  { dir: "mipmap-xhdpi", legacy: 96, adaptive: 216 },
  { dir: "mipmap-xxhdpi", legacy: 144, adaptive: 324 },
  { dir: "mipmap-xxxhdpi", legacy: 192, adaptive: 432 }
];

async function resizeImage(srcPath, destPath, size) {
  console.log(`Resizing ${srcPath} -> ${destPath} (${size}x${size})`);
  const img = await loadImage(srcPath);
  const cvs = createCanvas(size, size);
  const ctx = cvs.getContext('2d');
  
  // High quality resize
  ctx.patternQuality = 'best';
  ctx.quality = 'best';
  ctx.imageSmoothingEnabled = true;
  
  ctx.drawImage(img, 0, 0, size, size);
  
  const out = fs.createWriteStream(destPath);
  const stream = cvs.createPNGStream();
  stream.pipe(out);
  
  return new Promise((resolve, reject) => {
    out.on('finish', resolve);
    out.on('error', reject);
  });
}

async function run() {
  if (!fs.existsSync(srcLegacy)) {
    throw new Error(`Source legacy image not found: ${srcLegacy}`);
  }
  if (!fs.existsSync(srcForeground)) {
    throw new Error(`Source foreground image not found: ${srcForeground}`);
  }

  for (const d of densities) {
    const dirPath = path.join(resDir, d.dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating directory ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Legacy standard
    await resizeImage(srcLegacy, path.join(dirPath, "ic_launcher.png"), d.legacy);
    // Legacy round
    await resizeImage(srcLegacy, path.join(dirPath, "ic_launcher_round.png"), d.legacy);
    // Adaptive foreground
    await resizeImage(srcForeground, path.join(dirPath, "ic_launcher_foreground.png"), d.adaptive);
  }
  console.log("All launcher icons successfully generated!");
}

run().catch(err => {
  console.error("Execution failed:", err);
  process.exit(1);
});
