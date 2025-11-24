const fs = require('fs');
const path = require('path');

// Icon sizes needed for favicon and PWA
const iconSizes = [
  // Favicon sizes
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 48, name: 'favicon-48x48.png' },
  
  // PWA icon sizes
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  
  // Apple touch icons
  { size: 180, name: 'apple-touch-icon.png' },
  
  // Android icons
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' }
];

const sourceImage = path.join(__dirname, '../public/White on black (1).png');
const iconsDir = path.join(__dirname, '../public/icons');
const publicDir = path.join(__dirname, '../public');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🔄 Converting logo to favicon and PWA icons...');
console.log(`📁 Source: ${sourceImage}`);
console.log(`📁 Output: ${iconsDir}`);

// For now, we'll copy the source image to all required sizes
// In production, you'd want to use a proper image processing library like sharp
iconSizes.forEach(({ size, name }) => {
  const outputPath = path.join(iconsDir, name);
  
  // Copy the source image to the output path
  // Note: This is a simple copy - in production you'd resize the image
  try {
    fs.copyFileSync(sourceImage, outputPath);
    console.log(`✅ Created ${name} (${size}x${size})`);
  } catch (error) {
    console.log(`❌ Failed to create ${name}: ${error.message}`);
  }
});

// Also create favicon.ico in the public root
const faviconPath = path.join(publicDir, 'favicon.ico');
try {
  fs.copyFileSync(sourceImage, faviconPath);
  console.log('✅ Created favicon.ico');
} catch (error) {
  console.log(`❌ Failed to create favicon.ico: ${error.message}`);
}

console.log('\n🎉 Icon generation complete!');
console.log('📝 Note: For production, use a proper image processing library like "sharp" to resize images properly.');
console.log('📝 The current script copies the source image to all sizes - you may want to resize them manually or use an online favicon generator.');
