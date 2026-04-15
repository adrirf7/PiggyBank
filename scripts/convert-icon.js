#!/usr/bin/env node
/**
 * Convert Piggy Bank SVG icon to PNG formats required by Expo
 * Run with: node scripts/convert-icon.js
 */

const fs = require("fs");
const path = require("path");

// Sizes needed for different platforms
const ICON_SIZES = {
  "icon.png": 192,
  "favicon.png": 192,
  "splash-icon.png": 200,
  "android-icon-foreground.png": 192,
  "android-icon-background.png": 192,
  "android-icon-monochrome.png": 192,
};

async function convertSvgToPng() {
  try {
    const sharp = require("sharp");

    const svgPath = path.join(__dirname, "../assets/images/Piggy-bank-icon.svg");
    const assetsDir = path.join(__dirname, "../assets/images");

    if (!fs.existsSync(svgPath)) {
      console.error(`❌ Error: SVG file not found at ${svgPath}`);
      process.exit(1);
    }

    console.log("🎨 Converting SVG icon to PNG formats...\n");

    const svgBuffer = fs.readFileSync(svgPath);

    for (const [filename, size] of Object.entries(ICON_SIZES)) {
      const outputPath = path.join(assetsDir, filename);

      try {
        console.log(`  📝 Creating ${filename} (${size}x${size})...`);

        await sharp(svgBuffer)
          .resize(size, size, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toFile(outputPath);

        console.log(`     ✅ Created ${filename}`);
      } catch (error) {
        console.error(`     ❌ Error creating ${filename}: ${error.message}`);
        throw error;
      }
    }

    console.log("\n✅ All icons converted successfully!");
    return true;
  } catch (error) {
    if (error.code === "MODULE_NOT_FOUND" && error.message.includes("sharp")) {
      console.error("❌ sharp library not found");
      console.error("\nTo use this script, install sharp:");
      console.error("  npm install --save-dev sharp\n");
      process.exit(1);
    }
    throw error;
  }
}

convertSvgToPng().catch((error) => {
  console.error("Conversion failed:", error);
  process.exit(1);
});
