#!/usr/bin/env node

/**
 * Image Optimization Script
 * 
 * This script will:
 * 1. Find all images in frontend/public/images
 * 2. Compress PNG/JPG files
 * 3. Convert to WebP format
 * 4. Generate optimized versions
 * 
 * Usage: node scripts/optimize-images.js
 */

const fs = require('fs');
const path = require('path');

console.log('🖼️  Image Optimization Script\n');

// Check if images directory exists
const imagesDir = path.join(__dirname, '../frontend/public/images');

if (!fs.existsSync(imagesDir)) {
  console.log('📁 No images directory found.');
  console.log('✅ Landing page uses icons (Font Awesome) - no images to optimize!');
  console.log('\n💡 If you add images in the future:');
  console.log('   1. Install: npm install --save-dev imagemin imagemin-webp imagemin-mozjpeg imagemin-pngquant');
  console.log('   2. Place images in: frontend/public/images/');
  console.log('   3. Run this script again');
  process.exit(0);
}

// Check if imagemin is installed
try {
  require('imagemin');
  require('imagemin-webp');
  require('imagemin-mozjpeg');
  require('imagemin-pngquant');
} catch (error) {
  console.log('❌ Image optimization packages not installed.');
  console.log('\n📦 Install with:');
  console.log('   npm install --save-dev imagemin imagemin-webp imagemin-mozjpeg imagemin-pngquant');
  process.exit(1);
}

const imagemin = require('imagemin');
const imageminWebp = require('imagemin-webp');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminPngquant = require('imagemin-pngquant');

async function optimizeImages() {
  console.log('🔍 Scanning for images...\n');

  // Optimize JPG/JPEG
  const jpgFiles = await imagemin([`${imagesDir}/*.{jpg,jpeg}`], {
    destination: `${imagesDir}/optimized`,
    plugins: [
      imageminMozjpeg({ quality: 80 })
    ]
  });

  // Optimize PNG
  const pngFiles = await imagemin([`${imagesDir}/*.png`], {
    destination: `${imagesDir}/optimized`,
    plugins: [
      imageminPngquant({ quality: [0.6, 0.8] })
    ]
  });

  // Convert to WebP
  const webpFiles = await imagemin([`${imagesDir}/*.{jpg,jpeg,png}`], {
    destination: `${imagesDir}/webp`,
    plugins: [
      imageminWebp({ quality: 80 })
    ]
  });

  console.log(`✅ Optimized ${jpgFiles.length} JPG files`);
  console.log(`✅ Optimized ${pngFiles.length} PNG files`);
  console.log(`✅ Converted ${webpFiles.length} files to WebP`);
  
  if (jpgFiles.length + pngFiles.length + webpFiles.length === 0) {
    console.log('\n📭 No images found to optimize.');
    console.log('✅ Landing page uses icons - this is optimal!');
  } else {
    console.log('\n📊 Optimization complete!');
    console.log('   - Optimized images: frontend/public/images/optimized/');
    console.log('   - WebP versions: frontend/public/images/webp/');
  }
}

optimizeImages().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
