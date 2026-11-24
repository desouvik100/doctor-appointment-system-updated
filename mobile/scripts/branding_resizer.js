const path = require('path');
const fs = require('fs');

const canvasPath = path.join(__dirname, '../../backend/node_modules/canvas');
let canvas;
try {
  canvas = require(canvasPath);
} catch (e) {
  console.error(`Failed to load canvas from ${canvasPath}. Error:`, e.message);
  process.exit(1);
}

const { createCanvas, loadImage } = canvas;

const srcIcon = "C:/Users/Souvik/.gemini/antigravity-ide/brain/1794522a-dc86-4334-a893-123c7cceb9b9/logo_icon_1780439306056.png";
const srcLogo = "C:/Users/Souvik/.gemini/antigravity-ide/brain/1794522a-dc86-4334-a893-123c7cceb9b9/logo_1780439320073.png";

const destIcon = path.join(__dirname, '../src/assets/logo_icon.png');
const destLogo = path.join(__dirname, '../src/assets/logo.png');

const resDir = path.join(__dirname, '../android/app/src/main/res');

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

  if (!fs.existsSync(srcIcon)) {
    throw new Error(`Source icon image not found: ${srcIcon}`);
  }
  if (!fs.existsSync(srcLogo)) {
    throw new Error(`Source logo image not found: ${srcLogo}`);
  }

  const assetsDir = path.dirname(destIcon);
  if (!fs.existsSync(assetsDir)) {
    console.log(`Creating directory ${assetsDir}`);
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  console.log(`Copying source files to mobile/src/assets...`);
  fs.copyFileSync(srcIcon, destIcon);
  fs.copyFileSync(srcLogo, destLogo);
  console.log(`Copied raw logo/icon to project assets.`);

  for (const d of densities) {
    const dirPath = path.join(resDir, d.dir);
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating directory ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true });
    }

    await resizeImage(destIcon, path.join(dirPath, "ic_launcher.png"), d.legacy);

    await resizeImage(destIcon, path.join(dirPath, "ic_launcher_round.png"), d.legacy);

    await resizeImage(destIcon, path.join(dirPath, "ic_launcher_foreground.png"), d.adaptive);
  }
  console.log("All launcher icons and assets successfully generated and copied!");
}

run().catch(err => {
  console.error("Execution failed:", err);
  process.exit(1);
});
