const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration for HealthSync Pro
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  transformer: {
    // Enable inline requires for faster startup
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    // Support additional file extensions
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json', 'cjs', 'mjs'],
    // Asset extensions
    assetExts: [
      'bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp',
      'mp4', 'mov', 'mp3', 'wav', 'aac',
      'ttf', 'otf', 'woff', 'woff2',
      'pdf', 'zip',
      'db', 'sqlite',
    ],
  },
  // Improve build performance
  maxWorkers: 4,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
